"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* LEVA STRANA: Forma */}
      <div className="flex w-full flex-col justify-between p-8 lg:w-1/2 lg:p-12 xl:p-16">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-sm">
            C
          </div>
          <span className="text-lg font-bold text-gray-900">CRM</span>
        </div>

        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dobro došli nazad</h1>
            <p className="text-sm text-gray-500">Unesite svoje podatke za prijavu u sistem</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Email adresa</label>
              <input
                type="email"
                placeholder="ime@kompanija.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Lozinka</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-200">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
            >
              {loading ? "Prijava u toku..." : "Prijavi se"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Nemate nalog?{" "}
            <Link href="/register" className="font-semibold text-blue-600 hover:underline">
              Registrujte se
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400">
          © 2026 CRM. Sva prava zadržana.
        </p>
      </div>

      {/* DESNA STRANA: Čista slika kancelarije bez teksta */}
      <div className="hidden lg:relative lg:flex lg:w-1/2 lg:items-center lg:justify-center bg-gray-900">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop"
          alt="Moderna kancelarija"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}