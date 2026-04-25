import { useState } from 'react';
import type { CSSProperties } from 'react';
import { SS } from '../../tokens';
import { Sparkline } from './Sparkline';

interface Props {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon?: string;
  sparkData?: number[];
  onClick?: () => void;
  style?: CSSProperties;
}

export function StatCard({ label, value, sub, color, icon, sparkData, onClick, style: extraStyle }: Props) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      style={{
        background: SS.card, borderRadius:14, padding:'14px 16px',
        border:`1px solid ${hovered && onClick ? color + '50' : color + '20'}`,
        position:'relative', overflow:'hidden', cursor: onClick ? 'pointer' : 'default',
        transform: hovered && onClick ? 'translateY(-2px)' : '',
        transition:'transform .15s, border-color .15s',
        ...extraStyle,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:color, opacity:.05, pointerEvents:'none' }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
        <div style={{ fontSize:9, fontWeight:600, letterSpacing:1.2, textTransform:'uppercase', color:SS.dimText }}>{label}</div>
        {icon && <span style={{ fontSize:16, opacity:.7 }}>{icon}</span>}
      </div>
      <div style={{ fontSize:26, fontWeight:900, color, textShadow:`0 0 20px ${color}80`, letterSpacing:-1, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:SS.dimText, marginTop:3 }}>{sub}</div>}
      {sparkData && <div style={{ marginTop:8 }}><Sparkline data={sparkData} color={color} width={110} height={28}/></div>}
    </div>
  );
}
