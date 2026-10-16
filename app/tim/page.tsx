"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/app/components/Sidebar";

type Profil = {
  id: string;
  email: string;
  uloga: string;
  created_at: string;
};

export default function TimPage() {
  const supabase = createClient();
  const [profili, setProfili] = useState<Profil[]>([]);
  const [trenutniEmail, setTrenutniEmail] = useState<string | null>(null);
  const [trenutnaUloga, setTrenutnaUloga] = useState<string>("zaposleni");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function ucitajPodatke() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setTrenutniEmail(user.email ?? null);
        const { data: mojProfil } = await supabase
          .from("profili")
          .select("uloga")
          .eq("id", user.id)
          .single();
        if (mojProfil) setTrenutnaUloga(mojProfil.uloga);
      }

      const { data } = await supabase.from("profili").select("*").order("created_at", { ascending: false });
      if (data) setProfili(data);
      setLoading(false);
    }
    ucitajPodatke();
  }, [supabase]);

  async function promeniUlogu(id: string, novaUloga: string) {
    if (trenutnaUloga !== "admin") {
      alert("Samo administrator može da menja uloge korisnika.");
      return;
    }

    const { error } = await supabase
      .from("profili")
      .update({ uloga: novaUloga })
      .eq("id", id);

    if (error) {
      alert(`Greška: ${error.message}`);
    } else {
      setProfili(profili.map((p) => (p.id === id ? { ...p, uloga: novaUloga } : p)));
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar email={trenutniEmail} />

      <main className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upravljanje timom</h1>
            <p className="text-sm text-gray-500">Pregled svih korisnika sistema i njihovih pristupnih uloga</p>
          </div>
          <span className="rounded-xl border border-gray-200 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50">
            Ukupno članova: {profili.length}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Učitavanje članova tima...</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Korisnik (Email)</th>
                  <th className="p-4">Trenutna uloga</th>
                  <th className="p-4">Datum registracije</th>
                  <th className="p-4 text-right">Akcija (Promeni ulogu)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {profili.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 font-medium text-gray-900 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-xs border border-blue-100">
                        {p.email[0].toUpperCase()}
                      </div>
                      {p.email}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                          p.uloga === "admin"
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : "bg-blue-100 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {p.uloga}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {new Date(p.created_at).toLocaleDateString("sr-RS")}
                    </td>
                    <td className="p-4 text-right">
                      <select
                        value={p.uloga}
                        onChange={(e) => promeniUlogu(p.id, e.target.value)}
                        disabled={trenutnaUloga !== "admin"}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                      >
                        <option value="zaposleni">Zaposleni</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}