"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Klijent = {
  id: string;
  ime: string;
  kompanija?: string | null;
  email: string | null;
  telefon: string | null;
  status: string | null;
  vrednost?: number | null;
};

const FAZE = [
  { id: "novi", naziv: "Novi klijent", boja: "border-blue-500 bg-blue-50/50" },
  { id: "pregovori", naziv: "U pregovorima", boja: "border-amber-500 bg-amber-50/50" },
  { id: "zatvoren", naziv: "Zatvoreno (Uspelo)", boja: "border-emerald-500 bg-emerald-50/50" },
  { id: "izgubljen", naziv: "Izgubljeno", boja: "border-rose-400 bg-rose-50/50" },
];

// Bezbedna funkcija za formatiranje brojeva bez hydration greške
function formatBroj(broj: number) {
  return broj.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function KanbanBoard({ pocetni }: { pocetni: Klijent[] }) {
  const supabase = createClient();
  const [klijenti, setKlijenti] = useState<Klijent[]>(pocetni);

  async function prebaciFazu(id: string, novaFaza: string) {
    const { error } = await supabase
      .from("klijenti")
      .update({ status: novaFaza })
      .eq("id", id);

    if (!error) {
      setKlijenti(klijenti.map((k) => (k.id === id ? { ...k, status: novaFaza } : k)));
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      {FAZE.map((faza) => {
        const klijentiUFazi = klijenti.filter((k) => (k.status ?? "novi") === faza.id);
        const ukupnaVrednost = klijentiUFazi.reduce((acc, curr) => acc + (curr.vrednost ?? 0), 0);

        return (
          <div key={faza.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
            {/* Zaglavlje kolone */}
            <div className={`border-l-4 ${faza.boja} pl-3 py-1 flex justify-between items-center`}>
              <div>
                <h2 className="text-sm font-bold text-gray-900">{faza.naziv}</h2>
                <p className="text-xs font-semibold text-gray-500">{formatBroj(ukupnaVrednost)} RSD</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
                {klijentiUFazi.length}
              </span>
            </div>

            {/* Lista kartica */}
            <div className="space-y-3 min-h-[350px]">
              {klijentiUFazi.length === 0 && (
                <div className="p-4 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">
                  Nema klijenata u ovoj fazi
                </div>
              )}
              {klijentiUFazi.map((k) => (
                <div
                  key={k.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition space-y-2"
                >
                  <div>
                    <Link href={`/klijenti/${k.id}`} className="font-semibold text-sm text-gray-900 hover:text-blue-600 block truncate">
                      {k.ime}
                    </Link>
                    {k.kompanija && (
                      <p className="text-xs font-medium text-gray-500 truncate">{k.kompanija}</p>
                    )}
                    <p className="text-xs text-gray-400 truncate">{k.email || "Nema emaila"}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs font-bold text-emerald-600">
                      {formatBroj(k.vrednost ?? 0)} RSD
                    </span>

                    {/* Izbor faze */}
                    <select
                      value={k.status ?? "novi"}
                      onChange={(e) => prebaciFazu(k.id, e.target.value)}
                      className="text-xs font-medium border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {FAZE.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.naziv}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}