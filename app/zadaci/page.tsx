import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import ZadaciLista from "./ZadaciLista";

async function ZadaciSadrzaj() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: zadaci } = await supabase
    .from("zadaci")
    .select("*")
    .order("zavrsen", { ascending: true })
    .order("rok", { ascending: true, nullsFirst: false });

  const { data: klijenti } = await supabase
    .from("klijenti")
    .select("id, ime")
    .order("ime", { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                C
              </div>
              <h1 className="text-lg font-semibold text-gray-900">Moj CRM</h1>
            </div>
            <nav className="flex gap-4 text-sm">
              <Link href="/klijenti" className="text-gray-600 hover:text-gray-900">Klijenti</Link>
              <Link href="/zadaci" className="font-medium text-blue-600">Zadaci</Link>
            </nav>
          </div>
          <form action="/auth/signout" method="post" className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-500 sm:inline">{user.email}</span>
            <button className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
              Odjavi se
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <ZadaciLista pocetni={zadaci ?? []} klijenti={klijenti ?? []} />
      </main>
    </div>
  );
}

export default function ZadaciPage() {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Učitavanje...</p>}>
      <ZadaciSadrzaj />
    </Suspense>
  );
}