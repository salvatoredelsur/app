interface Props {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  filled?: boolean;
}

export function Sparkline({ data, color, width = 120, height = 36, filled = true }: Props) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 8) + 4;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return [x, y] as [number, number];
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const fill = line + ` L${pts[pts.length-1][0]},${height} L${pts[0][0]},${height} Z`;
  const gradId = `sp_${color.replace('#', '')}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".25"/>
          <stop offset="100%" stopColor={color} stopOpacity=".01"/>
        </linearGradient>
      </defs>
      {filled && <path d={fill} fill={`url(#${gradId})`}/>}
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter:`drop-shadow(0 0 3px ${color}88)` }}/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r={3}
        fill="#060c18" stroke={color} strokeWidth="1.5"
        style={{ filter:`drop-shadow(0 0 5px ${color})` }}/>
    </svg>
  );
}
