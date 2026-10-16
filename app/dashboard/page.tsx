import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/app/components/Sidebar";

const STATUSI = [
  { value: "novi", label: "Novi Lead", boja: "bg-blue-500" },
  { value: "pregovori", label: "U pregovorima", boja: "bg-amber-500" },
  { value: "zatvoren", label: "Zatvoren (Ugovoreno)", boja: "bg-emerald-500" },
  { value: "izgubljen", label: "Izgubljen", boja: "bg-rose-400" },
];

function danasnjiDatum() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Belgrade" });
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
      supabase.from("klijenti").select("id, ime, status, vrednost"),
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

  const danas = danasnjiDatum();
  const otvoreni = z.filter((x) => !x.zavrsen);
  const kasne = otvoreni.filter((x) => x.rok && x.rok < danas);

  // Napredna analiza finansija
  const ugovoreno = k.filter((x) => x.status === "zatvoren").reduce((acc, curr) => acc + (curr.vrednost ?? 0), 0);
  const uPipelineU = k.filter((x) => x.status === "pregovori" || x.status === "novi").reduce((acc, curr) => acc + (curr.vrednost ?? 0), 0);

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar email={user.email} />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Finansijski pregled, pipeline i analitika</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/kanban"
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
              >
                Prodajni tok
              </Link>
              <Link
                href="/klijenti"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition shadow-sm"
              >
                + Klijenti
              </Link>
            </div>
          </div>

          {/* Glavni KPI Pokazatelji */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ugovoreno</p>
              <p className="mt-2 text-2xl font-extrabold text-emerald-600">{ugovoreno.toLocaleString()} RSD</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Otvoren Pipeline</p>
              <p className="mt-2 text-2xl font-extrabold text-blue-600">{uPipelineU.toLocaleString()} RSD</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ukupno Leada</p>
              <p className="mt-2 text-2xl font-extrabold text-gray-900">{k.length}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Zadaci koji kasne</p>
              <p className="mt-2 text-2xl font-extrabold text-rose-600">{kasne.length}</p>
            </div>
          </div>

          {/* Grafikon po fazama */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Distribucija klijenata po fazama</h2>
            <div className="space-y-3">
              {poStatusu.map((s) => (
                <div key={s.value} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 text-sm font-medium text-gray-600">{s.label}</span>
                  <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${s.boja}`}
                      style={{ width: `${(s.broj / maks) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-bold text-gray-900">{s.broj}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hitni Zadaci */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Najhitniji zadaci</h2>
              <Link href="/zadaci" className="text-xs font-semibold text-blue-600 hover:underline">
                Pogledaj sve
              </Link>
            </div>
            {hitni.length === 0 ? (
              <p className="text-sm text-gray-500">Nema otvorenih zadataka.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {hitni.map((t) => {
                  const jeKasni = t.rok && t.rok < danas;
                  return (
                    <li key={t.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{t.naslov}</p>
                        <p className="truncate text-xs text-gray-500">{imena.get(t.klijent_id) ?? "—"}</p>
                      </div>
                      <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg ${jeKasni ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-gray-100 text-gray-600"}`}>
                        {t.rok ? t.rok.split("-").reverse().join(".") + "." : "Bez roka"}
                      </span>
                    </li>
                  );
                })}
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
    <Suspense fallback={<p className="p-6 text-gray-500">Učitavanje dashboarda...</p>}>
      <DashboardSadrzaj />
    </Suspense>
  );
}