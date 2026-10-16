"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/app/components/Sidebar";

type Klijent = {
  id: string;
  ime: string;
  status: string | null;
  vrednost: number | null;
};

function formatBroj(broj: number) {
  return broj.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function AnalitikaSadrzaj() {
  const supabase = createClient();
  const [klijenti, setKlijenti] = useState<Klijent[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function ucitajPodatke() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email ?? null);

      const { data } = await supabase.from("klijenti").select("*");
      if (data) setKlijenti(data);
      setLoading(false);
    }
    ucitajPodatke();
  }, [supabase]);

  const lista = klijenti || [];
  const ukupnoKlijenata = lista.length;
  const ukupnaVrednost = lista.reduce((acc, curr) => acc + (curr.vrednost ?? 0), 0);

  const novi = lista.filter((k) => k.status === "novi" || !k.status);
  const pregovori = lista.filter((k) => k.status === "pregovori");
  const zatvoreni = lista.filter((k) => k.status === "zatvoren");
  const izgubljeni = lista.filter((k) => k.status === "izgubljen");

  const vrednostNovi = novi.reduce((acc, curr) => acc + (curr.vrednost ?? 0), 0);
  const vrednostPregovori = pregovori.reduce((acc, curr) => acc + (curr.vrednost ?? 0), 0);
  const vrednostZatvoreni = zatvoreni.reduce((acc, curr) => acc + (curr.vrednost ?? 0), 0);
  const vrednostIzgubljeni = izgubljeni.reduce((acc, curr) => acc + (curr.vrednost ?? 0), 0);

  const zavrseniUkupno = zatvoreni.length + izgubljeni.length;
  const procenatUspeha = zavrseniUkupno > 0 ? Math.round((zatvoreni.length / zavrseniUkupno) * 100) : 0;

  const maxVrednost = Math.max(vrednostNovi, vrednostPregovori, vrednostZatvoreni, vrednostIzgubljeni, 1);

  const fazePodaci = [
    { id: "novi", naziv: "Novi klijenti", vrednost: vrednostNovi, broj: novi.length, boja: "bg-blue-500" },
    { id: "pregovori", naziv: "U pregovorima", vrednost: vrednostPregovori, broj: pregovori.length, boja: "bg-amber-500" },
    { id: "zatvoren", naziv: "Zatvoreno (Uspelo)", vrednost: vrednostZatvoreni, broj: zatvoreni.length, boja: "bg-emerald-500" },
    { id: "izgubljen", naziv: "Izgubljeno", vrednost: vrednostIzgubljeni, broj: izgubljeni.length, boja: "bg-rose-500" },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar email={email} />

      <main className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analitika i Izveštaji</h1>
          <p className="text-sm text-gray-500">Vizuelni pregled finansijskih pokazatelja i uspešnosti tima</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Učitavanje vizuelnih izveštaja...</div>
        ) : (
          <>
            {/* KPI Kartice */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-1">
                <p className="text-xs font-semibold text-gray-500">Ukupan potencijal</p>
                <p className="text-2xl font-bold text-gray-900">{formatBroj(ukupnaVrednost)} RSD</p>
                <p className="text-xs text-gray-400">Svi uneti poslovi ({ukupnoKlijenata})</p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 shadow-sm space-y-1">
                <p className="text-xs font-semibold text-emerald-700">Realizovano</p>
                <p className="text-2xl font-bold text-emerald-800">{formatBroj(vrednostZatvoreni)} RSD</p>
                <p className="text-xs text-emerald-600">{zatvoreni.length} ugovorenih poslova</p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5 shadow-sm space-y-1">
                <p className="text-xs font-semibold text-amber-700">Aktivni pregovori</p>
                <p className="text-2xl font-bold text-amber-800">{formatBroj(vrednostPregovori)} RSD</p>
                <p className="text-xs text-amber-600">{pregovori.length} otvorenih poslova</p>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-5 shadow-sm space-y-1">
                <p className="text-xs font-semibold text-blue-700">Stopa konverzije</p>
                <p className="text-2xl font-bold text-blue-800">{procenatUspeha}%</p>
                <p className="text-xs text-blue-600">Procenat uspešno zatvorenih</p>
              </div>
            </div>

            {/* Grafikoni sekcija */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* 1. Stubičasti Grafikon (Bar Chart) */}
              <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Vrednost poslova po fazama</h2>
                    <p className="text-xs text-gray-500">Poređenje finansijskog potencijala u RSD</p>
                  </div>
                  <span className="rounded-xl bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    Finansije
                  </span>
                </div>

                <div className="h-64 flex items-end gap-6 pt-8 pb-2 px-4 border-b border-gray-100">
                  {fazePodaci.map((faza) => {
                    const visinaProcenat = Math.max(Math.round((faza.vrednost / maxVrednost) * 100), 4);
                    return (
                      <div key={faza.id} className="flex-1 flex flex-col items-center h-full justify-end group">
                        <span className="text-[11px] font-bold text-gray-700 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatBroj(faza.vrednost)}
                        </span>
                        <div
                          style={{ height: `${visinaProcenat}%` }}
                          className={`w-full max-w-[48px] rounded-t-xl ${faza.boja} transition-all duration-500 group-hover:brightness-110 shadow-sm`}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  {fazePodaci.map((faza) => (
                    <div key={faza.id} className="space-y-0.5">
                      <p className="text-xs font-semibold text-gray-900 truncate">{faza.naziv}</p>
                      <p className="text-[11px] text-gray-400">{faza.broj} klijent(a)</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Donat/Krofna Grafikon (SVG Ring) */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-6">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Uspešnost prodaje</h2>
                  <p className="text-xs text-gray-500">Odnos uspešnih vs ostalih poslova</p>
                </div>

                <div className="relative flex items-center justify-center py-4">
                  <svg className="h-44 w-44 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-100"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500 transition-all duration-1000 ease-out"
                      strokeDasharray={`${procenatUspeha}, 100`}
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-extrabold text-gray-900">{procenatUspeha}%</span>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Uspeh</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="font-medium text-gray-600">Zatvoreno (Dobijeni)</span>
                    </div>
                    <span className="font-bold text-gray-900">{zatvoreni.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                      <span className="font-medium text-gray-600">Izgubljeni poslovi</span>
                    </div>
                    <span className="font-bold text-gray-900">{izgubljeni.length}</span>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
}