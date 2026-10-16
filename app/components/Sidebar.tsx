"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const LINKOVI = [
  {
    id: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    ikona: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: "kanban",
    href: "/kanban",
    label: "Prodajni tok",
    ikona: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  {
    id: "klijenti",
    href: "/klijenti",
    label: "Klijenti",
    ikona: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: "zadaci",
    href: "/zadaci",
    label: "Zadaci",
    ikona: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "analitika",
    href: "/analitika",
    label: "Analitika",
    ikona: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "tim",
    href: "/tim",
    label: "Tim",
    ikona: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

export default function Sidebar({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const supabase = createClient();
  const [uloga, setUloga] = useState<string>("zaposleni");

  useEffect(() => {
    async function ucitajUlogu() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profili")
          .select("uloga")
          .eq("id", user.id)
          .single();

        if (data?.uloga) {
          setUloga(data.uloga);
        }
      }
    }
    ucitajUlogu();
  }, [supabase]);

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-gray-200 bg-white p-4 shrink-0 overflow-y-auto">
      <div className="space-y-6">
        {/* LOGO */}
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-sm">
            C
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-none">CRM</h1>
            <p className="text-xs text-gray-400 mt-1">Poslovni Workspace</p>
          </div>
        </div>

        {/* MENI */}
        <nav className="space-y-1">
          <p className="px-2 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Meni
          </p>
          {LINKOVI.map((link) => {
            const jeAktivno = pathname.startsWith(link.href);
            return (
              <Link
                key={link.id}
                href={link.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  jeAktivno
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {link.ikona}
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* PROFIL, ULOGA I ODJAVA */}
      <div className="border-t border-gray-200 pt-4 space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 shrink-0">
              {email?.[0]?.toUpperCase() ?? "K"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-gray-900">{email ?? "Korisnik"}</p>
              <p className="text-[10px] text-gray-400">Prijavljen</p>
            </div>
          </div>
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
              uloga === "admin"
                ? "bg-purple-100 text-purple-700 border border-purple-200"
                : "bg-blue-100 text-blue-700 border border-blue-200"
            }`}
          >
            {uloga}
          </span>
        </div>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Odjavi se
          </button>
        </form>
      </div>
    </aside>
  );
}