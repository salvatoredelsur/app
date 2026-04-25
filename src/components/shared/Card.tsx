import type { CSSProperties, ReactNode } from 'react';
import { SS } from '../../tokens';

interface CardProps { children: ReactNode; style?: CSSProperties; color?: string; }
interface CardTitleProps { children: ReactNode; color?: string; }

export function Card({ children, style: extra, color }: CardProps) {
  return (
    <div style={{
      background: SS.card, borderRadius:16, padding:'16px',
      border:`1px solid ${color ? color + '18' : SS.border}`,
      position:'relative', overflow:'hidden', ...extra,
    }}>
      {children}
    </div>
  );
}

export function CardTitle({ children, color }: CardTitleProps) {
  return (
    <div style={{
      fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase',
      color: color || SS.dimText, marginBottom:10,
    }}>
      {children}
    </div>
  );
}
