"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Unos = {
  id: string;
  klijent_id: string;
  tip: string;
  opis: string;
  datum: string;
};

const TIPOVI = [
  { value: "poziv", label: "Poziv", ikona: "📞" },
  { value: "email", label: "Email", ikona: "✉️" },
  { value: "sastanak", label: "Sastanak", ikona: "🤝" },
  { value: "poruka", label: "Poruka", ikona: "💬" },
  { value: "ostalo", label: "Ostalo", ikona: "📝" },
];

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

export default function KomunikacijaLista({
  klijentId,
  pocetni,
}: {
  klijentId: string;
  pocetni: Unos[];
}) {
  const supabase = createClient();
  const [unosi, setUnosi] = useState<Unos[]>(pocetni);
  const [tip, setTip] = useState("poziv");
  const [opis, setOpis] = useState("");
  const [error, setError] = useState("");

  async function dodaj(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const { data, error } = await supabase
      .from("komunikacija")
      .insert({ klijent_id: klijentId, tip, opis })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }
    setUnosi([data, ...unosi]);
    setOpis("");
  }

  async function obrisi(id: string) {
    if (!confirm("Obrisati ovaj unos?")) return;
    const { error } = await supabase.from("komunikacija").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setUnosi(unosi.filter((u) => u.id !== id));
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">Istorija komunikacije</h3>

      <form onSubmit={dodaj} className="mb-5 space-y-3">
        <div className="grid gap-3 sm:grid-cols-4">
          <select value={tip} onChange={(e) => setTip(e.target.value)} className={inputCls}>
            {TIPOVI.map((t) => (
              <option key={t.value} value={t.value}>
                {t.ikona} {t.label}
              </option>
            ))}
          </select>
          <input
            placeholder="Šta je dogovoreno / rečeno?"
            value={opis}
            onChange={(e) => setOpis(e.target.value)}
            required
            className={`${inputCls} sm:col-span-3`}
          />
        </div>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Dodaj unos
        </button>
      </form>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {unosi.length === 0 ? (
        <p className="text-sm text-gray-500">Još nema zabeleženih kontakata.</p>
      ) : (
        <ul className="space-y-4">
          {unosi.map((u) => {
            const t = TIPOVI.find((x) => x.value === u.tip) ?? TIPOVI[4];
            return (
              <li key={u.id} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  {t.ikona}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-gray-900">{t.label}</p>
                    <span className="text-xs text-gray-500" suppressHydrationWarning>
                      {new Date(u.datum).toLocaleString("sr-RS", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{u.opis}</p>
                  <button
                    onClick={() => obrisi(u.id)}
                    className="mt-1 text-xs text-red-600 hover:underline"
                  >
                    Obriši
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}