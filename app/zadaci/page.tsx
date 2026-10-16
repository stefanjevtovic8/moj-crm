import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/app/components/Sidebar";
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar email={user.email} />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mx-auto max-w-4xl">
          <ZadaciLista pocetni={zadaci ?? []} klijenti={klijenti ?? []} />
        </div>
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