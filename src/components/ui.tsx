// ============================================================================
// Galerie Apanage — Kit UI présentationnel (sans logique métier, cf. §10)
// ----------------------------------------------------------------------------
// Composants découplés consommant uniquement les tokens CSS. Aucune dépendance
// data : ils reçoivent tout en props. Restylables ensuite sans refactoring.
// ============================================================================

import { DossierStatut } from '@/domain/types';
import { STATUT_META, STATUTS_TUNNEL } from '@/domain/statut';
import { ReactNode } from 'react';

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

/** Frise du tunnel (statut courant mis en avant). Utilisée portail + cockpit. */
export function FriseStatut({ statut }: { statut: DossierStatut }) {
  const courantOrdre = STATUT_META[statut].ordre;
  return (
    <div className="row" style={{ gap: 6, alignItems: 'center' }}>
      {STATUTS_TUNNEL.map((s) => {
        const meta = STATUT_META[s];
        const atteint = meta.ordre <= courantOrdre;
        return (
          <div key={s} className="small" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              className="badge-dot"
              style={{ background: atteint ? `var(--${meta.couleurToken})` : 'var(--border)', width: 10, height: 10 }}
            />
            <span style={{ color: atteint ? 'var(--ink)' : 'var(--muted)', fontWeight: s === statut ? 700 : 400 }}>
              {meta.label}
            </span>
            {meta.ordre < STATUTS_TUNNEL.length && <span className="muted">›</span>}
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
  return <p className="muted small" style={{ padding: '8px 0' }}>{children}</p>;
}

export function SectionTitle({ n, title, hint }: { n?: number; title: string; hint?: string }) {
  return (
    <div className="between" style={{ marginBottom: 8 }}>
      <h3 style={{ margin: 0 }}>
        {n !== undefined && <span className="muted">{n} · </span>}
        {title}
      </h3>
      {hint && <span className="muted small">{hint}</span>}
    </div>
  );
}
