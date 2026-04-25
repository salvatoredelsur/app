import type { SectionId } from '../../store/useStore';

const NAV = [
  { id:'dashboard',     label:'Dashboard',  icon:'⊞', color:'#00e5ff' },
  { id:'salud',         label:'Salud',      icon:'⚖️', color:'#00e896' },
  { id:'productividad', label:'Trabajo',    icon:'📊', color:'#ffe040' },
  { id:'habitos',       label:'Hábitos',    icon:'🔥', color:'#a855f7' },
  { id:'finanzas',      label:'Finanzas',   icon:'💰', color:'#ffe040' },
] as const;

interface Props { active: SectionId; setSection: (s: SectionId) => void; }

export function BottomNav({ active, setSection }: Props) {
  return (
    <div style={{
      position:'fixed', bottom:0, left:0, right:0, height:62,
      background:'#06101f', borderTop:'1px solid rgba(0,170,255,0.10)',
      display:'flex', alignItems:'center', justifyContent:'space-around',
      zIndex:100, paddingBottom:2,
    }}>
      {NAV.map(item => {
        const isActive = active === item.id;
        return (
          <button key={item.id} onClick={() => setSection(item.id as SectionId)} style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            background:'transparent', border:'none', cursor:'pointer', opacity: isActive ? 1 : 0.4,
            transition:'opacity .15s', padding:'4px 8px',
          }}>
            <span style={{ fontSize:18, filter: isActive ? `drop-shadow(0 0 6px ${item.color})` : 'none' }}>{item.icon}</span>
            <span style={{ fontSize:8, color: isActive ? item.color : 'rgba(255,255,255,0.5)', fontFamily:"'DM Sans',sans-serif", fontWeight: isActive ? 700 : 400, letterSpacing:.4 }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
