import { AuthProvider } from '@/components/AuthProvider'
import './globals.css'

export const metadata = {
  title: 'GhostRent OS - Property Marketplace',
  description: 'Find or list properties in South Africa',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <main className="min-h-screen bg-paper pb-20">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}