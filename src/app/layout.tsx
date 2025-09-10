import type { Metadata } from "next";
import "./globals.css";
import { SmartNotificationCenter } from '@/components/smart/SmartNotificationCenter'
import { Navigation } from "@/components/layout/Navigation";
import { GlobalErrorBoundary } from '@/components/core/GlobalErrorBoundary';

export const metadata: Metadata = {
  title: "IMONMYWAY - Punctuality Protocol on Somnia",
  description:
    "Put your money where your mouth is. Stake tokens on punctuality commitments and let others bet on your success with real-time GPS verification on Somnia Network.",
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
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <GlobalErrorBoundary enableRecovery={true} showErrorDetails={process.env.NODE_ENV === 'development'}>
          <Navigation />
          {children}
          <SmartNotificationCenter />
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
