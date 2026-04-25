import { useState } from 'react';
import { SS } from '../../tokens';

interface Props {
  title: string;
  sub?: string;
  color: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHdr({ title, sub, color, action, onAction }: Props) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
      <div>
        <div style={{ fontSize:22, fontWeight:800, color:'white', letterSpacing:-0.5, lineHeight:1 }}>{title}</div>
        {sub && <div style={{ fontSize:12, color:SS.dimText, marginTop:3 }}>{sub}</div>}
      </div>
      {action && (
        <button
          onClick={onAction}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            fontSize:11, color, background: hov ? `${color}25` : `${color}15`,
            border:`1px solid ${color}35`, padding:'5px 12px', borderRadius:20,
            cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600,
            transition:'background .15s',
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}
