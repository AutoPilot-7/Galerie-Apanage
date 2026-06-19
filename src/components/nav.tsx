'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem { href: string; label: string; exact?: boolean }

export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <>
      {items.map(({ href, label, exact }) => {
        const active = exact ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} className={active ? 'active' : undefined}>
            {label}
          </Link>
        );
      })}
    </>
  );
}
