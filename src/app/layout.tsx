import type { Metadata } from "next";
// Leaflet's styles (must come before our own base CSS)
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { PremiumNavigation } from "@/components/layout/PremiumNavigation";
import { GlobalErrorBoundary } from '@/components/core/GlobalErrorBoundary';
import { ToastProvider, ToastContainer } from '@/components/unified/UnifiedToast';

export const metadata: Metadata = {
  title: "IMONMYWAY - Punctuality Protocol on Somnia",
  description:
    "Put your money where your mouth is. Stake tokens on punctuality commitments and let others bet on your success with real-time GPS verification on Somnia Network.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  icons: {
    icon: '/IOMYfavicon.ico',
    apple: '/IOMYsquare.png',
  },
  openGraph: {
  title: "IMONMYWAY - Punctuality Protocol",
  description: "First punctuality accountability protocol on Somnia Network",
  images: ['/IOMYbanner.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-graphite-900 text-white antialiased" suppressHydrationWarning={true}>
        <ToastProvider>
          <GlobalErrorBoundary enableRecovery={true} showErrorDetails={process.env.NODE_ENV === 'development'}>
            <PremiumNavigation />
            <main className="relative pt-20">
              {children}
            </main>
            <ToastContainer />
          </GlobalErrorBoundary>
        </ToastProvider>
      </body>
    </html>
  );
}