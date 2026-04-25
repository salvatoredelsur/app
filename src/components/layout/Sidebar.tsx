import { useState } from 'react';
import type { SectionId } from '../../store/useStore';

const NAV = [
  { id:'dashboard',     label:'Dashboard',     icon:'⊞', color:'#00e5ff' },
  { id:'salud',         label:'Salud & Ayuno', icon:'⚖️', color:'#00e896' },
  { id:'productividad', label:'Productividad', icon:'📊', color:'#ffe040' },
  { id:'habitos',       label:'Hábitos',       icon:'🔥', color:'#a855f7' },
  { id:'finanzas',      label:'Finanzas',      icon:'💰', color:'#ffe040' },
] as const;

interface Props { active: SectionId; setSection: (s: SectionId) => void; collapsed: boolean; onExport: () => void; onImport: (json: string) => void; }

export function Sidebar({ active, setSection, collapsed, onExport, onImport }: Props) {
  const w = collapsed ? 64 : 220;
  return (
    <div style={{
      width:w, minWidth:w, height:'100vh',
      background:'#06101f',
      borderRight:'1px solid rgba(0,170,255,0.08)',
      display:'flex', flexDirection:'column',
      transition:'width .25s ease', overflow:'hidden', flexShrink:0,
      position:'relative', zIndex:10,
    }}>
      <div style={{ padding: collapsed ? '24px 12px' : '24px 20px', borderBottom:'1px solid rgba(0,170,255,0.07)', display:'flex', alignItems:'center', gap:10, overflow:'hidden' }}>
        <div style={{ width:36, height:36, borderRadius:18, flexShrink:0, background:'linear-gradient(135deg,#00aaff,#0040a0)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 14px rgba(0,170,255,0.4)', fontSize:13, fontWeight:900, color:'white' }}>SS</div>
        {!collapsed && (
          <div style={{ overflow:'hidden' }}>
            <div style={{ fontSize:13, fontWeight:800, color:'white', letterSpacing:-.3, whiteSpace:'nowrap' }}>Salvador Schulz</div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:1, textTransform:'uppercase', marginTop:1 }}>Dashboard Personal</div>
          </div>
        )}
      </div>

      <nav style={{ flex:1, padding:'16px 8px', display:'flex', flexDirection:'column', gap:4 }}>
        {NAV.map(item => {
          const isActive = active === item.id;
          return <NavItem key={item.id} item={item} isActive={isActive} collapsed={collapsed} onClick={() => setSection(item.id as SectionId)}/>;
        })}
      </nav>

      <div style={{ padding: collapsed ? '12px 8px' : '12px 20px', borderTop:'1px solid rgba(0,170,255,0.07)', display:'flex', flexDirection: collapsed ? 'column' : 'row', gap:6, alignItems:'center' }}>
        <button onClick={onExport} title="Exportar datos" style={{ flex: collapsed ? 'none' : 1, padding:'5px 8px', borderRadius:8, border:'1px solid rgba(0,170,255,0.15)', background:'transparent', color:'rgba(255,255,255,0.35)', fontSize: collapsed ? 14 : 10, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          {collapsed ? '↓' : '↓ Exportar'}
        </button>
        <label title="Importar datos" style={{ flex: collapsed ? 'none' : 1, display:'flex', justifyContent:'center', padding:'5px 8px', borderRadius:8, border:'1px solid rgba(0,170,255,0.15)', color:'rgba(255,255,255,0.35)', fontSize: collapsed ? 14 : 10, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          {collapsed ? '↑' : '↑ Importar'}
          <input type="file" accept=".json" style={{ display:'none' }} onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => onImport(ev.target?.result as string);
            reader.readAsText(file);
            e.target.value = '';
          }}/>
        </label>
      </div>
    </div>
  );
}

function NavItem({ item, isActive, collapsed, onClick }: { item: typeof NAV[number]; isActive: boolean; collapsed: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:10,
        padding:'10px 14px', borderRadius:11, border:'none', cursor:'pointer',
        background: isActive ? `${item.color}14` : hov ? 'rgba(255,255,255,0.04)' : 'transparent',
        borderLeft: isActive ? `3px solid ${item.color}` : '3px solid transparent',
        transition:'all .15s', overflow:'hidden', width:'100%', textAlign:'left',
      }}
    >
      <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
      {!collapsed && (
        <span style={{
          fontSize:12, fontWeight: isActive ? 700 : 500,
          color: isActive ? item.color : 'rgba(255,255,255,0.55)',
          letterSpacing:.2, whiteSpace:'nowrap',
          textShadow: isActive ? `0 0 12px ${item.color}80` : 'none',
        }}>
          {item.label}
        </span>
      )}
    </button>
  );
}
