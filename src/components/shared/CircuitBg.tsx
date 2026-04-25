interface Props { id?: string; opacity?: number; }

export function CircuitBg({ id = 'c', opacity = 0.06 }: Props) {
  return (
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={`p_${id}`} width="64" height="64" patternUnits="userSpaceOnUse">
          <line x1="32" y1="0"  x2="32" y2="20" stroke="#00aaff" strokeWidth="0.5"/>
          <line x1="32" y1="44" x2="32" y2="64" stroke="#00aaff" strokeWidth="0.5"/>
          <line x1="0"  y1="32" x2="20" y2="32" stroke="#00aaff" strokeWidth="0.5"/>
          <line x1="44" y1="32" x2="64" y2="32" stroke="#00aaff" strokeWidth="0.5"/>
          <rect x="25" y="25" width="14" height="14" rx="3" fill="none" stroke="#00aaff" strokeWidth="0.5"/>
          <circle cx="0"  cy="0"  r="1.5" fill="#00aaff"/>
          <circle cx="64" cy="0"  r="1.5" fill="#00aaff"/>
          <circle cx="0"  cy="64" r="1.5" fill="#00aaff"/>
          <circle cx="64" cy="64" r="1.5" fill="#00aaff"/>
          <line x1="32" y1="32" x2="52" y2="12" stroke="#a855f7" strokeWidth="0.3" opacity="0.7"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#p_${id})`} opacity={opacity}/>
    </svg>
  );
}
