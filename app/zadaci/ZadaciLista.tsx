"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Zadatak = {
  id: string;
  klijent_id: string;
  naslov: string;
  rok: string | null;
  zavrsen: boolean | null;
};

type KlijentMini = { id: string; ime: string };

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all";

function danas() {
  const d = new Date();
  const mesec = String(d.getMonth() + 1).padStart(2, "0");
  const dan = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mesec}-${dan}`;
}

function formatDatum(iso: string) {
  const [g, m, d] = iso.split("-");
  return `${d}.${m}.${g}.`;
}

export default function ZadaciLista({
  pocetni,
  klijenti,
}: {
  pocetni: Zadatak[];
  klijenti: KlijentMini[];
}) {
  const supabase = createClient();
  const [zadaci, setZadaci] = useState<Zadatak[]>(pocetni);
  const [naslov, setNaslov] = useState("");
  const [rok, setRok] = useState("");
  const [klijentId, setKlijentId] = useState(klijenti[0]?.id ?? "");
  const [filter, setFilter] = useState<"otvoreni" | "zavrseni" | "svi">("otvoreni");
  const [error, setError] = useState("");

  const imeKlijenta = (id: string) =>
    klijenti.find((k) => k.id === id)?.ime ?? "Nepoznat klijent";

  async function dodaj(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!klijentId) {
      setError("Prvo dodaj bar jednog klijenta.");
      return;
    }

    const { data, error } = await supabase
      .from("zadaci")
      .insert({ naslov, rok: rok || null, klijent_id: klijentId })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }
    setZadaci([data, ...zadaci]);
    setNaslov("");
    setRok("");
  }

  async function prebaci(z: Zadatak) {
    const novo = !z.zavrsen;
    const { error } = await supabase.from("zadaci").update({ zavrsen: novo }).eq("id", z.id);
    if (error) {
      setError(error.message);
      return;
    }
    setZadaci(zadaci.map((x) => (x.id === z.id ? { ...x, zavrsen: novo } : x)));
  }

  async function obrisi(id: string) {
    if (!confirm("Obrisati zadatak?")) return;
    const { error } = await supabase.from("zadaci").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setZadaci(zadaci.filter((z) => z.id !== id));
  }

  const sada = danas();
  const prikaz = zadaci
    .filter((z) =>
      filter === "svi" ? true : filter === "zavrseni" ? !!z.zavrsen : !z.zavrsen
    )
    .sort((a, b) => {
      if (!!a.zavrsen !== !!b.zavrsen) return a.zavrsen ? 1 : -1;
      if (!a.rok && !b.rok) return 0;
      if (!a.rok) return 1;
      if (!b.rok) return -1;
      return a.rok.localeCompare(b.rok);
    });

  const kasni = zadaci.filter((z) => !z.zavrsen && z.rok && z.rok < sada).length;
  const danasnji = zadaci.filter((z) => !z.zavrsen && z.rok === sada).length;
  const otvoreni = zadaci.filter((z) => !z.zavrsen).length;

  return (
    <div className="space-y-6">
      {/* Zaglavlje stranice */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Zadaci</h1>
        <p className="text-sm text-gray-500">Praćenje obaveza, rokova i zadataka za klijente</p>
      </div>

      {/* Kartice */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Otvoreni</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{otvoreni}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Za danas</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{danasnji}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Kasne</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{kasni}</p>
        </div>
      </div>

      {/* Forma za novi zadatak */}
      <form onSubmit={dodaj} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Novi zadatak</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <input
            placeholder="Šta treba uraditi?"
            value={naslov}
            onChange={(e) => setNaslov(e.target.value)}
            required
            className={`${inputCls} sm:col-span-2`}
          />
          <select value={klijentId} onChange={(e) => setKlijentId(e.target.value)} className={inputCls}>
            {klijenti.length === 0 && <option value="">Nema klijenata</option>}
            {klijenti.map((k) => (
              <option key={k.id} value={k.id}>{k.ime}</option>
            ))}
          </select>
          <input type="date" value={rok} onChange={(e) => setRok(e.target.value)} className={inputCls} />
        </div>
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition shadow-sm">
          + Dodaj zadatak
        </button>
      </form>

      {/* Filteri */}
      <div className="flex gap-2">
        {(["otvoreni", "zavrseni", "svi"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition ${
              filter === f
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {f === "otvoreni" ? "Otvoreni" : f === "zavrseni" ? "Završeni" : "Svi"}
          </button>
        ))}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">{error}</p>}

      {/* Lista zadataka */}
      <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {prikaz.length === 0 && (
          <li className="p-8 text-center text-sm text-gray-500">Nema zadataka.</li>
        )}
        {prikaz.map((z) => {
          const kasni = !z.zavrsen && z.rok && z.rok < sada;
          const jeDanas = !z.zavrsen && z.rok === sada;
          return (
            <li key={z.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition">
              <input
                type="checkbox"
                checked={!!z.zavrsen}
                onChange={() => prebaci(z)}
                className="h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="min-w-0 flex-1">
                <p className={`truncate font-medium text-sm ${z.zavrsen ? "text-gray-400 line-through" : "text-gray-900"}`}>
                  {z.naslov}
                </p>
                <p className="truncate text-xs text-gray-500">{imeKlijenta(z.klijent_id)}</p>
              </div>
              {z.rok && (
                <span
                  className={`shrink-0 rounded-xl px-2.5 py-1 text-xs font-semibold ${
                    kasni
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : jeDanas
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-gray-100 text-gray-600 border border-gray-200"
                  }`}
                >
                  {formatDatum(z.rok)}
                </span>
              )}
              <button onClick={() => obrisi(z.id)} className="shrink-0 text-xs font-medium text-red-600 hover:underline">
                Obriši
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}