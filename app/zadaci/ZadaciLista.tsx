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
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

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
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Otvoreni</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{otvoreni}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Za danas</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">{danasnji}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Kasne</p>
          <p className="mt-1 text-2xl font-semibold text-red-600">{kasni}</p>
        </div>
      </div>

      <form onSubmit={dodaj} className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Novi zadatak</h2>
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
        <button className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Dodaj zadatak
        </button>
      </form>

      <div className="flex gap-2">
        {(["otvoreni", "zavrseni", "svi"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === f
                ? "bg-blue-600 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {f === "otvoreni" ? "Otvoreni" : f === "zavrseni" ? "Završeni" : "Svi"}
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {prikaz.length === 0 && (
          <li className="p-8 text-center text-sm text-gray-500">Nema zadataka.</li>
        )}
        {prikaz.map((z) => {
          const kasni = !z.zavrsen && z.rok && z.rok < sada;
          const jeDanas = !z.zavrsen && z.rok === sada;
          return (
            <li key={z.id} className="flex items-center gap-3 p-4 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={!!z.zavrsen}
                onChange={() => prebaci(z)}
                className="h-5 w-5 cursor-pointer rounded border-gray-300"
              />
              <div className="min-w-0 flex-1">
                <p className={`truncate font-medium ${z.zavrsen ? "text-gray-400 line-through" : "text-gray-900"}`}>
                  {z.naslov}
                </p>
                <p className="truncate text-sm text-gray-500">{imeKlijenta(z.klijent_id)}</p>
              </div>
              {z.rok && (
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                    kasni
                      ? "bg-red-100 text-red-700"
                      : jeDanas
                      ? "bg-amber-100 text-amber-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {formatDatum(z.rok)}
                </span>
              )}
              <button onClick={() => obrisi(z.id)} className="shrink-0 text-sm text-red-600 hover:underline">
                Obriši
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}