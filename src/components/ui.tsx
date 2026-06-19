// ============================================================================
// Galerie Apanage — Kit UI présentationnel (sans logique métier, cf. §10)
// ----------------------------------------------------------------------------
// Composants découplés consommant uniquement les tokens CSS. Aucune dépendance
// data : ils reçoivent tout en props. Restylables ensuite sans refactoring.
// ============================================================================

import { DossierStatut } from '@/domain/types';
import { STATUT_META, STATUTS_TUNNEL } from '@/domain/statut';
import { ReactNode } from 'react';

export function LogoMark({ size = 22, light = false }: { size?: number; light?: boolean }) {
  const h = Math.round(size * 1.25);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 90 112"
      aria-hidden="true"
      style={{ color: light ? 'var(--color-platre)' : 'var(--color-encre)', flexShrink: 0 }}
    >
      <rect x="12" y="6" width="66" height="100" rx="3" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <text x="45" y="74" fontFamily="Marcellus,serif" fontSize="56" fill="currentColor" textAnchor="middle">A</text>
      <rect x="34" y="84" width="22" height="2.6" fill={light ? 'var(--color-prune-soft)' : 'var(--color-prune)'} />
    </svg>
  );
}

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export function Money({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <span className="muted">—</span>;
  return <span>{eur.format(value)}</span>;
}

export function StatutBadge({ statut }: { statut: DossierStatut }) {
  const meta = STATUT_META[statut];
  return (
    <span className="badge">
      <span className="badge-dot" style={{ background: `var(--${meta.couleurToken})` }} />
      {meta.label}
    </span>
  );
}

/** Frise du tunnel — nœuds losange avec ligne de connexion. */
export function FriseStatut({ statut }: { statut: DossierStatut }) {
  const courantOrdre = STATUT_META[statut].ordre;
  return (
    <div className="frise-statut">
      {STATUTS_TUNNEL.map((s) => {
        const meta = STATUT_META[s];
        const atteint = meta.ordre <= courantOrdre;
        const courant = s === statut;
        return (
          <div
            key={s}
            className="frise-etape"
            data-atteint={atteint ? '' : undefined}
          >
            <div
              className="frise-noeud"
              data-atteint={atteint && !courant ? '' : undefined}
              data-courant={courant ? '' : undefined}
            />
            <span
              className="frise-label"
              data-atteint={atteint && !courant ? '' : undefined}
              data-courant={courant ? '' : undefined}
            >
              {meta.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Encart « validation commissaire » (human-in-the-loop) explicite. */
export function HitlNotice({ children }: { children: ReactNode }) {
  return (
    <div className="hitl">
      <strong>✋ Validation requise</strong> — {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      letterSpacing: '.12em',
      textTransform: 'uppercase',
      color: 'var(--color-ink-45)',
      padding: 'var(--space-4) 0',
      margin: 0,
    }}>
      {children}
    </p>
  );
}

export function SectionTitle({ n, title, hint }: { n?: number; title: string; hint?: string }) {
  return (
    <div className="between" style={{
      marginBottom: 'var(--space-4)',
      paddingBottom: 'var(--space-3)',
      borderBottom: '1px solid var(--hair)',
    }}>
      <h3 style={{
        margin: 0,
        fontFamily: 'var(--font-serif)',
        fontWeight: 400,
        fontSize: 'var(--text-lg)',
        letterSpacing: '0.02em',
        color: 'var(--color-encre)',
        display: 'flex',
        alignItems: 'baseline',
        gap: 'var(--space-2)',
      }}>
        {n !== undefined && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            letterSpacing: '.14em',
            color: 'var(--color-prune)',
            textTransform: 'uppercase',
          }}>
            {String(n).padStart(2, '0')}
          </span>
        )}
        {title}
      </h3>
      {hint && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: 'var(--color-ink-45)',
        }}>
          {hint}
        </span>
      )}
    </div>
  );
}
