import type { SectionId, AppState } from '../store/useStore';
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
}

const TODAY_STR = new Date().toISOString().slice(0, 10);

export function Dashboard({ state, setSection, toggleHabit }: Props) {
  const weightTrend = state.weightLog.slice(-14).map(e => e.kg);
  const balanceTrend = [38000,39500,40200,38800,41000,42500,41800,43200,44000,43500,44800,45230];

  const completedToday = state.habitCompletions.filter(c => c.date === TODAY_STR).length;
  const totalHabits = state.habits.length;
  const habitPct = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  const studyMin = state.studySessions.filter(s => s.date === TODAY_STR).reduce((a, b) => a + b.durationMin, 0);
  const workMin  = state.workSessions.filter(s => s.date === TODAY_STR).reduce((a, b) => a + b.durationMin, 0);
  const studyH = +(studyMin / 60).toFixed(1);
  const workH  = +(workMin / 60).toFixed(1);

  const totalBalance = state.transactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0);

  const fastElapsedH = state.fastStartTime
    ? (Date.now() - new Date(state.fastStartTime).getTime()) / 3600000
    : 0;
  const fastDisplay = state.fastStartTime
    ? `${Math.floor(fastElapsedH)}h ${Math.round((fastElapsedH % 1) * 60)}m`
    : 'Sin ayuno';

  const currentWeight = state.weightLog.length > 0 ? state.weightLog[state.weightLog.length - 1].kg : 78.5;

  const topProjects = state.projects.slice(0, 3);

  const todayHabits = state.habits.slice(0, 5).map(h => ({
    ...h,
    done: state.habitCompletions.some(c => c.habitId === h.id && c.date === TODAY_STR),
  }));

  return (
    <div style={{ position:'relative', minHeight:'100%' }}>
      <CircuitBg id="db" opacity={0.05}/>
      <Blob color={SS.cyan} top={-60} right={-40}/>
      <Blob color={SS.purple} bottom={100} left={-60}/>

      <SectionHdr title="Buenos días, Salvador 👋" sub="Viernes, 25 de Abril 2026" color={SS.cyan}/>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12, marginBottom:20 }}>
        <StatCard label="Peso actual" value={`${currentWeight} kg`} sub="Meta: 75 kg · −3.5 kg" color={SS.green} icon="⚖️" sparkData={weightTrend} onClick={() => setSection('salud')}/>
        <StatCard label="Ayuno hoy" value={fastDisplay} sub={state.fastStartTime ? 'Ventana: 16:8 · En curso' : 'Sin ayuno activo'} color={SS.orange} icon="⏱️" onClick={() => setSection('salud')}/>
        <StatCard label="Balance" value={`$${totalBalance.toLocaleString()}`} sub="+$1,430 este mes" color={SS.yellow} icon="💰" sparkData={balanceTrend} onClick={() => setSection('finanzas')}/>
        <StatCard label="Hábitos" value={`${habitPct}%`} sub={`${completedToday} completados hoy`} color={SS.purple} icon="🔥" onClick={() => setSection('habitos')}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
        <Card color={SS.cyan}>
          <CardTitle color={SS.cyan}>Proyectos Activos</CardTitle>
          {topProjects.map((p, i) => (
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
          ))}
          <button onClick={() => setSection('productividad')} style={{ marginTop:12, fontSize:10, color:SS.cyan, background:'transparent', border:'none', cursor:'pointer', padding:0, fontFamily:"'DM Sans',sans-serif", opacity:.7 }}>Ver todos los proyectos →</button>
        </Card>

        <Card color={SS.purple}>
          <CardTitle color={SS.purple}>Hoy — Rutina</CardTitle>
          {todayHabits.map((t, i) => (
            <div key={t.id} onClick={() => toggleHabit(t.id, TODAY_STR)} style={{ display:'flex', alignItems:'center', gap:10, marginBottom: i < todayHabits.length - 1 ? 9 : 0, cursor:'pointer' }}>
              <div style={{
                width:18, height:18, borderRadius:5,
                background: t.done ? t.color : 'transparent',
                border:`1.5px solid ${t.done ? t.color : 'rgba(255,255,255,0.2)'}`,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                boxShadow: t.done ? `0 0 8px ${t.color}80` : 'none', fontSize:10, color:SS.bg, fontWeight:700,
              }}>
                {t.done && '✓'}
              </div>
              <span style={{ fontSize:12, color: t.done ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)', fontWeight: t.done ? 500 : 400 }}>{t.name}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card color={SS.yellow}>
        <CardTitle color={SS.yellow}>Productividad de Hoy</CardTitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {[
            { label:'Horas Estudio', current: studyH || 3.5, goal:6, color:SS.yellow },
            { label:'Horas Trabajo',  current: workH  || 5.0, goal:8, color:SS.blue  },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:14 }}>
              <Donut pct={(item.current / item.goal) * 100} color={item.color} size={60} stroke={7} label={`${item.current}h`} sublabel={`/${item.goal}h`}/>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>{item.label}</div>
                <div style={{ fontSize:10, color:SS.dimText }}>{item.current}/{item.goal}h · {Math.round((item.current/item.goal)*100)}%</div>
                <button onClick={() => setSection('productividad')} style={{ marginTop:4, fontSize:9, color:item.color, background:'transparent', border:'none', cursor:'pointer', padding:0, fontFamily:"'DM Sans',sans-serif", opacity:.7 }}>Ver detalles →</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
