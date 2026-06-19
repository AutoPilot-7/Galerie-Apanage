// ============================================================================
// Galerie Apanage — Layout racine
// Polices : Marcellus (titres) · Mulish (corps) · Spline Sans Mono (labels)
// ============================================================================

import './globals.css';
import type { Metadata } from 'next';
import { Marcellus, Mulish, Spline_Sans_Mono } from 'next/font/google';

const marcellus = Marcellus({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-marcellus',
  display: 'swap',
});

const mulish = Mulish({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-mulish',
  display: 'swap',
});

const splineSansMono = Spline_Sans_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-spline',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Galerie Apanage',
  description: "Le privilège de l'exception — Acquisition automobile d'exception, pilotée par l'IA avec validation commissaire.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${marcellus.variable} ${mulish.variable} ${splineSansMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
