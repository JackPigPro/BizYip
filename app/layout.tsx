import type { Metadata } from 'next'
import './globals.css'
import TopNav from '@/components/TopNav'
import { AppStateProvider } from '@/components/AppStateProvider'
import { SupabaseProvider } from '@/components/SupabaseProvider'
import PageLayout from '@/components/PageLayout'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'BizYip — Where founders get good.',
  description:
    'Share your idea. Build your rank. Find your co-founder. Compete and win — free.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <SupabaseProvider>
            <AppStateProvider>
              <TopNav />
              <div style={{ paddingTop: '68px' }}>
                <PageLayout>
                  {children}
                </PageLayout>
              </div>
            </AppStateProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}