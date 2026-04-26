import { useEffect, useState } from 'react';
import type { SectionId, AppState } from '../store/useStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { SS } from '../tokens';
import { CircuitBg } from '../components/shared/CircuitBg';
import { Blob } from '../components/shared/Blob';
import { SectionHdr } from '../components/shared/SectionHdr';
import { StatCard } from '../components/shared/StatCard';
import { Card, CardTitle } from '../components/shared/Card';
import { Bar } from '../components/shared/Bar';
import { Donut } from '../components/shared/Donut';

interface Props {
  state: AppState;
  setSection: (s: SectionId) => void;
  toggleHabit: (id: number, date: string) => void;
  setNote: (date: string, text: string) => void;
}

const TODAY_STR = new Date().toISOString().slice(0, 10);

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function Dashboard({ state, setSection, toggleHabit, setNote }: Props) {
  const mobile = useIsMobile();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!state.fastStartTime && !state.studyTimerStart && !state.workTimerStart) return;
    const id = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(id);
  }, [state.fastStartTime, state.studyTimerStart, state.workTimerStart]);

  const weightTrend   = state.weightLog.slice(-14).map(e => e.kg);
  const balanceTrend  = (() => {
    const monthly: Record<string, number> = {};
    for (const t of state.transactions) {
      const m = t.date.slice(0, 7);
      monthly[m] = (monthly[m] ?? 0) + (t.type === 'income' ? t.amount : -t.amount);
    }
    const vals = Object.keys(monthly).sort().map(m => monthly[m]);
    return vals.length >= 2 ? vals : [38000,39500,40200,38800,41000,42500,41800,43200,44000,43500,44800,45230];
  })();
  const completedToday = state.habitCompletions.filter(c => c.date === TODAY_STR).length;
  const totalHabits    = state.habits.length;
  const habitPct       = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  const studyMin = state.studySessions.filter(s => s.date === TODAY_STR).reduce((a, b) => a + b.durationMin, 0)
    + (state.studyTimerStart ? Math.floor((Date.now() - new Date(state.studyTimerStart).getTime()) / 60000) : 0);
  const workMin  = state.workSessions.filter(s => s.date === TODAY_STR).reduce((a, b) => a + b.durationMin, 0)
    + (state.workTimerStart ? Math.floor((Date.now() - new Date(state.workTimerStart).getTime()) / 60000) : 0);
  const studyH = +(studyMin / 60).toFixed(1);
  const workH  = +(workMin  / 60).toFixed(1);

  const weekStudyH = +(Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    return state.studySessions.filter(s => s.date === ds).reduce((a, b) => a + b.durationMin, 0);
  }).reduce((a, b) => a + b, 0) / 60 + (state.studyTimerStart ? Math.floor((Date.now() - new Date(state.studyTimerStart).getTime()) / 60000) : 0) / 60).toFixed(1);
  const weekWorkH  = +(Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    return state.workSessions.filter(s => s.date === ds).reduce((a, b) => a + b.durationMin, 0);
  }).reduce((a, b) => a + b, 0) / 60 + (state.workTimerStart ? Math.floor((Date.now() - new Date(state.workTimerStart).getTime()) / 60000) : 0) / 60).toFixed(1);

  const allIncome  = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const allExpense = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalBalance = allIncome - allExpense;
  const CURR_MONTH = new Date().toISOString().slice(0, 7);
  const monthIncome  = state.transactions.filter(t => t.type === 'income'  && t.date.startsWith(CURR_MONTH)).reduce((s, t) => s + t.amount, 0);
  const monthExpense = state.transactions.filter(t => t.type === 'expense' && t.date.startsWith(CURR_MONTH)).reduce((s, t) => s + t.amount, 0);

  const fastElapsedH = state.fastStartTime
    ? (Date.now() - new Date(state.fastStartTime).getTime()) / 3600000
    : 0;
  const fastDone = state.fastStartTime && fastElapsedH >= state.fastGoalHours;
  const fastDisplay = state.fastStartTime
    ? `${Math.floor(fastElapsedH)}h ${Math.round((fastElapsedH % 1) * 60)}m`
    : 'Sin ayuno';
  const fastSub = state.fastStartTime
    ? (fastDone
        ? `✓ Meta ${state.fastGoalHours}h alcanzada`
        : `${state.fastGoalHours}:${24 - state.fastGoalHours} · En curso`)
    : 'Sin ayuno activo';

  const currentWeight = state.weightLog.length > 0 ? state.weightLog[state.weightLog.length - 1].kg : 78.5;
  const startWeight   = state.weightLog.length > 1 ? state.weightLog[0].kg : currentWeight;
  const weightDiff    = +(currentWeight - startWeight).toFixed(1);
  const savings       = monthIncome - monthExpense;
  const savingsPct    = monthIncome > 0 ? Math.round((Math.max(savings, 0) / monthIncome) * 100) : 0;
  const topProjects   = state.projects.slice(0, 3);
  const todayHabits   = [...state.habits].sort((a, b) => {
    const aDone = state.habitCompletions.some(c => c.habitId === a.id && c.date === TODAY_STR);
    const bDone = state.habitCompletions.some(c => c.habitId === b.id && c.date === TODAY_STR);
    return aDone === bDone ? 0 : aDone ? 1 : -1;
  }).slice(0, 5).map(h => ({
    ...h,
    done: state.habitCompletions.some(c => c.habitId === h.id && c.date === TODAY_STR),
  }));

  const todayNote = state.notes[TODAY_STR] ?? '';
  const dateStr = new Date().toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  return (
    <div style={{ position:'relative', minHeight:'100%' }}>
      <CircuitBg id="db" opacity={0.05}/>
      <Blob color={SS.cyan} top={-60} right={-40}/>
      <Blob color={SS.purple} bottom={100} left={-60}/>

      <SectionHdr title={`${greeting()}, Salvador 👋`} sub={dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} color={SS.cyan}/>

      {/* Stat cards: auto-fill handles both mobile and desktop */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12, marginBottom:20 }}>
        <StatCard label="Peso actual" value={`${currentWeight} kg`} sub={`Meta: ${state.weightGoalKg} kg · ${weightDiff >= 0 ? '+' : ''}${weightDiff} kg`} color={SS.green} icon="⚖️" sparkData={weightTrend} onClick={() => setSection('salud')}/>
        <StatCard label="Ayuno hoy" value={fastDisplay} sub={fastSub} color={fastDone ? SS.green : SS.orange} icon="⏱️" onClick={() => setSection('salud')}/>
        <StatCard label="Balance" value={`$${totalBalance.toLocaleString()}`} sub={`Este mes: ahorro ${savingsPct}% · $${Math.max(savings,0).toLocaleString()}`} color={SS.yellow} icon="💰" sparkData={balanceTrend} onClick={() => setSection('finanzas')}/>
        <StatCard label="Hábitos" value={`${habitPct}%`} sub={habitPct === 100 ? '¡Todos completados hoy! 🎉' : `${completedToday}/${totalHabits} completados hoy`} color={habitPct === 100 ? SS.green : SS.purple} icon="🔥" onClick={() => setSection('habitos')}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap:12, marginBottom:20 }}>
        {/* Proyectos */}
        <Card color={SS.cyan}>
          <CardTitle color={SS.cyan}>Proyectos Activos</CardTitle>
          {topProjects.length === 0
            ? <div style={{ fontSize:11, color:SS.dimText }}>Sin proyectos. Ve a Productividad.</div>
            : topProjects.map((p, i) => (
              <div key={p.id} style={{ marginBottom: i < topProjects.length - 1 ? 12 : 0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.85)' }}>{p.name}</div>
                    <div style={{ fontSize:9, color:SS.dimText }}>{p.cat} · vence {p.deadline}</div>
                  </div>
                  <span style={{ fontSize:12, fontWeight:800, color:p.color }}>{p.pct}%</span>
                </div>
                <Bar pct={p.pct} color={p.color}/>
              </div>
            ))
          }
          <button onClick={() => setSection('productividad')} style={{ marginTop:12, fontSize:10, color:SS.cyan, background:'transparent', border:'none', cursor:'pointer', padding:0, fontFamily:"'DM Sans',sans-serif", opacity:.7 }}>Ver todos los proyectos →</button>
        </Card>

        {/* Rutina */}
        <Card color={SS.purple}>
          <CardTitle color={SS.purple}>Hoy — Rutina</CardTitle>
          {todayHabits.length === 0
            ? <div style={{ fontSize:11, color:SS.dimText }}>Sin hábitos. Ve a Hábitos y añade algunos.</div>
            : todayHabits.map((t, i) => (
              <div key={t.id} onClick={() => toggleHabit(t.id, TODAY_STR)} style={{ display:'flex', alignItems:'center', gap:10, marginBottom: i < todayHabits.length - 1 ? 9 : 0, cursor:'pointer' }}>
                <div style={{
                  width:18, height:18, borderRadius:5,
                  background: t.done ? t.color : 'transparent',
                  border:`1.5px solid ${t.done ? t.color : 'rgba(255,255,255,0.2)'}`,
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                  boxShadow: t.done ? `0 0 8px ${t.color}80` : 'none',
                  fontSize:10, color:SS.bg, fontWeight:700, transition:'all .15s',
                }}>
                  {t.done && '✓'}
                </div>
                <span style={{ fontSize:12, color: t.done ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)', fontWeight: t.done ? 500 : 400 }}>{t.name}</span>
              </div>
            ))
          }
          {state.habits.length > 5 && (
            <button onClick={() => setSection('habitos')} style={{ marginTop:10, fontSize:10, color:SS.purple, background:'transparent', border:'none', cursor:'pointer', padding:0, fontFamily:"'DM Sans',sans-serif", opacity:.7 }}>
              +{state.habits.length - 5} más →
            </button>
          )}
        </Card>
      </div>

      {/* Productividad */}
      <Card color={SS.yellow}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <CardTitle color={SS.yellow}>Productividad de Hoy</CardTitle>
          <div style={{ display:'flex', gap:10, fontSize:9, color:SS.dimText }}>
            <span>Esta semana: <b style={{ color:SS.yellow }}>{weekStudyH}h</b> est.</span>
            <span><b style={{ color:SS.blue }}>{weekWorkH}h</b> trab.</span>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap:16 }}>
          {[
            { label:'Horas Estudio', current: studyH, goal:6, color:SS.yellow, running: !!state.studyTimerStart, subject: state.studyTimerSubject },
            { label:'Horas Trabajo',  current: workH,  goal:8, color:SS.blue,  running: !!state.workTimerStart,  subject: state.workTimerSubject  },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:14 }}>
              <Donut pct={Math.min((item.current / item.goal) * 100, 100)} color={item.color} size={60} stroke={7}
                label={`${item.current}h`} sublabel={`/${item.goal}h`}/>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>{item.label}</div>
                  {item.running && <div style={{ width:7, height:7, borderRadius:'50%', background:SS.green, boxShadow:`0 0 6px ${SS.green}`, animation:'pulse-dot 1.5s ease-in-out infinite' }}/>}
                </div>
                {item.running && item.subject && <div style={{ fontSize:9, color:item.color, marginBottom:1 }}>{item.subject}</div>}
                <div style={{ fontSize:10, color:SS.dimText }}>{item.current}/{item.goal}h · {Math.min(Math.round((item.current/item.goal)*100), 100)}%</div>
                <button onClick={() => setSection('productividad')} style={{ marginTop:4, fontSize:9, color:item.color, background:'transparent', border:'none', cursor:'pointer', padding:0, fontFamily:"'DM Sans',sans-serif", opacity:.7 }}>Ver detalles →</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Daily notes */}
      <Card color={SS.pink} style={{ marginTop:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <CardTitle color={SS.pink}>Nota del Día</CardTitle>
          <span style={{ fontSize:9, color:SS.dimText }}>{todayNote.length > 0 ? `${todayNote.length} chars · guardado` : 'vacía'}</span>
        </div>
        <textarea
          value={todayNote}
          onChange={e => setNote(TODAY_STR, e.target.value)}
          placeholder="Escribe algo para recordar hoy... reflexiones, pendientes, ideas..."
          rows={3}
          style={{
            width:'100%', background:SS.card2, border:`1px solid ${SS.pink}25`, borderRadius:10,
            padding:'10px 12px', color:'rgba(255,255,255,0.8)', fontSize:12, fontFamily:"'DM Sans',sans-serif",
            outline:'none', resize:'vertical', lineHeight:1.5,
          }}
        />
      </Card>
    </div>
  );
}
