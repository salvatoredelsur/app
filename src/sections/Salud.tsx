import { useEffect, useState } from 'react';
import type { AppState, HealthMetrics } from '../store/useStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { useEscapeKey } from '../hooks/useEscapeKey';
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
  setFastGoal: (h: number) => void;
  setWeightGoal: (kg: number) => void;
  updateHealthMetrics: (patch: Partial<HealthMetrics>) => void;
}

export function Salud({ state, toggleFast, addWeight, setFastGoal, setWeightGoal, updateHealthMetrics }: Props) {
  const mobile = useIsMobile();
  const [elapsed, setElapsed] = useState(0);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showFastModal, setShowFastModal] = useState(false);
  useEscapeKey(() => { setShowWeightModal(false); setShowMetricsModal(false); setShowFastModal(false); }, showWeightModal || showMetricsModal || showFastModal);
  const [weightInput, setWeightInput] = useState('');
  const [weightGoalInput, setWeightGoalInput] = useState('');
  const [fastGoalInput, setFastGoalInput] = useState(String(state.fastGoalHours));
  const [metricsForm, setMetricsForm] = useState({
    alturaM: String(state.healthMetrics.alturaM ?? 1.75),
    grasa:   String(state.healthMetrics.grasa),
    musculo: String(state.healthMetrics.musculo),
  });

  useEffect(() => {
    if (!state.fastStartTime) { setElapsed(0); return; }
    const tick = () => setElapsed((Date.now() - new Date(state.fastStartTime!).getTime()) / 3600000);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.fastStartTime]);

  const fastH    = elapsed;
  const fastGoal = state.fastGoalHours;
  const fastPct  = (fastH / fastGoal) * 100;
  const fFloor   = Math.floor(fastH);
  const fMin     = Math.round((fastH % 1) * 60);

  const weightData    = state.weightLog.slice(-30).map(e => e.kg);
  const currentWeight = weightData.length > 0 ? weightData[weightData.length - 1] : 78.5;
  const startWeight   = weightData.length > 0 ? weightData[0] : 82.0;
  const weightDiff    = +(currentWeight - startWeight).toFixed(1);
  const weightGoal    = state.weightGoalKg;
  const rawWeightPct  = (startWeight - weightGoal) !== 0
    ? ((startWeight - currentWeight) / (startWeight - weightGoal)) * 100
    : currentWeight <= weightGoal ? 100 : 0;
  const weightPct     = Math.max(0, Math.min(100, Math.round(rawWeightPct)));

  const fastStreak = (() => {
    let n = 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    const sorted = [...state.fastLog]
      .filter(e => e.completed || e.date !== todayStr)
      .sort((a, b) => b.date.localeCompare(a.date));
    for (const e of sorted) { if (e.completed) n++; else break; }
    return n;
  })();

  const { grasa, musculo, alturaM = 1.75 } = state.healthMetrics;
  const imc = alturaM > 0 ? +(currentWeight / (alturaM * alturaM)).toFixed(1) : state.healthMetrics.imc;

  const imcStatus = imc < 18.5 ? 'Bajo peso' : imc < 25 ? 'Normal ✓' : imc < 30 ? 'Sobrepeso' : 'Obesidad';
  const imcColor  = imc >= 18.5 && imc < 25 ? SS.green : imc >= 17 && imc < 30 ? SS.yellow : SS.red;
  const imcPct = imc >= 18.5 && imc < 25 ? 100 : imc < 18.5 ? Math.round((imc / 18.5) * 90) : Math.max(0, Math.round(100 - (imc - 25) * 6));

  const metrics = [
    { label:'Peso actual', value:`${currentWeight}`, unit:'kg', color:SS.green, goal:`Meta: ${weightGoal} kg`,  pct: weightPct, action: () => setShowWeightModal(true) },
    { label:'IMC',         value:`${imc}`,           unit:'',  color:imcColor,  goal:imcStatus,                 pct: imcPct,    action: () => setShowMetricsModal(true) },
    { label:'Grasa corp.', value:`${grasa}`,          unit:'%', color:SS.yellow, goal:'Meta: <15%',               pct: grasa > 0 ? Math.min(100, Math.round((15 / grasa) * 100)) : 0, action: () => setShowMetricsModal(true) },
    { label:'Músculo',     value:`${musculo}`,         unit:'%', color:SS.blue,   goal:'Meta: >45%',               pct: Math.min(100, Math.round((musculo / 45) * 100)), action: () => setShowMetricsModal(true) },
  ];

  const handleWeightSave = () => {
    const v = parseFloat(weightInput);
    const g = parseFloat(weightGoalInput);
    const validWeight = !isNaN(v) && v > 30 && v < 300;
    const validGoal   = !isNaN(g) && g > 30 && g < 300;
    if (!validWeight && !validGoal) return;
    if (validWeight) addWeight(v);
    if (validGoal)   setWeightGoal(g);
    setShowWeightModal(false);
    setWeightInput('');
    setWeightGoalInput('');
  };

  const handleMetricsSave = () => {
    const h = parseFloat(metricsForm.alturaM);
    updateHealthMetrics({
      alturaM: !isNaN(h) && h > 0.5 && h < 2.5 ? h : alturaM,
      grasa:   parseFloat(metricsForm.grasa)   || grasa,
      musculo: parseFloat(metricsForm.musculo) || musculo,
    });
    setShowMetricsModal(false);
  };

  const handleFastGoalSave = () => {
    const h = parseFloat(fastGoalInput);
    if (!isNaN(h) && h >= 12 && h <= 23) { setFastGoal(h); setShowFastModal(false); }
  };

  return (
    <div style={{ position:'relative' }}>
      <CircuitBg id="sh" opacity={0.05}/>
      <Blob color={SS.green} top={-40} right={20}/>
      <SectionHdr title="Salud & Ayuno" sub="Métricas corporales y seguimiento" color={SS.green} action="+ Registrar" onAction={() => setShowWeightModal(true)}/>

      {/* Metrics 4-col → 2-col on mobile */}
      <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {metrics.map((m, i) => (
          <Card key={i} color={m.color} style={{ textAlign:'center', padding:'14px 10px', cursor:'pointer' }} onClick={m.action}>
            <div style={{ fontSize:9, fontWeight:600, letterSpacing:1, textTransform:'uppercase', color:SS.dimText, marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:24, fontWeight:900, color:m.color, textShadow:`0 0 18px ${m.color}88`, lineHeight:1 }}>
              {m.value}<span style={{ fontSize:13, fontWeight:500, marginLeft:2 }}>{m.unit}</span>
            </div>
            <div style={{ fontSize:9, color:SS.dimText, marginTop:4, marginBottom:8 }}>{m.goal}</div>
            <Bar pct={Math.min(m.pct, 100)} color={m.color} height={4}/>
          </Card>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : '2fr 1fr', gap:14, marginBottom:20 }}>
        <Card color={SS.green}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <CardTitle color={SS.green}>Tendencia de Peso — 30 días</CardTitle>
            <span style={{ fontSize:11, color: weightDiff < 0 ? SS.green : SS.red, fontWeight:700 }}>
              {weightDiff >= 0 ? '+' : ''}{weightDiff} kg {weightDiff < 0 ? '↓' : '↑'}
            </span>
          </div>
          <div style={{ width:'100%' }}>
            <Sparkline data={weightData.length >= 2 ? weightData : [82,78.5]} color={SS.green} width={400} height={80} filled fluid/>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            {['Inicio','','','','Hoy'].map((d, i) => <span key={i} style={{ fontSize:8, color:SS.mutedText }}>{d}</span>)}
          </div>
          <div style={{ display:'flex', gap:20, marginTop:12 }}>
            {[
              { l:'Inicio', v:`${startWeight} kg`,   c:'rgba(255,255,255,0.4)' },
              { l:'Actual',  v:`${currentWeight} kg`, c:SS.green },
              { l:'Meta',    v:`${weightGoal} kg`,    c:SS.cyan },
            ].map((x, i) => (
              <div key={i}>
                <div style={{ fontSize:9, color:SS.dimText }}>{x.l}</div>
                <div style={{ fontSize:13, fontWeight:700, color:x.c }}>{x.v}</div>
              </div>
            ))}
          </div>
          {state.weightLog.length > 0 && (
            <div style={{ marginTop:14, borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:10 }}>
              <div style={{ fontSize:9, color:SS.dimText, marginBottom:6, fontWeight:600, letterSpacing:.8, textTransform:'uppercase' }}>Últimas entradas</div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {state.weightLog.slice(-5).reverse().map((e, i, arr) => {
                  const prev = arr[i + 1];
                  const diff = prev ? +(e.kg - prev.kg).toFixed(1) : null;
                  return (
                    <div key={e.date} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:9, color:SS.dimText }}>{e.date}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        {diff !== null && (
                          <span style={{ fontSize:9, color: diff < 0 ? SS.green : diff > 0 ? SS.red : SS.dimText }}>
                            {diff > 0 ? '+' : ''}{diff} kg
                          </span>
                        )}
                        <span style={{ fontSize:10, fontWeight:700, color: i === 0 ? SS.green : 'rgba(255,255,255,0.7)' }}>{e.kg} kg</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        <Card color={SS.cyan} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
          <CardTitle color={SS.cyan}>Meta Corporal</CardTitle>
          <Donut pct={weightPct} color={SS.green} size={100} stroke={11} label={`${currentWeight}`} sublabel="kg"/>
          {(() => {
            const toGoal = +(currentWeight - weightGoal).toFixed(1);
            const weeklyLoss = weightData.length >= 7
              ? +(weightData[weightData.length - 7] - weightData[weightData.length - 1]).toFixed(2)
              : 0;
            const gaining = weeklyLoss <= 0;
            const weeksEst = !gaining && weeklyLoss > 0
              ? Math.ceil(Math.max(0, toGoal) / weeklyLoss)
              : null;
            return (
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:SS.dimText }}>
                  {toGoal > 0
                    ? <>Faltan <span style={{ color:SS.green, fontWeight:700 }}>{toGoal} kg</span></>
                    : <span style={{ color:SS.green, fontWeight:700 }}>¡Meta alcanzada! 🎉</span>
                  }
                </div>
                <div style={{ fontSize:10, color: gaining && toGoal > 0 ? SS.orange : SS.mutedText }}>
                  Meta: {weightGoal} kg · {weeksEst !== null ? `~${weeksEst} sem` : gaining && toGoal > 0 ? '↑ tendencia positiva' : '✓'}
                </div>
                {!gaining && weeklyLoss > 0 && (
                  <div style={{ fontSize:9, color:SS.green, marginTop:1 }}>{weeklyLoss} kg/sem tendencia</div>
                )}
              </div>
            );
          })()}
        </Card>
      </div>

      {/* Ayuno */}
      <Card color={SS.orange}>
        <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : 'auto 1fr auto', gap:mobile ? 16 : 24, alignItems:'center' }}>
          <div style={{ display:'flex', justifyContent:'center' }}>
            <Donut pct={Math.min(fastPct, 100)} color={SS.orange} size={120} stroke={12}
              label={state.fastStartTime ? `${fFloor}h ${fMin}m` : '0h 0m'}
              sublabel={`/ ${fastGoal}h`}/>
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:SS.orange, marginBottom:6 }}>
              {state.fastStartTime ? `Ayuno Activo — ${fastGoal}:${24 - fastGoal}` : 'Sin Ayuno Activo'}
            </div>
            <div style={{ fontSize:20, fontWeight:800, color:'white', marginBottom:4 }}>
              {state.fastStartTime ? `${fFloor}h ${fMin}min transcurridos` : 'Inicia tu ayuno'}
            </div>
            {state.fastStartTime && (() => {
              const startMs  = new Date(state.fastStartTime).getTime();
              const fastEnd  = new Date(startMs + fastGoal * 3600000);
              const eatEnd   = new Date(startMs + 24 * 3600000);
              const fmt = (d: Date) => d.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' });
              return (
                <div style={{ fontSize:11, color:SS.dimText, marginBottom:12, lineHeight:1.7 }}>
                  <span>Inicio: <b style={{ color:'rgba(255,255,255,0.6)' }}>{fmt(new Date(startMs))}</b></span>
                  {' · '}
                  <span>Meta: <b style={{ color: fastPct >= 100 ? SS.green : SS.orange }}>{fmt(fastEnd)}</b></span>
                  {' · '}
                  <span style={{ color: fastPct >= 100 ? SS.green : SS.dimText }}>
                    Comer hasta: <b style={{ color:'rgba(255,255,255,0.5)' }}>{fmt(eatEnd)}</b>
                  </span>
                </div>
              );
            })()}
            <Bar pct={Math.min(fastPct, 100)} color={SS.orange} height={6}/>
            {fastPct >= 100 && (
              <div style={{ fontSize:11, color:SS.green, marginTop:6, fontWeight:600 }}>✓ ¡Ayuno completado!</div>
            )}
          </div>
          <div style={{ display:'flex', flexDirection: mobile ? 'row' : 'column', gap:8, alignItems:'center', justifyContent:'center' }}>
            <button onClick={toggleFast} style={{
              padding:'8px 16px', borderRadius:10, border:`1px solid ${state.fastStartTime ? SS.red : SS.orange}50`, cursor:'pointer',
              background: state.fastStartTime ? `${SS.red}22` : `${SS.orange}22`,
              color: state.fastStartTime ? SS.red : SS.orange,
              fontSize:11, fontWeight:600, fontFamily:"'DM Sans',sans-serif",
            }}>
              {state.fastStartTime ? '⏹ Romper' : '▶ Iniciar'}
            </button>
            <button onClick={() => { setFastGoalInput(String(state.fastGoalHours)); setShowFastModal(true); }} style={{
              padding:'6px 12px', borderRadius:10, border:`1px solid rgba(255,255,255,0.1)`, cursor:'pointer',
              background:'transparent', color:SS.dimText, fontSize:10, fontWeight:500, fontFamily:"'DM Sans',sans-serif",
            }}>⚙ {fastGoal}h</button>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:16, fontWeight:800, color:SS.yellow }}>{fastStreak}</div>
              <div style={{ fontSize:8, color:SS.dimText }}>días racha</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <CardTitle>Historial de Ayunos — Este mes</CardTitle>
            {state.fastLog.length > 0 && (() => {
              const last28 = state.fastLog.slice(-28);
              const completed = last28.filter(d => d.completed).length;
              const avgPct = Math.round(last28.reduce((a, d) => a + d.pct, 0) / last28.length);
              return (
                <div style={{ display:'flex', gap:12, fontSize:10, color:SS.dimText }}>
                  <span><b style={{ color:SS.orange }}>{completed}</b>/{last28.length} completos</span>
                  <span>avg <b style={{ color:SS.orange }}>{avgPct}%</b></span>
                </div>
              );
            })()}
          </div>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {state.fastLog.slice(-28).map((d, i) => {
              const dayNum = new Date(d.date).getDate();
              return (
                <div key={i} title={`${d.date}: ${d.pct}% · ${d.completed ? 'Completado' : 'Parcial'}`} style={{
                  width:26, height:26, borderRadius:6,
                  background: d.completed ? SS.orange : d.pct > 0 ? `${SS.orange}44` : 'rgba(255,255,255,0.04)',
                  border:`1px solid ${d.completed ? SS.orange + '60' : 'rgba(255,255,255,0.07)'}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:8, color: d.completed ? SS.bg : 'rgba(255,255,255,0.2)', fontWeight:700,
                  boxShadow: d.completed ? `0 0 6px ${SS.orange}60` : 'none',
                }}>{dayNum}</div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Modals */}
      {showWeightModal && (
        <Modal title="Registrar Peso" color={SS.green} onClose={() => setShowWeightModal(false)}>
          <label style={labelStyle}>Peso actual (kg)</label>
          <input type="number" step="0.1" min="30" max="300" value={weightInput}
            onChange={e => setWeightInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleWeightSave()}
            placeholder={`${currentWeight}`} autoFocus style={inputStyle(SS.green)}/>
          <label style={labelStyle}>Meta de peso (kg) — actual: {weightGoal} kg</label>
          <input type="number" step="0.1" min="30" max="300" value={weightGoalInput}
            onChange={e => setWeightGoalInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleWeightSave()}
            placeholder={`${weightGoal}`} style={inputStyle(SS.green)}/>
          <Btn color={SS.green} onClick={handleWeightSave}>Guardar</Btn>
        </Modal>
      )}

      {showMetricsModal && (
        <Modal title="Editar Métricas" color={SS.cyan} onClose={() => setShowMetricsModal(false)}>
          {[
            { label:'Altura (m)', key:'alturaM' as const, placeholder:'1.75', step:'0.01' },
            { label:'Grasa corporal (%)', key:'grasa' as const, placeholder:'18.2', step:'0.1' },
            { label:'Músculo (%)', key:'musculo' as const, placeholder:'42.1', step:'0.1' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:10 }}>
              <label style={labelStyle}>{f.label}</label>
              <input type="number" step={f.step} value={metricsForm[f.key]}
                onChange={e => setMetricsForm(p => ({ ...p, [f.key]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleMetricsSave()}
                placeholder={f.placeholder} style={inputStyle(SS.cyan)}/>
            </div>
          ))}
          {(() => {
            const h = parseFloat(metricsForm.alturaM);
            if (isNaN(h) || h <= 0) return null;
            const calcImc = +(currentWeight / (h * h)).toFixed(1);
            const status = calcImc < 18.5 ? 'Bajo peso' : calcImc < 25 ? 'Normal ✓' : calcImc < 30 ? 'Sobrepeso' : 'Obesidad';
            return (
              <div style={{ background:`${SS.cyan}12`, border:`1px solid ${SS.cyan}25`, borderRadius:8, padding:'8px 12px', marginBottom:12 }}>
                <span style={{ fontSize:11, color:SS.dimText }}>IMC calculado: </span>
                <span style={{ fontSize:13, color:SS.cyan, fontWeight:700 }}>{calcImc}</span>
                <span style={{ fontSize:10, color:SS.dimText }}> · {status}</span>
              </div>
            );
          })()}
          <Btn color={SS.cyan} onClick={handleMetricsSave}>Guardar</Btn>
        </Modal>
      )}

      {showFastModal && (
        <Modal title="Meta de Ayuno" color={SS.orange} onClose={() => setShowFastModal(false)}>
          <label style={labelStyle}>Horas de ayuno (12–23)</label>
          <input type="number" min="12" max="23" step="1" value={fastGoalInput}
            onChange={e => setFastGoalInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleFastGoalSave()}
            placeholder="16" autoFocus style={inputStyle(SS.orange)}/>
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            {[12,14,16,18,20,23].map(h => (
              <button key={h} onClick={() => setFastGoalInput(String(h))} style={{
                padding:'5px 12px', borderRadius:8, border:`1px solid ${fastGoalInput===String(h)?SS.orange:'rgba(255,255,255,0.1)'}`,
                background: fastGoalInput===String(h)?`${SS.orange}22`:'transparent',
                color: fastGoalInput===String(h)?SS.orange:'rgba(255,255,255,0.5)',
                fontSize:11, cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
              }}>{h}h</button>
            ))}
          </div>
          <Btn color={SS.orange} onClick={handleFastGoalSave}>Guardar</Btn>
        </Modal>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize:11, color:'rgba(255,255,255,0.45)', display:'block', marginBottom:6 };
const inputStyle = (color: string): React.CSSProperties => ({
  width:'100%', background:'#0f2038', border:`1px solid ${color}40`, borderRadius:8,
  padding:'8px 12px', color:'white', fontSize:13, fontFamily:"'DM Sans',sans-serif",
  outline:'none', marginBottom:12,
});

function Btn({ color, onClick, children }: { color:string; onClick:()=>void; children:React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ width:'100%', padding:'10px', background:color, color:'#060c18', border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
      {children}
    </button>
  );
}

function Modal({ title, color, onClose, children }: { title:string; color:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={onClose}>
      <div style={{ background:'#0c1828', borderRadius:16, padding:24, minWidth:300, maxWidth:380, width:'90%', border:`1px solid ${color}30`, boxShadow:`0 0 40px ${color}20` }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:14, fontWeight:700, color:'white', marginBottom:16 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}
