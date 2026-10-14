import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Klijenti</h1>
        <form action="/auth/signout" method="post">
          <button className="text-sm text-gray-600 hover:underline">
            Odjavi se ({user.email})
          </button>
        </form>
      </div>

      <KlijentiLista pocetni={klijenti ?? []} />
    </main>
  );
}

export default function KlijentiPage() {
  return (
    <Suspense fallback={<p className="p-6">Učitavanje...</p>}>
      <KlijentiSadrzaj />
    </Suspense>
  );
}