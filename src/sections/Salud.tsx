import { useEffect, useState } from 'react';
import type { AppState } from '../store/useStore';
import { SS } from '../tokens';
import { CircuitBg } from '../components/shared/CircuitBg';
import { Blob } from '../components/shared/Blob';
import { SectionHdr } from '../components/shared/SectionHdr';
import { Card, CardTitle } from '../components/shared/Card';
import { Bar } from '../components/shared/Bar';
import { Donut } from '../components/shared/Donut';
import { Sparkline } from '../components/shared/Sparkline';

interface Props {
  state: AppState;
  toggleFast: () => void;
  addWeight: (kg: number) => void;
}

export function Salud({ state, toggleFast, addWeight }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  useEffect(() => {
    if (!state.fastStartTime) { setElapsed(0); return; }
    const tick = () => setElapsed((Date.now() - new Date(state.fastStartTime!).getTime()) / 3600000);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.fastStartTime]);

  const fastH = elapsed;
  const fastGoal = state.fastGoalHours;
  const fastPct = (fastH / fastGoal) * 100;
  const fastFloorH = Math.floor(fastH);
  const fastRemM = Math.round((fastH % 1) * 60);

  const weightData = state.weightLog.slice(-30).map(e => e.kg);
  const currentWeight = weightData.length > 0 ? weightData[weightData.length - 1] : 78.5;
  const startWeight = weightData.length > 0 ? weightData[0] : 82.0;
  const weightDiff = +(currentWeight - startWeight).toFixed(1);
  const weightGoal = 75;
  const weightPct = Math.max(0, Math.min(100, Math.round(((startWeight - currentWeight) / (startWeight - weightGoal)) * 100)));

  const fastStreak = (() => {
    let streak = 0;
    const sorted = [...state.fastLog].sort((a, b) => b.date.localeCompare(a.date));
    for (const e of sorted) { if (e.completed) streak++; else break; }
    return streak;
  })();

  const metrics = [
    { label:'Peso actual', value:`${currentWeight}`, unit:'kg', color:SS.green,  goal:'Meta: 75 kg', pct: weightPct },
    { label:'IMC',         value:'23.4', unit:'',    color:SS.cyan,   goal:'Normal ✓',    pct:100 },
    { label:'Grasa corp.', value:'18.2', unit:'%',   color:SS.yellow, goal:'Meta: <15%',  pct:72  },
    { label:'Músculo',     value:'42.1', unit:'%',   color:SS.blue,   goal:'Meta: >45%',  pct:80  },
  ];

  const handleWeightSave = () => {
    const v = parseFloat(weightInput);
    if (!isNaN(v) && v > 30 && v < 300) { addWeight(v); setShowWeightModal(false); setWeightInput(''); }
  };

  return (
    <div style={{ position:'relative' }}>
      <CircuitBg id="sh" opacity={0.05}/>
      <Blob color={SS.green} top={-40} right={20}/>
      <SectionHdr title="Salud & Ayuno" sub="Métricas corporales y seguimiento" color={SS.green} action="+ Registrar" onAction={() => setShowWeightModal(true)}/>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {metrics.map((m, i) => (
          <Card key={i} color={m.color} style={{ textAlign:'center', padding:'14px 10px' }}>
            <div style={{ fontSize:9, fontWeight:600, letterSpacing:1, textTransform:'uppercase', color:SS.dimText, marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:24, fontWeight:900, color:m.color, textShadow:`0 0 18px ${m.color}88`, lineHeight:1 }}>
              {m.value}<span style={{ fontSize:13, fontWeight:500, marginLeft:2 }}>{m.unit}</span>
            </div>
            <div style={{ fontSize:9, color:SS.dimText, marginTop:4, marginBottom:8 }}>{m.goal}</div>
            <Bar pct={m.pct} color={m.color} height={4}/>
          </Card>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14, marginBottom:20 }}>
        <Card color={SS.green}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <CardTitle color={SS.green}>Tendencia de Peso — 30 días</CardTitle>
            <span style={{ fontSize:11, color:SS.green, fontWeight:700 }}>{weightDiff >= 0 ? '+' : ''}{weightDiff} kg {weightDiff < 0 ? '↓' : '↑'}</span>
          </div>
          <Sparkline data={weightData.length >= 2 ? weightData : [82,78.5]} color={SS.green} width={360} height={80} filled/>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            {['1 Abr','8 Abr','15 Abr','22 Abr','Hoy'].map(d => <span key={d} style={{ fontSize:8, color:SS.mutedText }}>{d}</span>)}
          </div>
          <div style={{ display:'flex', gap:20, marginTop:12 }}>
            {[
              { l:'Inicio', v:`${startWeight} kg`, c:'rgba(255,255,255,0.4)' },
              { l:'Actual',  v:`${currentWeight} kg`, c:SS.green },
              { l:'Meta',    v:`${weightGoal}.0 kg`, c:SS.cyan },
            ].map((x, i) => (
              <div key={i}><div style={{ fontSize:9, color:SS.dimText }}>{x.l}</div><div style={{ fontSize:13, fontWeight:700, color:x.c }}>{x.v}</div></div>
            ))}
          </div>
        </Card>

        <Card color={SS.cyan} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
          <CardTitle color={SS.cyan}>Meta Corporal</CardTitle>
          <Donut pct={weightPct || 61} color={SS.green} size={100} stroke={11} label={`${currentWeight}`} sublabel="kg"/>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, color:SS.dimText }}>Faltan <span style={{ color:SS.green, fontWeight:700 }}>{Math.max(0, +(currentWeight - weightGoal).toFixed(1))} kg</span></div>
            <div style={{ fontSize:10, color:SS.mutedText }}>Meta: {weightGoal} kg · ~7 semanas</div>
          </div>
        </Card>
      </div>

      <Card color={SS.orange}>
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:24, alignItems:'center' }}>
          <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Donut pct={Math.min(fastPct, 100)} color={SS.orange} size={120} stroke={12}
              label={state.fastStartTime ? `${fastFloorH}h ${fastRemM}m` : '0h 0m'}
              sublabel={`/ ${fastGoal}h`}/>
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:SS.orange, marginBottom:6 }}>
              {state.fastStartTime ? 'Ayuno Activo — 16:8' : 'Sin Ayuno Activo'}
            </div>
            <div style={{ fontSize:20, fontWeight:800, color:'white', marginBottom:4 }}>
              {state.fastStartTime ? `${fastFloorH}h ${fastRemM}min transcurridos` : 'Inicia tu ayuno'}
            </div>
            {state.fastStartTime && (
              <div style={{ fontSize:11, color:SS.dimText, marginBottom:12 }}>
                Inicio: {new Date(state.fastStartTime).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})} · Meta: {fastGoal}h
              </div>
            )}
            <Bar pct={Math.min(fastPct, 100)} color={SS.orange} height={6}/>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'center' }}>
            <button
              onClick={toggleFast}
              style={{
                padding:'8px 16px', borderRadius:10, border:`1px solid ${state.fastStartTime ? SS.red : SS.orange}50`, cursor:'pointer',
                background: state.fastStartTime ? `${SS.red}22` : `${SS.orange}22`,
                color: state.fastStartTime ? SS.red : SS.orange,
                fontSize:11, fontWeight:600, fontFamily:"'DM Sans',sans-serif",
              }}
            >
              {state.fastStartTime ? '⏹ Romper' : '▶ Iniciar'}
            </button>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:16, fontWeight:800, color:SS.yellow }}>{fastStreak}</div>
              <div style={{ fontSize:8, color:SS.dimText }}>días racha</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop:16 }}>
          <CardTitle>Historial de Ayunos — Este mes</CardTitle>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {state.fastLog.slice(-28).map((d, i) => (
              <div key={i} title={`Día ${i+1}: ${d.pct}%`} style={{
                width:24, height:24, borderRadius:6,
                background: d.completed ? SS.orange : 'rgba(255,255,255,0.04)',
                border:`1px solid ${d.completed ? SS.orange + '60' : 'rgba(255,255,255,0.07)'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:8, color: d.completed ? SS.bg : 'rgba(255,255,255,0.2)', fontWeight:700,
                boxShadow: d.completed ? `0 0 6px ${SS.orange}60` : 'none',
              }}>{i+1}</div>
            ))}
          </div>
        </div>
      </Card>

      {showWeightModal && (
        <Modal title="Registrar Peso" color={SS.green} onClose={() => setShowWeightModal(false)}>
          <label style={{ fontSize:11, color:SS.dimText, display:'block', marginBottom:6 }}>Peso (kg)</label>
          <input
            type="number" step="0.1" min="30" max="300"
            value={weightInput} onChange={e => setWeightInput(e.target.value)}
            placeholder="78.5"
            style={{ width:'100%', background:SS.card2, border:`1px solid ${SS.green}40`, borderRadius:8, padding:'8px 12px', color:'white', fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none' }}
            autoFocus
          />
          <button onClick={handleWeightSave} style={{ marginTop:12, width:'100%', padding:'10px', background:SS.green, color:SS.bg, border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Guardar</button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, color, onClose, children }: { title: string; color: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={onClose}>
      <div style={{ background:'#0c1828', borderRadius:16, padding:24, minWidth:280, border:`1px solid ${color}30`, boxShadow:`0 0 40px ${color}20` }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:14, fontWeight:700, color:'white', marginBottom:16 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}
