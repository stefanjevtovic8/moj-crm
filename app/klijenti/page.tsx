import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Header from "@/app/components/Header";
import KlijentiLista from "./KlijentiLista";

async function KlijentiSadrzaj() {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: klijenti } = await supabase
    .from("klijenti")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header email={user.email} aktivno="klijenti" />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <KlijentiLista pocetni={klijenti ?? []} />
      </main>
    </div>
  );
}

export default function KlijentiPage() {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Učitavanje...</p>}>
      <KlijentiSadrzaj />
    </Suspense>
  );
}