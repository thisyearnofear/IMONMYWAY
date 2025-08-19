import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Runner ETA - Real-time Location Sharing',
  description: 'Share your live location and ETA with real-time tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}