'use client';

const SPARKLES = [
  { top: '12%', left: '22%', delay: '0s' },
  { top: '28%', left: '78%', delay: '0.8s' },
  { top: '62%', left: '16%', delay: '1.4s' },
  { top: '74%', left: '70%', delay: '2.1s' },
  { top: '44%', left: '52%', delay: '1s' },
  { top: '18%', left: '58%', delay: '2.6s' },
  { top: '82%', left: '40%', delay: '0.4s' },
];

export function CSSArtifact() {
  return (
    <div className="css-artifact">
      <div className="grid-lines" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
      <div className="prune-glow"  style={{ position: 'absolute', inset: 0, opacity: 0.7 }} />

      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="css-artifact-sparkle"
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
        />
      ))}

      <div className="artifact-stage css-artifact-stage">
        <div className="artifact-spin css-artifact-spin">
          <span className="css-artifact-ring" />
          <span className="css-artifact-ring" />
          <span className="css-artifact-ring" />
          <span className="css-artifact-ring" />
          <span className="css-artifact-ring" />
          <div className="css-artifact-core" />
        </div>
      </div>

      <span className="css-artifact-label">Artefact · 001</span>
    </div>
  );
}
