import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/app/components/Sidebar";
import KanbanBoard from "./KanbanBoard";

async function KanbanSadrzaj() {
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar email={user.email} />
      <main className="flex-1 p-8 overflow-x-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prodajni tok</h1>
            <p className="text-sm text-gray-500">Vizuelno praćenje prodaje i faza pregovora</p>
          </div>
          <KanbanBoard pocetni={klijenti ?? []} />
        </div>
      </main>
    </div>
  );
}

export default function KanbanPage() {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Učitavanje pipeline-a...</p>}>
      <KanbanSadrzaj />
    </Suspense>
  );
}