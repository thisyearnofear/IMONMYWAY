import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
// Leaflet's styles (must come before our own base CSS)
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { PremiumNavigation } from "@/components/layout/PremiumNavigation";
import { GlobalErrorBoundary } from '@/components/core/GlobalErrorBoundary';
import { ToastProvider, ToastContainer } from '@/components/unified/UnifiedToast';

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IMONMYWAY — Autonomous Punctuality Protocol on Somnia",
  description:
    "Deploy an AI agent that stakes, negotiates, and settles punctuality commitments autonomously on Somnia's Agentic L1. No human intervention after setup.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  icons: {
    icon: '/IOMYfavicon.ico',
    apple: '/IOMYsquare.png',
  },
  openGraph: {
  title: "IMONMYWAY — Autonomous Punctuality Protocol",
  description: "Your AI agent bets on your punctuality. Autonomous staking, agent-to-agent negotiation, and real-time settlement on Somnia.",
  images: ['/IOMYbanner.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-graphite-900 text-white antialiased" suppressHydrationWarning={true}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-gold-500 focus:text-graphite-900 focus:rounded-lg focus:font-semibold"
        >
          Skip to content
        </a>
        <ToastProvider>
          <GlobalErrorBoundary enableRecovery={true} showErrorDetails={process.env.NODE_ENV === 'development'}>
            <PremiumNavigation />
            <main id="main-content" className="relative pt-20">
              {children}
            </main>
            <ToastContainer />
          </GlobalErrorBoundary>
        </ToastProvider>
      </body>
    </html>
  );
}