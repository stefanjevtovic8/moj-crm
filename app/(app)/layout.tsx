import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { AppSidebar } from '@/components/crm/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/server'

async function Shell({ children }: { children: React.ReactNode }) {
  await connection()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ count: clientCount }, { count: openTasks }] = await Promise.all([
    supabase.from('klijenti').select('id', { count: 'exact', head: true }),
    supabase.from('zadaci').select('id', { count: 'exact', head: true }).eq('zavrsen', false),
  ])

  return (
    <SidebarProvider>
      <AppSidebar
        email={user.email ?? ''}
        clientCount={clientCount ?? 0}
        openTasks={openTasks ?? 0}
      />
      <SidebarInset>
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 md:px-10 md:py-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">Učitavanje...</p>}>
      <Shell>{children}</Shell>
    </Suspense>
  )
}
