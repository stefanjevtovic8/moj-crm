"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import CsvModul from "./csvModul";

type Klijent = {
  id: string;
  ime: string;
  kompanija: string | null;
  telefon: string | null;
  email: string | null;
  status: string | null;
  vrednost: number | null;
  napomena: string | null;
};

const STATUSI = [
  { value: "novi", label: "Novi klijent", boja: "bg-blue-50 text-blue-700 border-blue-200", tacka: "bg-blue-500" },
  { value: "pregovori", label: "U pregovorima", boja: "bg-amber-50 text-amber-700 border-amber-200", tacka: "bg-amber-500" },
  { value: "zatvoren", label: "Zatvoreno (Uspelo)", boja: "bg-emerald-50 text-emerald-700 border-emerald-200", tacka: "bg-emerald-500" },
  { value: "izgubljen", label: "Izgubljeno", boja: "bg-gray-100 text-gray-700 border-gray-200", tacka: "bg-gray-400" },
];

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all";

// Bezbedna funkcija za formatiranje brojeva bez hydration greške
function formatBroj(broj: number) {
  return broj.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

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
  const [kompanija, setKompanija] = useState("");
  const [vrednost, setVrednost] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const [pretraga, setPretraga] = useState("");
  const [filterStatus, setFilterStatus] = useState("svi");

  const [izmenaId, setIzmenaId] = useState<string | null>(null);
  const [izmena, setIzmena] = useState({ ime: "", kompanija: "", vrednost: "", telefon: "", email: "", napomena: "" });

  async function dodaj(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const numVrednost = vrednost ? parseFloat(vrednost) : 0;

    const { data, error } = await supabase
      .from("klijenti")
      .insert({
        ime,
        kompanija: kompanija || null,
        vrednost: numVrednost,
        telefon: telefon || null,
        email: email || null,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }
    setKlijenti([data, ...klijenti]);
    setIme("");
    setKompanija("");
    setVrednost("");
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
      kompanija: k.kompanija ?? "",
      vrednost: k.vrednost ? String(k.vrednost) : "",
      telefon: k.telefon ?? "",
      email: k.email ?? "",
      napomena: k.napomena ?? "",
    });
  }

  async function sacuvajIzmenu(id: string) {
    const numVrednost = izmena.vrednost ? parseFloat(izmena.vrednost) : 0;
    const payload = { ...izmena, vrednost: numVrednost };

    const { error } = await supabase.from("klijenti").update(payload).eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setKlijenti(klijenti.map((k) => (k.id === id ? { ...k, ...payload } : k)));
    setIzmenaId(null);
  }

  function hendlujNoveUvezene(novi: Klijent[]) {
    setKlijenti((prethodni) => [...novi, ...prethodni]);
  }

  const prikaz = klijenti.filter((k) => {
    const tekst = `${k.ime} ${k.kompanija ?? ""} ${k.telefon ?? ""} ${k.email ?? ""}`.toLowerCase();
    const poklapaSe = tekst.includes(pretraga.toLowerCase());
    const poklapaStatus = filterStatus === "svi" || (k.status ?? "novi") === filterStatus;
    return poklapaSe && poklapaStatus;
  });

  const broj = (s: string) => klijenti.filter((k) => (k.status ?? "novi") === s).length;

  return (
    <div className="space-y-6">
      {/* Zaglavlje sa dugmadima za Izvoz i Uvoz */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Klijenti</h1>
          <p className="text-sm text-gray-500">Upravljanje bazom klijenata, firmama i vrednostima posla</p>
        </div>
        <CsvModul klijenti={klijenti} onImportSuccess={hendlujNoveUvezene} />
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Ukupno klijenata</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{klijenti.length}</p>
        </div>
        {STATUSI.slice(0, 3).map((s) => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(filterStatus === s.value ? "svi" : s.value)}
            className={`rounded-2xl border bg-white p-4 text-left transition shadow-sm ${
              filterStatus === s.value ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <span className={`h-2.5 w-2.5 rounded-full ${s.tacka}`} />
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{broj(s.value)}</p>
          </button>
        ))}
      </div>

      {/* Unos novog klijenta */}
      <form onSubmit={dodaj} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Dodaj novog klijenta / posao</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <input placeholder="Ime i prezime kontakta *" value={ime} onChange={(e) => setIme(e.target.value)} required className={inputCls} />
          <input placeholder="Kompanija / Naziv firme" value={kompanija} onChange={(e) => setKompanija(e.target.value)} className={inputCls} />
          <input type="number" placeholder="Vrednost posla (RSD)" value={vrednost} onChange={(e) => setVrednost(e.target.value)} className={inputCls} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input placeholder="Telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} className={inputCls} />
          <input type="email" placeholder="Email adresa" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </div>
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition shadow-sm">
          + Sačuvaj klijenta
        </button>
      </form>

      {/* Pretraga */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          placeholder="Pretraži po imenu, firmi, telefonu..."
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
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">{error}</p>
      )}

      {/* Lista */}
      <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {prikaz.length === 0 && (
          <li className="p-8 text-center text-sm text-gray-500">
            {klijenti.length === 0 ? "Još nema klijenata. Dodaj prvog iznad." : "Nema rezultata za ovu pretragu."}
          </li>
        )}

        {prikaz.map((k) => {
          const st = STATUSI.find((s) => s.value === (k.status ?? "novi")) ?? STATUSI[0];

          if (izmenaId === k.id) {
            return (
              <li key={k.id} className="space-y-3 bg-blue-50/40 p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <input value={izmena.ime} onChange={(e) => setIzmena({ ...izmena, ime: e.target.value })} className={inputCls} placeholder="Ime" />
                  <input value={izmena.kompanija} onChange={(e) => setIzmena({ ...izmena, kompanija: e.target.value })} className={inputCls} placeholder="Kompanija" />
                  <input type="number" value={izmena.vrednost} onChange={(e) => setIzmena({ ...izmena, vrednost: e.target.value })} className={inputCls} placeholder="Vrednost (RSD)" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={izmena.telefon} onChange={(e) => setIzmena({ ...izmena, telefon: e.target.value })} className={inputCls} placeholder="Telefon" />
                  <input value={izmena.email} onChange={(e) => setIzmena({ ...izmena, email: e.target.value })} className={inputCls} placeholder="Email" />
                </div>
                <textarea
                  value={izmena.napomena}
                  onChange={(e) => setIzmena({ ...izmena, napomena: e.target.value })}
                  className={inputCls}
                  placeholder="Napomena"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button onClick={() => sacuvajIzmenu(k.id)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition">
                    Sačuvaj izmene
                  </button>
                  <button onClick={() => setIzmenaId(null)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
                    Otkaži
                  </button>
                </div>
              </li>
            );
          }

          return (
            <li key={k.id} className="flex items-start justify-between gap-4 p-5 hover:bg-gray-50 transition">
              <div className="flex min-w-0 items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-600 border border-blue-100">
                  {inicijali(k.ime)}
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/klijenti/${k.id}`} className="truncate font-semibold text-gray-900 hover:text-blue-600 hover:underline">
                      {k.ime}
                    </Link>
                    {k.kompanija && (
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {k.kompanija}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-gray-500">
                    {[k.telefon, k.email].filter(Boolean).join(" · ") || "Nema kontakta"}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="text-sm font-bold text-emerald-600">
                  {formatBroj(k.vrednost ?? 0)} RSD
                </span>
                <select
                  value={k.status ?? "novi"}
                  onChange={(e) => promeniStatus(k.id, e.target.value)}
                  className={`cursor-pointer rounded-xl border px-3 py-1 text-xs font-semibold shadow-sm ${st.boja}`}
                >
                  {STATUSI.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <div className="flex gap-3 text-xs font-medium pt-1">
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