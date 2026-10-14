"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Klijent = {
  id: string;
  ime: string;
  telefon: string | null;
  email: string | null;
  status: string | null;
  napomena: string | null;
};

const STATUSI = [
  { value: "novi", label: "Novi", boja: "bg-blue-100 text-blue-800", tacka: "bg-blue-500" },
  { value: "pregovori", label: "U pregovorima", boja: "bg-amber-100 text-amber-800", tacka: "bg-amber-500" },
  { value: "zatvoren", label: "Zatvoren", boja: "bg-green-100 text-green-800", tacka: "bg-green-500" },
  { value: "izgubljen", label: "Izgubljen", boja: "bg-gray-200 text-gray-700", tacka: "bg-gray-400" },
];

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

function inicijali(ime: string) {
  return ime
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function KlijentiLista({ pocetni }: { pocetni: Klijent[] }) {
  const supabase = createClient();
  const [klijenti, setKlijenti] = useState<Klijent[]>(pocetni);
  const [ime, setIme] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const [pretraga, setPretraga] = useState("");
  const [filterStatus, setFilterStatus] = useState("svi");

  const [izmenaId, setIzmenaId] = useState<string | null>(null);
  const [izmena, setIzmena] = useState({ ime: "", telefon: "", email: "", napomena: "" });

  async function dodaj(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const { data, error } = await supabase
      .from("klijenti")
      .insert({ ime, telefon, email })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }
    setKlijenti([data, ...klijenti]);
    setIme("");
    setTelefon("");
    setEmail("");
  }

  async function obrisi(id: string) {
    if (!confirm("Sigurno želiš da obrišeš klijenta?")) return;
    const { error } = await supabase.from("klijenti").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setKlijenti(klijenti.filter((k) => k.id !== id));
  }

  async function promeniStatus(id: string, status: string) {
    const { error } = await supabase.from("klijenti").update({ status }).eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setKlijenti(klijenti.map((k) => (k.id === id ? { ...k, status } : k)));
  }

  function otvoriIzmenu(k: Klijent) {
    setIzmenaId(k.id);
    setIzmena({
      ime: k.ime,
      telefon: k.telefon ?? "",
      email: k.email ?? "",
      napomena: k.napomena ?? "",
    });
  }

  async function sacuvajIzmenu(id: string) {
    const { error } = await supabase.from("klijenti").update(izmena).eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setKlijenti(klijenti.map((k) => (k.id === id ? { ...k, ...izmena } : k)));
    setIzmenaId(null);
  }

  const prikaz = klijenti.filter((k) => {
    const tekst = `${k.ime} ${k.telefon ?? ""} ${k.email ?? ""}`.toLowerCase();
    const poklapaSe = tekst.includes(pretraga.toLowerCase());
    const poklapaStatus = filterStatus === "svi" || (k.status ?? "novi") === filterStatus;
    return poklapaSe && poklapaStatus;
  });

  const broj = (s: string) => klijenti.filter((k) => (k.status ?? "novi") === s).length;

  return (
    <div className="space-y-6">
      {/* Statistika */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Ukupno</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{klijenti.length}</p>
        </div>
        {STATUSI.slice(0, 3).map((s) => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(filterStatus === s.value ? "svi" : s.value)}
            className={`rounded-xl border bg-white p-4 text-left transition hover:border-blue-300 ${
              filterStatus === s.value ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200"
            }`}
          >
            <p className="flex items-center gap-2 text-xs text-gray-500">
              <span className={`h-2 w-2 rounded-full ${s.tacka}`} />
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{broj(s.value)}</p>
          </button>
        ))}
      </div>

      {/* Dodavanje */}
      <form onSubmit={dodaj} className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Novi klijent</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <input placeholder="Ime i prezime" value={ime} onChange={(e) => setIme(e.target.value)} required className={inputCls} />
          <input placeholder="Telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} className={inputCls} />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          <button className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
            + Dodaj
          </button>
        </div>
      </form>

      {/* Pretraga */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          placeholder="Pretraži po imenu, telefonu, emailu..."
          value={pretraga}
          onChange={(e) => setPretraga(e.target.value)}
          className={`${inputCls} flex-1`}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={`${inputCls} sm:w-48`}
        >
          <option value="svi">Svi statusi</option>
          {STATUSI.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <p className="text-sm text-gray-500">
        Prikazano {prikaz.length} od {klijenti.length}
      </p>

      {/* Lista */}
      <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {prikaz.length === 0 && (
          <li className="p-8 text-center text-sm text-gray-500">
            {klijenti.length === 0 ? "Još nema klijenata. Dodaj prvog iznad." : "Nema rezultata za ovu pretragu."}
          </li>
        )}

        {prikaz.map((k) => {
          const st = STATUSI.find((s) => s.value === (k.status ?? "novi")) ?? STATUSI[0];

          if (izmenaId === k.id) {
            return (
              <li key={k.id} className="space-y-3 bg-blue-50/40 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <input value={izmena.ime} onChange={(e) => setIzmena({ ...izmena, ime: e.target.value })} className={inputCls} placeholder="Ime" />
                  <input value={izmena.telefon} onChange={(e) => setIzmena({ ...izmena, telefon: e.target.value })} className={inputCls} placeholder="Telefon" />
                  <input value={izmena.email} onChange={(e) => setIzmena({ ...izmena, email: e.target.value })} className={inputCls} placeholder="Email" />
                </div>
                <textarea
                  value={izmena.napomena}
                  onChange={(e) => setIzmena({ ...izmena, napomena: e.target.value })}
                  className={inputCls}
                  placeholder="Napomena"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button onClick={() => sacuvajIzmenu(k.id)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                    Sačuvaj
                  </button>
                  <button onClick={() => setIzmenaId(null)} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
                    Otkaži
                  </button>
                </div>
              </li>
            );
          }

          return (
            <li key={k.id} className="flex items-start justify-between gap-4 p-4 hover:bg-gray-50">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {inicijali(k.ime)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{k.ime}</p>
                  <p className="truncate text-sm text-gray-500">
                    {[k.telefon, k.email].filter(Boolean).join(" · ") || "Nema kontakta"}
                  </p>
                  {k.napomena && (
                    <p className="mt-1 text-sm text-gray-600">{k.napomena}</p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <select
                  value={k.status ?? "novi"}
                  onChange={(e) => promeniStatus(k.id, e.target.value)}
                  className={`cursor-pointer rounded-full border-0 px-3 py-1 text-xs font-medium ${st.boja}`}
                >
                  {STATUSI.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <div className="flex gap-3 text-sm">
                  <button onClick={() => otvoriIzmenu(k)} className="text-blue-600 hover:underline">Izmeni</button>
                  <button onClick={() => obrisi(k.id)} className="text-red-600 hover:underline">Obriši</button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}