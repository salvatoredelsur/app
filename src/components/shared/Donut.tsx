interface Props {
  pct: number;
  color: string;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}

export function Donut({ pct, color, size = 80, stroke = 9, label, sublabel }: Props) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ filter:`drop-shadow(0 0 6px ${color}bb)`, transition:'stroke-dasharray .5s ease' }}/>
      {label && (
        <text x={size/2} y={sublabel ? size/2 - 5 : size/2 + 1}
          textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize={size * 0.18} fontWeight="800" fontFamily="'DM Sans',sans-serif">
          {label}
        </text>
      )}
      {sublabel && (
        <text x={size/2} y={size/2 + size * 0.15}
          textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.4)" fontSize={size * 0.12} fontFamily="'DM Sans',sans-serif">
          {sublabel}
        </text>
      )}
    </svg>
  );
}
