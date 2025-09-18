/**
 * App Provider - Application Context Provider
 * 
 * Provides MegapotProvider context for the application
 */

"use client";

import { MegapotProvider } from '@coordinationlabs/megapot-ui-kit';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const handleConnectWallet = () => {
    // Wallet connection logic would go here
    console.log('Connect wallet requested');
  };

  return (
    <MegapotProvider onConnectWallet={handleConnectWallet}>
      {children}
    </MegapotProvider>
  );
}

export default AppProvider;