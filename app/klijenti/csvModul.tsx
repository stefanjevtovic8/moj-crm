"use client";

import { useState, ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";

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

type Props = {
  klijenti: Klijent[];
  onImportSuccess: (noviKlijenti: Klijent[]) => void;
};

export default function CsvModul({ klijenti, onImportSuccess }: Props) {
  const supabase = createClient();
  const [otvorenModal, setOtvorenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [poruka, setPoruka] = useState<{ tip: "uspeh" | "greska"; tekst: string } | null>(null);

  // 1. IZVOZ U CSV
  function izveziCsv() {
    if (klijenti.length === 0) {
      alert("Nema podataka za izvoz.");
      return;
    }

    const zaglavlja = ["Ime", "Kompanija", "Telefon", "Email", "Status", "Vrednost", "Napomena"];
    const redovi = klijenti.map((k) => [
      `"${(k.ime || "").replace(/"/g, '""')}"`,
      `"${(k.kompanija || "").replace(/"/g, '""')}"`,
      `"${(k.telefon || "").replace(/"/g, '""')}"`,
      `"${(k.email || "").replace(/"/g, '""')}"`,
      `"${(k.status || "novi").replace(/"/g, '""')}"`,
      k.vrednost ?? 0,
      `"${(k.napomena || "").replace(/"/g, '""')}"`,
    ]);

    const csvSadrzaj = "\uFEFF" + [zaglavlja.join(","), ...redovi.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvSadrzaj], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `klijenti_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // 2. PARSIRANJE CSV FAJLA
  function parsirajCsvTekst(tekst: string): Record<string, string>[] {
    const linije = tekst.split(/\r\n|\n/).filter((l) => l.trim() !== "");
    if (linije.length < 2) return [];

    const zaglavlje = linije[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
    const zapisi: Record<string, string>[] = [];

    for (let i = 1; i < linije.length; i++) {
      // Pravilan regex za izdvajanje vrednosti odvojenih zarezom unutar ili van navodnika
      const vrednosti = linije[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || linije[i].split(",");
      const objekat: Record<string, string> = {};

      zaglavlje.forEach((kljuc, indeks) => {
        let val = vrednosti[indeks] ? vrednosti[indeks].trim() : "";
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1).replace(/""/g, '"');
        }
        objekat[kljuc] = val;
      });

      zapisi.push(objekat);
    }

    return zapisi;
  }

  // 3. OBRADA FAJLA I UBACIVANJE U SUPABASE
  async function obradiFajl(e: ChangeEvent<HTMLInputElement>) {
    const fajl = e.target.files?.[0];
    if (!fajl) return;

    setLoading(true);
    setPoruka(null);

    const čitač = new FileReader();
    čitač.onload = async (događaj) => {
      try {
        const tekst = događaj.target?.result as string;
        const siroviPodaci = parsirajCsvTekst(tekst);

        if (siroviPodaci.length === 0) {
          setPoruka({ tip: "greska", tekst: "CSV fajl je prazan ili pogrešno formatiran." });
          setLoading(false);
          return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          setPoruka({ tip: "greska", tekst: "Niste prijavljeni." });
          setLoading(false);
          return;
        }

        // Mapiranje i validacija polja
        const pripremljeni = siroviPodaci
          .map((red) => {
            const ime = red["ime"] || red["name"] || red["ime i prezime"] || "";
            if (!ime) return null;

            const vrednostSirova = red["vrednost"] || red["value"] || "0";
            const numVrednost = parseFloat(vrednostSirova.replace(/[^0-9.-]+/g, "")) || 0;

            return {
              user_id: userData.user.id,
              ime,
              kompanija: red["kompanija"] || red["company"] || null,
              telefon: red["telefon"] || red["phone"] || null,
              email: red["email"] || null,
              status: red["status"] || "novi",
              vrednost: numVrednost,
              napomena: red["napomena"] || red["note"] || null,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);

        if (pripremljeni.length === 0) {
          setPoruka({ tip: "greska", tekst: "Nije pronađen nijedan ispravan red sa kolonama za 'Ime'." });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("klijenti")
          .insert(pripremljeni)
          .select();

        if (error) {
          setPoruka({ tip: "greska", tekst: `Greška pri upisu u bazu: ${error.message}` });
        } else if (data) {
          onImportSuccess(data as Klijent[]);
          setPoruka({ tip: "uspeh", tekst: `Uspešno uvezeno ${data.length} klijenata!` });
          setTimeout(() => setOtvorenModal(false), 1500);
        }
      } catch (err) {
        setPoruka({ tip: "greska", tekst: "Došlo je do greške pri obradi fajla." });
      } finally {
        setLoading(false);
        e.target.value = "";
      }
    };

    čitač.readAsText(fajl, "UTF-8");
  }

  return (
    <div className="flex gap-2">
      {/* Dugme za Izvoz */}
      <button
        onClick={izveziCsv}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
      >
        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Izvezi CSV
      </button>

      {/* Dugme za Otvaranje Modala za Uvoz */}
      <button
        onClick={() => {
          setOtvorenModal(true);
          setPoruka(null);
        }}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
      >
        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Uvezi CSV
      </button>

      {/* Modal za Uvoz */}
      {otvorenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Uvoz klijenata iz CSV fajla</h3>
              <button
                onClick={() => setOtvorenModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Fajl mora sadržati kolonu <strong className="text-gray-700">Ime</strong>. Opcione kolone: 
              <span className="italic"> Kompanija, Telefon, Email, Status, Vrednost, Napomena</span>.
            </p>

            <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center hover:border-blue-400 transition bg-gray-50/50">
              <input
                type="file"
                accept=".csv"
                onChange={obradiFajl}
                disabled={loading}
                id="csv-file-input"
                className="hidden"
              />
              <label
                htmlFor="csv-file-input"
                className="cursor-pointer space-y-2 block"
              >
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="block text-xs font-semibold text-blue-600">
                  {loading ? "Obrada fajla u toku..." : "Kliknite za izbor CSV fajla"}
                </span>
              </label>
            </div>

            {poruka && (
              <p
                className={`rounded-xl px-3.5 py-2.5 text-xs font-medium border ${
                  poruka.tip === "uspeh"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {poruka.tekst}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setOtvorenModal(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}