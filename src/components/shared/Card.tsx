import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { SS } from '../../tokens';

interface CardProps { children: ReactNode; style?: CSSProperties; color?: string; onClick?: () => void; }
interface CardTitleProps { children: ReactNode; color?: string; }

export function Card({ children, style: extra, color, onClick }: CardProps) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={onClick ? () => setHov(true) : undefined}
      onMouseLeave={onClick ? () => setHov(false) : undefined}
      style={{
        background: SS.card, borderRadius:16, padding:'16px',
        border:`1px solid ${color ? (hov && onClick ? color + '40' : color + '18') : SS.border}`,
        position:'relative', overflow:'hidden', cursor: onClick ? 'pointer' : undefined,
        transform: hov && onClick ? 'translateY(-1px)' : undefined,
        transition:'transform .15s, border-color .15s',
        ...extra,
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
