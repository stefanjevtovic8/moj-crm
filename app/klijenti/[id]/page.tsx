import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Header from "@/app/components/Header";
import KomunikacijaLista from "./KomunikacijaLista";

async function KlijentSadrzaj({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: klijent } = await supabase
    .from("klijenti")
    .select("*")
    .eq("id", id)
    .single();
  if (!klijent) notFound();

  const { data: komunikacija } = await supabase
    .from("komunikacija")
    .select("*")
    .eq("klijent_id", id)
    .order("datum", { ascending: false });

  const { data: zadaci } = await supabase
    .from("zadaci")
    .select("*")
    .eq("klijent_id", id)
    .eq("zavrsen", false)
    .order("rok", { ascending: true, nullsFirst: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header email={user.email} aktivno="klijenti" />
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <Link href="/klijenti" className="text-sm text-blue-600 hover:underline">
          ← Nazad na klijente
        </Link>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-gray-900">{klijent.ime}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {[klijent.telefon, klijent.email].filter(Boolean).join(" · ") || "Nema kontakta"}
          </p>
          <p className="mt-2 text-sm text-gray-600">Status: {klijent.status ?? "novi"}</p>
          {klijent.napomena && (
            <p className="mt-2 text-sm text-gray-600">{klijent.napomena}</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Otvoreni zadaci</h3>
          {(zadaci ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">Nema otvorenih zadataka.</p>
          ) : (
            <ul className="space-y-2">
              {(zadaci ?? []).map((z) => (
                <li key={z.id} className="flex justify-between text-sm">
                  <span className="text-gray-900">{z.naslov}</span>
                  <span className="text-gray-500">
                    {z.rok ? z.rok.split("-").reverse().join(".") + "." : "bez roka"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <KomunikacijaLista klijentId={id} pocetni={komunikacija ?? []} />
      </main>
    </div>
  );
}

export default function KlijentStranica({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Učitavanje...</p>}>
      <KlijentSadrzaj params={params} />
    </Suspense>
  );
}