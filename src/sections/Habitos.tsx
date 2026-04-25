import { useState } from 'react';
import type { AppState, Habit } from '../store/useStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { SS } from '../tokens';
import { CircuitBg } from '../components/shared/CircuitBg';
import { Blob } from '../components/shared/Blob';
import { SectionHdr } from '../components/shared/SectionHdr';
import { Card, CardTitle } from '../components/shared/Card';
import { Bar } from '../components/shared/Bar';
import { Donut } from '../components/shared/Donut';

interface Props {
  state: AppState;
  toggleHabit: (id: number, date: string) => void;
  markAllHabits: (date: string) => void;
  addHabit: (h: Omit<Habit, 'id'>) => void;
  updateHabit: (id: number, patch: Partial<Omit<Habit, 'id'>>) => void;
  deleteHabit: (id: number) => void;
}

const WEEK_DAYS = ['L','M','X','J','V','S','D'];
const HABIT_COLORS = [SS.green, SS.pink, SS.blue, SS.yellow, SS.orange, SS.purple, SS.cyan, '#ff9f43', '#74b9ff', '#fd79a8'];

function getDateStr(daysAgo: number) {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export function Habitos({ state, toggleHabit, markAllHabits, addHabit, updateHabit, deleteHabit }: Props) {
  const mobile = useIsMobile();
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitColor, setNewHabitColor] = useState<string>(SS.green);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<string>(SS.green);
  useEscapeKey(() => { setShowModal(false); setEditingHabit(null); }, showModal || !!editingHabit);

  const { habits, habitCompletions } = state;
  const TODAY_STR = getDateStr(0);
  const completedToday = habitCompletions.filter(c => c.date === TODAY_STR).length;
  const allDoneToday = habits.length > 0 && completedToday === habits.length;

  const completedTotal = habitCompletions.length;
  const possibleTotal  = habits.length * 25;
  const remainingEst   = Math.max(0, possibleTotal - completedTotal);

  const habitStreaks = habits.map(h => {
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const date = getDateStr(i);
      if (habitCompletions.some(c => c.habitId === h.id && c.date === date)) streak++;
      else break;
    }
    return streak;
  });

  const overallStreak = (() => {
    if (habits.length === 0) return 0;
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const date = getDateStr(i);
      const done = habitCompletions.filter(c => c.date === date).length;
      if (done >= Math.ceil(habits.length / 2)) streak++;
      else break;
    }
    return streak;
  })();

  const maxStreak = Math.max(...habitStreaks, overallStreak, 0);

  const totalPossible = habits.length * 30;
  const avgPct = totalPossible > 0 ? Math.round((completedTotal / totalPossible) * 100) : 0;

  const daily = Array.from({ length: 30 }, (_, i) => {
    const date = getDateStr(29 - i);
    const done = habitCompletions.filter(c => c.date === date).length;
    return habits.length > 0 ? Math.round((done / habits.length) * 100) : 0;
  });

  const W = 500, H = 70;
  const pts = daily.map((v, i): [number, number] => [
    (i / (daily.length - 1)) * (W - 24) + 12,
    H - ((v / 100) * (H - 8)) + 4,
  ]);
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const fillPath = linePath + ` L${pts[pts.length-1][0]},${H+4} L${pts[0][0]},${H+4} Z`;

  const weekVals = Array.from({ length: 7 }, (_, i) => {
    const date = getDateStr(6 - i);
    const done = habitCompletions.filter(c => c.date === date).length;
    return habits.length > 0 ? Math.round((done / habits.length) * 100) : 0;
  });

  const TRACKING_DAYS = 25;
  const topHabits = habits.map((h, i) => {
    const done = habitCompletions.filter(c => c.habitId === h.id).length;
    return { ...h, pct: Math.round((done / TRACKING_DAYS) * 100), streak: habitStreaks[i] ?? 0 };
  }).sort((a, b) => b.pct - a.pct);

  const RANK_COLORS = [SS.yellow, 'rgba(200,210,230,0.8)', '#cd7f32'];

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return;
    addHabit({ name: newHabitName.trim(), color: newHabitColor });
    setShowModal(false);
    setNewHabitName('');
    setNewHabitColor(SS.green);
  };

  const openEdit = (h: Habit) => {
    setEditingHabit(h);
    setEditName(h.name);
    setEditColor(h.color);
  };

  const handleEditSave = () => {
    if (!editingHabit || !editName.trim()) return;
    updateHabit(editingHabit.id, { name: editName.trim(), color: editColor });
    setEditingHabit(null);
  };

  const inputStyle = (color: string) => ({
    width:'100%', background:SS.card2, border:`1px solid ${color}40`, borderRadius:8,
    padding:'8px 12px', color:'white', fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none', marginBottom:12,
  });

  return (
    <div style={{ position:'relative' }}>
      <CircuitBg id="hb" opacity={0.05}/>
      <Blob color={SS.purple} top={-40} right={-20}/>
      <SectionHdr title="Hábitos Diarios" sub={`${new Date().toLocaleDateString('es-MX',{month:'long',year:'numeric'})} · Hoy: ${completedToday}/${habits.length}`} color={SS.purple} action="+ Hábito" onAction={() => setShowModal(true)}/>
      <div style={{ display:'flex', gap:8, marginBottom:16, marginTop:-10 }}>
        <button onClick={() => markAllHabits(TODAY_STR)} style={{ fontSize:10, color: allDoneToday ? SS.red : SS.purple, background: allDoneToday ? `${SS.red}12` : `${SS.purple}12`, border:`1px solid ${allDoneToday ? SS.red : SS.purple}30`, borderRadius:14, padding:'4px 12px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>
          {allDoneToday ? '↺ Desmarcar todos' : '✓ Marcar todos hoy'}
        </button>
      </div>

      {/* Today's quick-check grid */}
      <Card color={SS.purple} style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <CardTitle color={SS.purple}>Hoy — Check-in Rápido</CardTitle>
          <span style={{ fontSize:11, color: allDoneToday ? SS.green : SS.dimText, fontWeight: allDoneToday ? 700 : 400 }}>
            {allDoneToday ? '¡Todo completado! 🔥' : `${completedToday} / ${habits.length}`}
          </span>
        </div>
        {habits.length === 0 ? (
          <div style={{ fontSize:11, color:SS.dimText }}>Sin hábitos. Añade uno con + Hábito.</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:`repeat(auto-fill, minmax(${mobile ? 100 : 120}px, 1fr))`, gap:8 }}>
            {habits.map(h => {
              const done = habitCompletions.some(c => c.habitId === h.id && c.date === TODAY_STR);
              return (
                <div key={h.id} onClick={() => toggleHabit(h.id, TODAY_STR)} style={{
                  display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:10, cursor:'pointer',
                  background: done ? `${h.color}18` : 'rgba(255,255,255,0.03)',
                  border:`1px solid ${done ? h.color + '40' : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: done ? `0 0 10px ${h.color}20` : 'none',
                  transition:'all .15s',
                }}>
                  <div style={{
                    width:16, height:16, borderRadius:4, flexShrink:0,
                    background: done ? h.color : 'transparent',
                    border:`1.5px solid ${done ? h.color : 'rgba(255,255,255,0.2)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:9, color:SS.bg, fontWeight:800, boxShadow: done ? `0 0 6px ${h.color}80` : 'none',
                  }}>{done && '✓'}</div>
                  <span style={{ fontSize:11, color: done ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', fontWeight: done ? 600 : 400, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{h.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { lb:'Este mes',    val: String(completedTotal), c:SS.green  },
          { lb:'Restantes',  val: String(remainingEst),   c:SS.pink   },
          { lb:'Días racha', val: String(overallStreak),  c:SS.yellow },
          { lb:'Mejor racha',val: String(maxStreak),      c:SS.cyan   },
        ].map((s, i) => (
          <Card key={i} color={s.c} style={{ textAlign:'center', padding:'12px 8px' }}>
            <div style={{ fontSize:28, fontWeight:900, color:s.c, textShadow:`0 0 18px ${s.c}99`, lineHeight:1 }}>{s.val}</div>
            <div style={{ fontSize:9, color:SS.dimText, marginTop:3 }}>{s.lb}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : '2fr 1fr', gap:14, marginBottom:20 }}>
        <Card color={SS.green}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <CardTitle color={SS.green}>Progreso Diario — {new Date().toLocaleDateString('es-MX',{month:'long'})}</CardTitle>
            <span style={{ fontSize:11, color:SS.green, fontWeight:700 }}>{avgPct}% avg</span>
          </div>
          <svg width="100%" viewBox={`0 0 ${W} ${H+8}`} style={{ display:'block' }}>
            <defs>
              <linearGradient id="hlg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SS.green} stopOpacity=".25"/>
                <stop offset="100%" stopColor={SS.green} stopOpacity=".01"/>
              </linearGradient>
            </defs>
            {[25,50,75].map(v => <line key={v} x1="0" y1={H-((v/100)*(H-8))+4} x2={W} y2={H-((v/100)*(H-8))+4} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>)}
            <path d={fillPath} fill="url(#hlg)"/>
            <path d={linePath} fill="none" stroke={SS.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter:`drop-shadow(0 0 4px ${SS.green})` }}/>
            <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r={4} fill="#060c18" stroke={SS.green} strokeWidth="2"/>
          </svg>
        </Card>

        <Card color={SS.purple} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <CardTitle color={SS.purple}>Esta Semana</CardTitle>
            <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:50 }}>
              {weekVals.map((v, i) => (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                  <div style={{ width:'100%', height:`${Math.max((v/100)*46, 2)}px`, background:SS.purple, borderRadius:3, boxShadow:`0 0 5px ${SS.purple}60`, opacity: 0.4 + (v/100)*0.6 }}/>
                  <span style={{ fontSize:7.5, color:SS.mutedText }}>{WEEK_DAYS[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'center' }}>
            <Donut pct={avgPct} color={SS.purple} size={72} stroke={8} label={`${avgPct}%`}/>
          </div>
        </Card>
      </div>

      <Card color={SS.blue} style={{ marginBottom:14 }}>
        <CardTitle color={SS.blue}>Cuadrícula Mensual</CardTitle>
        <div style={{ overflowX:'auto' }}>
          {habits.length === 0 && <div style={{ fontSize:11, color:SS.dimText, padding:'8px 0' }}>No hay hábitos aún. Añade uno con + Hábito.</div>}
          {habits.map((habit, hi) => {
            const streak = habitStreaks[hi] ?? 0;
            return (
            <div key={habit.id} style={{ display:'flex', alignItems:'center', gap:4, marginBottom:5 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, minWidth:96, flexShrink:0 }}>
                <div style={{ width:7, height:7, borderRadius:2, background:habit.color, flexShrink:0 }}/>
                <span style={{ fontSize:9, color:'rgba(255,255,255,0.55)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:62 }}>{habit.name}</span>
                {streak > 0 && <span style={{ fontSize:8, color:habit.color, fontWeight:700, flexShrink:0 }}>🔥{streak}</span>}
              </div>
              <div style={{ display:'flex', gap:2 }}>
                {Array.from({ length: 25 }, (_, di) => {
                  const date = getDateStr(24 - di);
                  const isToday = di === 24;
                  const done = habitCompletions.some(c => c.habitId === habit.id && c.date === date);
                  return (
                    <div key={di} onClick={() => toggleHabit(habit.id, date)} title={`${date}${isToday ? ' · HOY' : ''}`}
                      style={{ width:14, height:14, borderRadius:3, cursor:'pointer', background: done ? habit.color : 'rgba(255,255,255,0.04)', border:`1px solid ${isToday ? 'rgba(255,255,255,0.3)' : done ? habit.color + '50' : 'rgba(255,255,255,0.06)'}`, boxShadow: done ? `0 0 4px ${habit.color}80` : 'none', outline: isToday && !done ? '1px solid rgba(255,255,255,0.15)' : 'none', outlineOffset:1, transition:'background .1s' }}/>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      </Card>

      <Card color={SS.cyan}>
        <CardTitle color={SS.cyan}>Ranking del Mes</CardTitle>
        {topHabits.length === 0 && <div style={{ fontSize:11, color:SS.dimText }}>Sin datos aún.</div>}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 20px' }}>
          {topHabits.map((h, i) => (
            <div key={h.id} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:10, fontWeight:800, color: i < 3 ? RANK_COLORS[i] : 'rgba(255,255,255,0.25)', width:16, flexShrink:0 }}>{i+1}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.8)', fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:80 }}>{h.name}</span>
                  <span style={{ fontSize:10, color:h.color, fontWeight:700, flexShrink:0 }}>{h.pct}%</span>
                </div>
                <Bar pct={h.pct} color={h.color} height={3}/>
              </div>
              <button onClick={() => openEdit(h)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.2)', fontSize:11, padding:'0 2px', lineHeight:1, flexShrink:0 }}
                onMouseEnter={e => (e.currentTarget.style.color = SS.cyan)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}>✏</button>
              <button onClick={() => deleteHabit(h.id)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.15)', fontSize:12, padding:0, lineHeight:1, flexShrink:0 }}
                onMouseEnter={e => (e.currentTarget.style.color = SS.red)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.15)')}>×</button>
            </div>
          ))}
        </div>
      </Card>

      {/* Add habit modal */}
      {showModal && (
        <Modal title="Nuevo Hábito" color={SS.purple} onClose={() => setShowModal(false)}>
          <label style={labelStyle}>Nombre</label>
          <input value={newHabitName} onChange={e => setNewHabitName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddHabit()}
            placeholder="Meditación 10 min..." autoFocus style={inputStyle(SS.purple)}/>
          <label style={labelStyle}>Color</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
            {HABIT_COLORS.map(c => (
              <div key={c} onClick={() => setNewHabitColor(c)}
                style={{ width:22, height:22, borderRadius:6, background:c, cursor:'pointer', border: newHabitColor === c ? `2px solid white` : `2px solid transparent`, boxShadow: newHabitColor === c ? `0 0 8px ${c}` : 'none' }}/>
            ))}
          </div>
          <button onClick={handleAddHabit} style={{ width:'100%', padding:'10px', background:SS.purple, color:'white', border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Crear Hábito</button>
        </Modal>
      )}

      {/* Edit habit modal */}
      {editingHabit && (
        <Modal title="Editar Hábito" color={editColor} onClose={() => setEditingHabit(null)}>
          <label style={labelStyle}>Nombre</label>
          <input value={editName} onChange={e => setEditName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEditSave()}
            placeholder={editingHabit.name} autoFocus style={inputStyle(editColor)}/>
          <label style={labelStyle}>Color</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
            {HABIT_COLORS.map(c => (
              <div key={c} onClick={() => setEditColor(c)}
                style={{ width:22, height:22, borderRadius:6, background:c, cursor:'pointer', border: editColor === c ? `2px solid white` : `2px solid transparent`, boxShadow: editColor === c ? `0 0 8px ${c}` : 'none' }}/>
            ))}
          </div>
          <button onClick={handleEditSave} style={{ width:'100%', padding:'10px', background:editColor, color:'white', border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Guardar cambios</button>
        </Modal>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize:11, color:'rgba(255,255,255,0.45)', display:'block', marginBottom:6 };

function Modal({ title, color, onClose, children }: { title:string; color:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={onClose}>
      <div style={{ background:'#0c1828', borderRadius:16, padding:24, minWidth:300, border:`1px solid ${color}30`, boxShadow:`0 0 40px ${color}20` }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:14, fontWeight:700, color:'white', marginBottom:16 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}
