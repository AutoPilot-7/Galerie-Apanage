/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Le squelette doit builder même sans clés : les services tournent en mock.
  // Aucune variable d'environnement n'est requise au build.
  experimental: {
    // Server Actions activées par défaut en Next 15 ; rien à forcer ici.
  },
};

export default nextConfig;
