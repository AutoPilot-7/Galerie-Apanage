'use client';

import dynamic from 'next/dynamic';

const HeroStage3D = dynamic(
  () => import('@/components/hero-stage-3d').then((m) => m.HeroStage),
  { ssr: false },
);

export function HeroStageClient() {
  return <HeroStage3D />;
}
