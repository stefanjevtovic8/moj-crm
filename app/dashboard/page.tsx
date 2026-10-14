import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Header from "@/app/components/Header";

const STATUSI = [
  { value: "novi", label: "Novi", boja: "bg-blue-500" },
  { value: "pregovori", label: "U pregovorima", boja: "bg-amber-500" },
  { value: "zatvoren", label: "Zatvoren", boja: "bg-green-500" },
  { value: "izgubljen", label: "Izgubljen", boja: "bg-gray-400" },
];

const IKONE: Record<string, string> = {
  poziv: "📞",
  email: "✉️",
  sastanak: "🤝",
  poruka: "💬",
  ostalo: "📝",
};

function pre30Dana() {
  return Date.now() - 30 * 24 * 60 * 60 * 1000;
}

async function DashboardSadrzaj() {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: klijenti }, { data: zadaci }, { data: komunikacija }] =
    await Promise.all([
      supabase.from("klijenti").select("id, ime, status"),
      supabase.from("zadaci").select("id, naslov, rok, zavrsen, klijent_id"),
      supabase
        .from("komunikacija")
        .select("id, klijent_id, tip, opis, datum")
        .order("datum", { ascending: false }),
    ]);

  const k = klijenti ?? [];
  const z = zadaci ?? [];
  const kom = komunikacija ?? [];

  const imena = new Map(k.map((x) => [x.id, x.ime]));
  const danas = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Belgrade" });
  const pre30 = pre30Dana();

  const otvoreni = z.filter((x) => !x.zavrsen);
  const kasne = otvoreni.filter((x) => x.rok && x.rok < danas);
  const kontakti30 = kom.filter((x) => new Date(x.datum).getTime() >= pre30).length;

  const poStatusu = STATUSI.map((s) => ({
    ...s,
    broj: k.filter((x) => (x.status ?? "novi") === s.value).length,
  }));
  const maks = Math.max(1, ...poStatusu.map((s) => s.broj));

  const hitni = [...otvoreni]
    .sort((a, b) => {
      if (!a.rok && !b.rok) return 0;
      if (!a.rok) return 1;
      if (!b.rok) return -1;
      return a.rok.localeCompare(b.rok);
    })
    .slice(0, 5);

  const poslednji = kom.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header email={user.email} aktivno="dashboard" />
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Klijenti</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{k.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Otvoreni zadaci</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{otvoreni.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Kasne</p>
            <p className="mt-1 text-2xl font-semibold text-red-600">{kasne.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Kontakti (30 dana)</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{kontakti30}</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Klijenti po statusu</h2>
          <div className="space-y-3">
            {poStatusu.map((s) => (
              <div key={s.value} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm text-gray-600">{s.label}</span>
                <div className="h-5 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${s.boja}`}
                    style={{ width: `${(s.broj / maks) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-sm font-medium text-gray-900">{s.broj}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Najhitniji zadaci</h2>
              <Link href="/zadaci" className="text-xs text-blue-600 hover:underline">Svi zadaci</Link>
            </div>
            {hitni.length === 0 ? (
              <p className="text-sm text-gray-500">Nema otvorenih zadataka.</p>
            ) : (
              <ul className="space-y-3">
                {hitni.map((t) => {
                  const kasni = t.rok && t.rok < danas;
                  return (
                    <li key={t.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{t.naslov}</p>
                        <p className="truncate text-xs text-gray-500">{imena.get(t.klijent_id) ?? "—"}</p>
                      </div>
                      <span className={`shrink-0 text-xs font-medium ${kasni ? "text-red-600" : "text-gray-500"}`}>
                        {t.rok ? t.rok.split("-").reverse().join(".") + "." : "bez roka"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Poslednja aktivnost</h2>
            {poslednji.length === 0 ? (
              <p className="text-sm text-gray-500">Još nema zabeleženih kontakata.</p>
            ) : (
              <ul className="space-y-3">
                {poslednji.map((u) => (
                  <li key={u.id} className="flex gap-3">
                    <span className="text-lg">{IKONE[u.tip] ?? "📝"}</span>
                    <div className="min-w-0">
                      <Link
                        href={`/klijenti/${u.klijent_id}`}
                        className="block truncate text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {imena.get(u.klijent_id) ?? "—"}
                      </Link>
                      <p className="truncate text-xs text-gray-500">{u.opis}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Učitavanje...</p>}>
      <DashboardSadrzaj />
    </Suspense>
  );
}