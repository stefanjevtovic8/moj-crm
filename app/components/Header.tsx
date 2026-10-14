import Link from "next/link";

const LINKOVI = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard" },
  { id: "klijenti", href: "/klijenti", label: "Klijenti" },
  { id: "zadaci", href: "/zadaci", label: "Zadaci" },
];

export default function Header({
  email,
  aktivno,
}: {
  email?: string | null;
  aktivno: string;
}) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              C
            </div>
            <span className="hidden text-lg font-semibold text-gray-900 sm:inline">Moj CRM</span>
          </div>
          <nav className="flex gap-4 text-sm">
            {LINKOVI.map((l) => (
              <Link
                key={l.id}
                href={l.href}
                className={
                  aktivno === l.id
                    ? "font-medium text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <form action="/auth/signout" method="post" className="flex items-center gap-3">
          <span className="hidden text-sm text-gray-500 md:inline">{email}</span>
          <button className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
            Odjavi se
          </button>
        </form>
      </div>
    </header>
  );
}