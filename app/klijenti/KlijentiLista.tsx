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
  { value: "novi", label: "Novi", boja: "bg-blue-100 text-blue-800" },
  { value: "pregovori", label: "U pregovorima", boja: "bg-yellow-100 text-yellow-800" },
  { value: "zatvoren", label: "Zatvoren", boja: "bg-green-100 text-green-800" },
  { value: "izgubljen", label: "Izgubljen", boja: "bg-gray-200 text-gray-700" },
];

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
    const poklapaStatus = filterStatus === "svi" || k.status === filterStatus;
    return poklapaSe && poklapaStatus;
  });

  return (
    <div className="space-y-6">
      <form onSubmit={dodaj} className="grid gap-3 sm:grid-cols-4">
        <input placeholder="Ime" value={ime} onChange={(e) => setIme(e.target.value)} required className="border rounded-lg px-3 py-2" />
        <input placeholder="Telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} className="border rounded-lg px-3 py-2" />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded-lg px-3 py-2" />
        <button className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700">Dodaj</button>
      </form>

      <div className="flex gap-3">
        <input
          placeholder="Pretraži po imenu, telefonu, emailu..."
          value={pretraga}
          onChange={(e) => setPretraga(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded-lg px-3 py-2">
          <option value="svi">Svi statusi</option>
          {STATUSI.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <p className="text-sm text-gray-500">Prikazano: {prikaz.length} od {klijenti.length}</p>

      <ul className="divide-y border rounded-xl bg-white">
        {prikaz.length === 0 && <li className="p-4 text-gray-500">Nema klijenata.</li>}

        {prikaz.map((k) => {
          const st = STATUSI.find((s) => s.value === k.status) ?? STATUSI[0];

          if (izmenaId === k.id) {
            return (
              <li key={k.id} className="p-4 space-y-2">
                <input value={izmena.ime} onChange={(e) => setIzmena({ ...izmena, ime: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Ime" />
                <input value={izmena.telefon} onChange={(e) => setIzmena({ ...izmena, telefon: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Telefon" />
                <input value={izmena.email} onChange={(e) => setIzmena({ ...izmena, email: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Email" />
                <textarea value={izmena.napomena} onChange={(e) => setIzmena({ ...izmena, napomena: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Napomena" rows={3} />
                <div className="flex gap-3">
                  <button onClick={() => sacuvajIzmenu(k.id)} className="bg-blue-600 text-white rounded-lg px-3 py-1 hover:bg-blue-700">Sačuvaj</button>
                  <button onClick={() => setIzmenaId(null)} className="text-gray-600 hover:underline">Otkaži</button>
                </div>
              </li>
            );
          }

          return (
            <li key={k.id} className="p-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium text-gray-900">{k.ime}</p>
                <p className="text-sm text-gray-500">{[k.telefon, k.email].filter(Boolean).join(" · ")}</p>
                {k.napomena && <p className="text-sm text-gray-600 italic">{k.napomena}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <select
                  value={k.status ?? "novi"}
                  onChange={(e) => promeniStatus(k.id, e.target.value)}
                  className={`text-xs rounded-full px-2 py-1 ${st.boja}`}
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