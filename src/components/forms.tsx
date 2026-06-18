// ============================================================================
// Galerie Apanage — Composants de formulaire (client) pour Server Actions
// ----------------------------------------------------------------------------
// SubmitButton affiche l'état « en cours » (useFormStatus). Découplé de toute
// logique métier : on lui passe juste le libellé + une variante de style.
// ============================================================================

'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({
  children,
  variant = 'default',
  confirm,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'gold';
  confirm?: string;
}) {
  const { pending } = useFormStatus();
  const cls = variant === 'primary' ? 'btn btn-primary' : variant === 'gold' ? 'btn btn-gold' : 'btn';
  return (
    <button
      type="submit"
      className={cls}
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? '…' : children}
    </button>
  );
}
