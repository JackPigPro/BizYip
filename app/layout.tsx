import type { Metadata } from 'next'
import './globals.css'
import TopNav from '@/components/TopNav'
import { AppStateProvider } from '@/components/AppStateProvider'
import { SupabaseProvider } from '@/components/SupabaseProvider'
import PageLayout from '@/components/PageLayout'
import { ThemeProvider } from '@/components/ThemeProvider'
import ScrollToTop from '@/components/ScrollToTop'
import { UserProvider } from '@/contexts/UserContext'
import { getAuthState } from '@/utils/auth'

export const metadata: Metadata = {
  title: 'BizYip — Where founders get good.',
  description:
    'Daily challenges, weekly duels, live 1v1s. Build your ELO. Climb the leaderboard.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await getAuthState()

  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <SupabaseProvider>
            <UserProvider>
              <AppStateProvider>
                <ScrollToTop />
                <TopNav initialUser={user} initialProfile={profile} />
                <div style={{ paddingTop: '68px' }}>
                  <PageLayout>
                    {children}
                  </PageLayout>
                </div>
              </AppStateProvider>
            </UserProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}