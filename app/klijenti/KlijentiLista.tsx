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

export default function KlijentiLista({ pocetni }: { pocetni: Klijent[] }) {
  const supabase = createClient();
  const [klijenti, setKlijenti] = useState<Klijent[]>(pocetni);
  const [ime, setIme] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

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
    const { error } = await supabase.from("klijenti").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setKlijenti(klijenti.filter((k) => k.id !== id));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={dodaj} className="grid gap-3 sm:grid-cols-4">
        <input
          placeholder="Ime"
          value={ime}
          onChange={(e) => setIme(e.target.value)}
          required
          className="border rounded-lg px-3 py-2"
        />
        <input
          placeholder="Telefon"
          value={telefon}
          onChange={(e) => setTelefon(e.target.value)}
          className="border rounded-lg px-3 py-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded-lg px-3 py-2"
        />
        <button className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700">
          Dodaj
        </button>
      </form>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <ul className="divide-y border rounded-xl bg-white">
        {klijenti.length === 0 && (
          <li className="p-4 text-gray-500">Još nema klijenata.</li>
        )}
        {klijenti.map((k) => (
          <li key={k.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{k.ime}</p>
              <p className="text-sm text-gray-500">
                {[k.telefon, k.email].filter(Boolean).join(" · ")}
              </p>
            </div>
            <button
              onClick={() => obrisi(k.id)}
              className="text-sm text-red-600 hover:underline"
            >
              Obriši
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}