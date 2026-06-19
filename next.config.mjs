/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Le squelette doit builder même sans clés : les services tournent en mock.
  // Aucune variable d'environnement n'est requise au build.
  transpilePackages: [
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    '@react-three/postprocessing',
    'postprocessing',
  ],
  experimental: {
    // Server Actions activées par défaut en Next 15 ; rien à forcer ici.
  },
};

export default nextConfig;
