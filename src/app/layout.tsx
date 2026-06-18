// ============================================================================
// Galerie Apanage — Layout racine
// ============================================================================

import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Galerie Apanage',
  description: "Galerie d'acquisition automobile de luxe, pilotée par l'IA avec validation commissaire.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
