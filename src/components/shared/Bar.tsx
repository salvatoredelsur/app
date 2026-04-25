import type { CSSProperties } from 'react';

interface Props {
  pct: number;
  color: string;
  height?: number;
  glow?: boolean;
  style?: CSSProperties;
}

export function Bar({ pct, color, height = 5, glow = true, style: extra }: Props) {
  return (
    <div style={{ height, background:'rgba(255,255,255,0.06)', borderRadius:height, ...extra }}>
      <div style={{
        width:`${Math.min(pct, 100)}%`, height:'100%', background:color, borderRadius:height,
        boxShadow: glow ? `0 0 8px ${color}70` : 'none',
        transition:'width .4s ease',
      }}/>
    </div>
  );
}
