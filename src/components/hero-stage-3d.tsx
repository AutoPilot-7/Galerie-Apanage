'use client';

// ============================================================================
// Galerie Apanage — HeroStage 3D (React Three Fiber)
// Scène : artefact platine (torus knot) + lumière prune orbitale + sparkles.
// Chargé uniquement côté client (dynamic import ssr:false depuis page.tsx).
// ============================================================================

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { Environment, Sparkles, Float } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

// ── L'artefact — torus knot platine ─────────────────────────────────────────
function Artefact() {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.elapsedTime;
    mesh.current.rotation.y = t * 0.09;
    mesh.current.rotation.x = t * 0.035;
  });

  return (
    <mesh ref={mesh} castShadow>
      {/* p=2 q=3 → forme trèfle élégante — signature mathématique de la galerie */}
      <torusKnotGeometry args={[1.1, 0.36, 512, 32, 2, 3]} />
      <meshPhysicalMaterial
        color="#C8B8A4"          // platine chaud — proche du plâtre
        metalness={1}
        roughness={0.06}
        clearcoat={1}
        clearcoatRoughness={0.08}
        reflectivity={1}
        envMapIntensity={2.2}
      />
    </mesh>
  );
}

// ── Lumière signature prune — orbite autour de l'artefact ───────────────────
function PruneOrb() {
  const light = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!light.current) return;
    const t = clock.elapsedTime * 0.38;
    light.current.position.set(
      Math.sin(t) * 3.8,
      Math.cos(t * 0.65) * 2.2,
      Math.cos(t) * 3.8,
    );
  });

  return <pointLight ref={light} color="#542B3D" intensity={18} distance={12} decay={2} />;
}

// ── Contre-lumière froide — crée la profondeur ───────────────────────────────
function RimLight() {
  const light = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!light.current) return;
    const t = clock.elapsedTime * 0.22 + Math.PI;
    light.current.position.set(
      Math.sin(t) * 5,
      -1.5,
      Math.cos(t) * 5,
    );
  });

  return <pointLight ref={light} color="#3A6080" intensity={6} distance={14} decay={2} />;
}

// ── Parallaxe souris — la caméra suit la souris avec inertie ────────────────
function ParallaxCamera() {
  const { camera } = useThree();
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 1.4;
      target.current.y = -(e.clientY / window.innerHeight - 0.5) * 0.9;
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useFrame(() => {
    const k = 0.035;
    camera.position.x += (target.current.x - camera.position.x) * k;
    camera.position.y += (target.current.y - camera.position.y) * k;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ── Sol-miroir subtil ────────────────────────────────────────────────────────
function StudioFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.4, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial
        color="#181614"
        metalness={0.7}
        roughness={0.4}
        envMapIntensity={0.4}
      />
    </mesh>
  );
}

// ── Scène principale ─────────────────────────────────────────────────────────
export function HeroStage() {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 6], fov: 46 }}
      dpr={[1, 2]}
      shadows
      style={{ position: 'absolute', inset: 0 }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#1C1A17']} />
      <fog attach="fog" args={['#1C1A17', 10, 22]} />

      <ParallaxCamera />

      {/* Éclairage */}
      <ambientLight intensity={0.04} />
      <directionalLight
        position={[4, 7, 4]}
        intensity={2.5}
        color="#F1ECE3"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <PruneOrb />
      <RimLight />

      <Suspense fallback={null}>
        <Environment preset="studio" />

        <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.45}>
          <Artefact />
        </Float>

        <StudioFloor />

        {/* Particules — poussière de lumière */}
        <Sparkles
          count={160}
          scale={9}
          size={1.2}
          speed={0.12}
          opacity={0.28}
          color="#F1ECE3"
          noise={0.3}
        />
        {/* Second nuage — prune très subtil */}
        <Sparkles
          count={60}
          scale={6}
          size={0.8}
          speed={0.08}
          opacity={0.18}
          color="#7C4F63"
          noise={0.5}
        />
      </Suspense>

      <EffectComposer>
        <Bloom
          mipmapBlur
          threshold={0.78}
          intensity={0.55}
          luminanceThreshold={0.82}
          luminanceSmoothing={0.92}
          radius={0.7}
        />
      </EffectComposer>
    </Canvas>
  );
}
