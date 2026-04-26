import { useEffect, useState } from 'react';
import type { AppState, Project } from '../store/useStore';
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
  addProject: (p: Omit<Project, 'id'>) => void;
  updateProject: (id: number, patch: Partial<Omit<Project, 'id'>>) => void;
  deleteProject: (id: number) => void;
  toggleStudyTimer: (subject?: string) => void;
  toggleWorkTimer: (project?: string) => void;
  addStudySession: (subject: string, durationMin: number) => void;
  addWorkSession: (project: string, durationMin: number) => void;
  incrementPomodoro: () => void;
  resetPomodoro: () => void;
  togglePomodoro: () => void;
  advancePomodoro: (phase: 'work' | 'break') => void;
}


const SUBJECT_COLORS = [SS.cyan, SS.blue, SS.yellow, SS.green, SS.orange, SS.pink, SS.purple];
const DEFAULT_SUBJECTS = [
  { name:'Inteligencia Artificial', hrs:12.5, color:SS.cyan },
  { name:'Programación Web',        hrs:8.0,  color:SS.blue },
  { name:'Inglés',                  hrs:5.5,  color:SS.yellow },
  { name:'Finanzas Personales',     hrs:3.0,  color:SS.green },
];

function fmt(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function getDateStr(daysAgo: number) {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

const POMODORO_WORK_MIN  = 25;
const POMODORO_BREAK_MIN = 5;

export function Productividad({ state, addProject, updateProject, deleteProject, toggleStudyTimer, toggleWorkTimer, addStudySession, addWorkSession, incrementPomodoro, resetPomodoro, togglePomodoro, advancePomodoro }: Props) {
  const mobile = useIsMobile();
  const [showModal, setShowModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState<{ name:string; cat:string; deadline:string; color:string }>({ name:'', cat:'', deadline:'', color: SS.cyan });
  const [editForm, setEditForm] = useState<{ pct:string; done:string; tasks:string }>({ pct:'', done:'', tasks:'' });
  const [sessionForm, setSessionForm] = useState<{ type:'study'|'work'; subject:string; hours:string; minutes:string }>({ type:'study', subject:'', hours:'', minutes:'' });
  const [studyElapsed, setStudyElapsed] = useState(0);
  const [workElapsed, setWorkElapsed] = useState(0);
  const [studyInput, setStudyInput] = useState('');
  const [workInput, setWorkInput] = useState('');
  const [pomodoroSecs, setPomodoroSecs] = useState(0);
  useEscapeKey(() => { setShowModal(false); setEditingProject(null); setShowSessionModal(false); }, showModal || !!editingProject || showSessionModal);

  useEffect(() => {
    if (!state.studyTimerStart) { setStudyElapsed(0); return; }
    const tick = () => setStudyElapsed(Math.floor((Date.now() - new Date(state.studyTimerStart!).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.studyTimerStart]);

  useEffect(() => {
    if (!state.workTimerStart) { setWorkElapsed(0); return; }
    const tick = () => setWorkElapsed(Math.floor((Date.now() - new Date(state.workTimerStart!).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.workTimerStart]);

  useEffect(() => {
    if (!state.pomodoroTimerStart) { setPomodoroSecs(0); return; }
    const goalSecs = (state.pomodoroPhase === 'work' ? POMODORO_WORK_MIN : POMODORO_BREAK_MIN) * 60;
    const elapsed0 = Math.floor((Date.now() - new Date(state.pomodoroTimerStart).getTime()) / 1000);
    const remaining0 = Math.max(0, goalSecs - elapsed0);
    setPomodoroSecs(remaining0);
    // Update display every second
    const ivId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(state.pomodoroTimerStart!).getTime()) / 1000);
      setPomodoroSecs(Math.max(0, goalSecs - elapsed));
    }, 1000);
    // Advance exactly once when the phase ends
    const toId = setTimeout(() => {
      clearInterval(ivId);
      advancePomodoro(state.pomodoroPhase);
    }, remaining0 * 1000);
    return () => { clearInterval(ivId); clearTimeout(toId); };
  }, [state.pomodoroTimerStart, state.pomodoroPhase, advancePomodoro]);

  const TODAY = getDateStr(0);
  const studyMin = state.studySessions.filter(s => s.date === TODAY).reduce((a, b) => a + b.durationMin, 0)
    + (state.studyTimerStart ? Math.floor(studyElapsed / 60) : 0);
  const workMin  = state.workSessions.filter(s => s.date === TODAY).reduce((a, b) => a + b.durationMin, 0)
    + (state.workTimerStart ? Math.floor(workElapsed / 60) : 0);
  const studyH = +(studyMin / 60).toFixed(1);
  const workH  = +(workMin  / 60).toFixed(1);

  // Build weekly chart from real sessions; today (i=6) adds the live timer if running
  const weekStudy = Array.from({ length: 7 }, (_, i) => {
    const date = getDateStr(6 - i);
    const base = state.studySessions.filter(s => s.date === date).reduce((a, b) => a + b.durationMin, 0) / 60;
    return i === 6 && state.studyTimerStart ? base + studyElapsed / 3600 : base;
  });
  const weekWork = Array.from({ length: 7 }, (_, i) => {
    const date = getDateStr(6 - i);
    const base = state.workSessions.filter(s => s.date === date).reduce((a, b) => a + b.durationMin, 0) / 60;
    return i === 6 && state.workTimerStart ? base + workElapsed / 3600 : base;
  });
  const maxHrs = Math.max(...weekStudy, ...weekWork, 1);

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addProject({ name: form.name, cat: form.cat || '🚀 Tech', pct:0, color: form.color, deadline: form.deadline || 'Sin fecha', tasks:0, done:0 });
    setShowModal(false);
    setForm({ name:'', cat:'', deadline:'', color: SS.cyan });
  };

  const handleAddSession = () => {
    const h = parseInt(sessionForm.hours) || 0;
    const m = parseInt(sessionForm.minutes) || 0;
    const total = h * 60 + m;
    if (total <= 0) return;
    const label = sessionForm.subject.trim() || (sessionForm.type === 'study' ? 'General' : 'General');
    if (sessionForm.type === 'study') addStudySession(label, total);
    else addWorkSession(label, total);
    setShowSessionModal(false);
    setSessionForm({ type:'study', subject:'', hours:'', minutes:'' });
  };

  const MONTH_STR = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const monthStudyH = +(state.studySessions.filter(s => s.date.startsWith(MONTH_STR)).reduce((a, b) => a + b.durationMin, 0) / 60).toFixed(1);
  const monthWorkH  = +(state.workSessions.filter(s => s.date.startsWith(MONTH_STR)).reduce((a, b) => a + b.durationMin, 0) / 60).toFixed(1);

  // Compute subjects from real study sessions (all time), fallback to defaults
  const computedSubjects = (() => {
    const bySubject: Record<string, number> = {};
    for (const s of state.studySessions) {
      bySubject[s.subject] = (bySubject[s.subject] ?? 0) + s.durationMin;
    }
    const entries = Object.entries(bySubject).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (entries.length === 0) return DEFAULT_SUBJECTS;
    return entries.map(([name, mins], i) => ({ name, hrs: +(mins / 60).toFixed(1), color: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }));
  })();
  const maxSubjectHrs = Math.max(...computedSubjects.map(s => s.hrs), 1);

  const avgProjectPct = state.projects.length > 0
    ? Math.round(state.projects.reduce((s, p) => s + p.pct, 0) / state.projects.length)
    : 0;

  const rings = [
    { label:'Estudio Hoy',   current: studyH,               goal:6,   color:SS.yellow, unit:'h' },
    { label:'Trabajo Hoy',   current: workH,                goal:8,   color:SS.blue,   unit:'h' },
    { label:'Pomodoros',     current: state.pomodoroCount,  goal:10,  color:SS.cyan,   unit:''  },
    { label:'Proy. promedio',current: avgProjectPct,        goal:100, color:SS.green,  unit:'%' },
  ];

  return (
    <div style={{ position:'relative' }}>
      <CircuitBg id="pr" opacity={0.05}/>
      <Blob color={SS.yellow} top={-40} left={-40}/>
      <SectionHdr title="Productividad" sub={`Este mes: ${monthStudyH}h estudio · ${monthWorkH}h trabajo`} color={SS.yellow} action="+ Proyecto" onAction={() => setShowModal(true)}/>
      <div style={{ display:'flex', gap:8, marginBottom:16, marginTop:-10 }}>
        <button onClick={() => { setSessionForm(p => ({ ...p, type:'study' })); setShowSessionModal(true); }}
          style={{ fontSize:10, color:SS.yellow, background:`${SS.yellow}12`, border:`1px solid ${SS.yellow}30`, borderRadius:14, padding:'4px 12px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>+ Sesión estudio</button>
        <button onClick={() => { setSessionForm(p => ({ ...p, type:'work' })); setShowSessionModal(true); }}
          style={{ fontSize:10, color:SS.blue, background:`${SS.blue}12`, border:`1px solid ${SS.blue}30`, borderRadius:14, padding:'4px 12px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>+ Sesión trabajo</button>
      </div>

      {/* 4 rings — 2×2 on mobile */}
      <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {rings.map((item, i) => (
          <Card key={i} color={item.color} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'16px 10px' }}>
            <Donut pct={Math.min((item.current / item.goal) * 100, 100)} color={item.color} size={72} stroke={8}
              label={`${item.current}${item.unit}`}/>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.7)', letterSpacing:.3 }}>{item.label}</div>
              <div style={{ fontSize:9, color:SS.dimText }}>{item.current}/{item.goal}{item.unit ? item.unit : ''}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Session timers row — stack on mobile */}
      <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr', gap:12, marginBottom:20 }}>
        <Card color={SS.yellow} style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <CardTitle color={SS.yellow}>Timer Estudio</CardTitle>
              {state.studyTimerStart && <div style={{ width:7, height:7, borderRadius:'50%', background:SS.green, boxShadow:`0 0 6px ${SS.green}`, animation:'pulse-dot 1.5s ease-in-out infinite', flexShrink:0 }}/>}
            </div>
            {state.studyTimerStart ? (
              <>
                <div style={{ fontSize:20, fontWeight:800, color:'white', fontVariantNumeric:'tabular-nums' }}>{fmt(studyElapsed)}</div>
                {state.studyTimerSubject && <div style={{ fontSize:10, color:SS.yellow, marginTop:1 }}>{state.studyTimerSubject}</div>}
              </>
            ) : (
              <>
                <div style={{ fontSize:20, fontWeight:800, color:'rgba(255,255,255,0.2)', fontVariantNumeric:'tabular-nums' }}>00:00:00</div>
                <input value={studyInput} onChange={e => setStudyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !state.studyTimerStart && toggleStudyTimer(studyInput.trim() || 'General')}
                  placeholder="Materia / tema…" style={{ marginTop:4, width:'100%', background:'transparent', border:'none', borderBottom:`1px solid ${SS.yellow}40`, color:'rgba(255,255,255,0.6)', fontSize:10, fontFamily:"'DM Sans',sans-serif", outline:'none', padding:'2px 0' }}/>
              </>
            )}
          </div>
          <button onClick={() => { toggleStudyTimer(studyInput.trim() || 'General'); if (!state.studyTimerStart) setStudyInput(''); }} style={timerBtnStyle(state.studyTimerStart, SS.yellow)}>
            {state.studyTimerStart ? '⏹ Stop' : '▶ Start'}
          </button>
        </Card>

        <Card color={SS.blue} style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <CardTitle color={SS.blue}>Timer Trabajo</CardTitle>
              {state.workTimerStart && <div style={{ width:7, height:7, borderRadius:'50%', background:SS.green, boxShadow:`0 0 6px ${SS.green}`, animation:'pulse-dot 1.5s ease-in-out infinite', flexShrink:0 }}/>}
            </div>
            {state.workTimerStart ? (
              <>
                <div style={{ fontSize:20, fontWeight:800, color:'white', fontVariantNumeric:'tabular-nums' }}>{fmt(workElapsed)}</div>
                {state.workTimerSubject && <div style={{ fontSize:10, color:SS.blue, marginTop:1 }}>{state.workTimerSubject}</div>}
              </>
            ) : (
              <>
                <div style={{ fontSize:20, fontWeight:800, color:'rgba(255,255,255,0.2)', fontVariantNumeric:'tabular-nums' }}>00:00:00</div>
                <input value={workInput} onChange={e => setWorkInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !state.workTimerStart && toggleWorkTimer(workInput.trim() || 'General')}
                  placeholder="Proyecto / tarea…" style={{ marginTop:4, width:'100%', background:'transparent', border:'none', borderBottom:`1px solid ${SS.blue}40`, color:'rgba(255,255,255,0.6)', fontSize:10, fontFamily:"'DM Sans',sans-serif", outline:'none', padding:'2px 0' }}/>
              </>
            )}
          </div>
          <button onClick={() => { toggleWorkTimer(workInput.trim() || 'General'); if (!state.workTimerStart) setWorkInput(''); }} style={timerBtnStyle(state.workTimerStart, SS.blue)}>
            {state.workTimerStart ? '⏹ Stop' : '▶ Start'}
          </button>
        </Card>

        <Card color={SS.cyan} style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <CardTitle color={SS.cyan}>Pomodoros Hoy</CardTitle>
              {state.pomodoroTimerStart && <div style={{ width:7, height:7, borderRadius:'50%', background: state.pomodoroPhase === 'work' ? SS.red : SS.green, boxShadow:`0 0 6px ${state.pomodoroPhase === 'work' ? SS.red : SS.green}`, animation:'pulse-dot 1.5s ease-in-out infinite', flexShrink:0 }}/>}
            </div>
            {state.pomodoroTimerStart ? (
              <>
                <div style={{ fontSize:22, fontWeight:800, color:'white', fontVariantNumeric:'tabular-nums' }}>
                  {String(Math.floor(pomodoroSecs / 60)).padStart(2,'0')}:{String(pomodoroSecs % 60).padStart(2,'0')}
                </div>
                <div style={{ fontSize:9, color: state.pomodoroPhase === 'work' ? SS.red : SS.green, marginTop:1, fontWeight:600 }}>
                  {state.pomodoroPhase === 'work' ? `🍅 Trabajo · ${POMODORO_WORK_MIN}min` : `☕ Descanso · ${POMODORO_BREAK_MIN}min`}
                </div>
              </>
            ) : (
              <div style={{ fontSize:28, fontWeight:900, color:SS.cyan, textShadow:`0 0 18px ${SS.cyan}80` }}>
                {state.pomodoroCount}<span style={{ fontSize:13, fontWeight:500, color:SS.dimText }}>/10</span>
              </div>
            )}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
            <button onClick={togglePomodoro} style={{ padding:'8px 14px', borderRadius:10, border:`1px solid ${state.pomodoroTimerStart ? SS.red : SS.cyan}50`, background: state.pomodoroTimerStart ? `${SS.red}22` : `${SS.cyan}22`, color: state.pomodoroTimerStart ? SS.red : SS.cyan, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap' }}>
              {state.pomodoroTimerStart ? '⏹ Stop' : '▶ Start'}
            </button>
            {!state.pomodoroTimerStart && (
              <button onClick={incrementPomodoro} style={{ padding:'4px 10px', borderRadius:8, border:`1px solid ${SS.cyan}30`, background:'transparent', color:SS.cyan, fontSize:10, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>+1 🍅</button>
            )}
            <button onClick={resetPomodoro} style={{ padding:'3px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'rgba(255,255,255,0.25)', fontSize:9, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}
              onMouseEnter={e => (e.currentTarget.style.color = SS.red)}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}>↺ reset</button>
          </div>
        </Card>
      </div>

      {/* Today's sessions log */}
      {(state.studySessions.some(s => s.date === TODAY) || state.workSessions.some(s => s.date === TODAY)) && (
        <Card color={SS.purple} style={{ marginBottom:20 }}>
          <CardTitle color={SS.purple}>Sesiones de Hoy</CardTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {[
              ...state.studySessions.filter(s => s.date === TODAY).map(s => ({ label: s.subject, min: s.durationMin, color: SS.yellow })),
              ...state.workSessions.filter(s => s.date === TODAY).map(s => ({ label: s.project, min: s.durationMin, color: SS.blue })),
            ].sort((a, b) => b.min - a.min).map((s, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width:6, height:6, borderRadius:2, background:s.color, flexShrink:0 }}/>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.7)', flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.label}</span>
                <span style={{ fontSize:10, fontWeight:700, color:s.color, flexShrink:0 }}>{s.min >= 60 ? `${(s.min/60).toFixed(1)}h` : `${s.min}min`}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap:14, marginBottom:20 }}>
        {/* Weekly chart from real data */}
        <Card color={SS.yellow}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <CardTitle color={SS.yellow}>Horas Semanales</CardTitle>
            <div style={{ display:'flex', gap:12 }}>
              <span style={{ fontSize:10, color:SS.yellow, fontWeight:700 }}>{weekStudy.reduce((a,b)=>a+b,0).toFixed(1)}h est.</span>
              <span style={{ fontSize:10, color:SS.blue,   fontWeight:700 }}>{weekWork.reduce((a,b)=>a+b,0).toFixed(1)}h trab.</span>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80, marginBottom:4 }}>
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', gap:1, alignItems:'stretch', opacity: i === 6 ? 1 : 0.8 }}>
                <div style={{ background:SS.blue, borderRadius:'3px 3px 0 0', height:`${(weekWork[i]/maxHrs)*64}px`, boxShadow:`0 0 5px ${SS.blue}55`, minHeight:2 }}/>
                <div style={{ background:SS.yellow, borderRadius:'0 0 3px 3px', height:`${(weekStudy[i]/maxHrs)*64}px`, boxShadow:`0 0 5px ${SS.yellow}55`, minHeight:2 }}/>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date(); d.setDate(d.getDate() - (6 - i));
              const label = d.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.','').slice(0,3);
              return <span key={i} style={{ flex:1, textAlign:'center', fontSize:8, color: i === 6 ? SS.yellow : SS.mutedText, fontWeight: i === 6 ? 700 : 400 }}>{label}</span>;
            })}
          </div>
          <div style={{ display:'flex', gap:16, marginTop:8 }}>
            {[{c:SS.yellow,l:'Estudio'},{c:SS.blue,l:'Trabajo'}].map((x, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:x.c }}/>
                <span style={{ fontSize:9, color:SS.dimText }}>{x.l}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Subjects computed from real sessions */}
        <Card color={SS.cyan}>
          <CardTitle color={SS.cyan}>Materias — Total acumulado</CardTitle>
          {computedSubjects.map((s, i) => (
            <div key={i} style={{ marginBottom: i < computedSubjects.length - 1 ? 10 : 0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.8)', fontWeight:500 }}>{s.name}</span>
                <span style={{ fontSize:11, color:s.color, fontWeight:700 }}>{s.hrs}h</span>
              </div>
              <Bar pct={(s.hrs/maxSubjectHrs)*100} color={s.color} height={4}/>
            </div>
          ))}
        </Card>
      </div>

      {/* Projects list */}
      <Card color={SS.cyan}>
        <CardTitle color={SS.cyan}>Proyectos en Seguimiento</CardTitle>
        {state.projects.length === 0 && <div style={{ fontSize:11, color:SS.dimText }}>Sin proyectos. Crea uno con + Proyecto.</div>}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {state.projects.map((p) => (
            <div key={p.id} style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, padding:'10px 12px', background:SS.card2, borderRadius:12, border:`1px solid ${p.color}18` }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:p.color, boxShadow:`0 0 6px ${p.color}`, flexShrink:0 }}/>
                  <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.9)' }}>{p.name}</span>
                  <span style={{ fontSize:9, color:SS.dimText, background:'rgba(255,255,255,0.05)', padding:'1px 7px', borderRadius:10, whiteSpace:'nowrap' }}>{p.cat}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <Bar pct={p.pct} color={p.color} height={4} style={{ flex:1 }}/>
                  <span style={{ fontSize:10, color:p.color, fontWeight:700, minWidth:30 }}>{p.pct}%</span>
                  <span style={{ fontSize:9, color:SS.dimText }}>{p.done}/{p.tasks} tareas</span>
                  <span style={{ fontSize:9, color:SS.dimText }}>· {p.deadline}</span>
                </div>
              </div>
              <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                <button onClick={() => { setEditingProject(p); setEditForm({ pct: String(p.pct), done: String(p.done), tasks: String(p.tasks) }); }}
                  style={{ background:`${p.color}18`, border:`1px solid ${p.color}40`, borderRadius:7, cursor:'pointer', color:p.color, fontSize:11, padding:'4px 8px', fontFamily:"'DM Sans',sans-serif" }}>✏</button>
                <button onClick={() => deleteProject(p.id)}
                  style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:7, cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:11, padding:'4px 8px', fontFamily:"'DM Sans',sans-serif", transition:'color .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = SS.red)}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Edit project modal */}
      {editingProject && (
        <Modal title={`Editar: ${editingProject.name}`} color={editingProject.color} onClose={() => setEditingProject(null)}>
          {[
            { label:'Progreso (%)', key:'pct' as const, max:100 },
            { label:'Tareas completadas', key:'done' as const },
            { label:'Total de tareas', key:'tasks' as const },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:10 }}>
              <label style={labelStyle}>{f.label}</label>
              <input type="number" min="0" max={f.max}
                value={editForm[f.key]}
                onChange={e => {
                  const next = { ...editForm, [f.key]: e.target.value };
                  if (f.key === 'done' || f.key === 'tasks') {
                    const d = parseInt(f.key === 'done' ? e.target.value : editForm.done) || 0;
                    const t = parseInt(f.key === 'tasks' ? e.target.value : editForm.tasks) || 0;
                    if (t > 0) next.pct = String(Math.min(100, Math.round((d / t) * 100)));
                  }
                  setEditForm(next);
                }}
                style={inputStyle(editingProject.color)}/>
            </div>
          ))}
          <button onClick={() => {
            updateProject(editingProject.id, {
              pct:   Math.min(100, Math.max(0, parseInt(editForm.pct)   || 0)),
              done:  Math.max(0, parseInt(editForm.done)  || 0),
              tasks: Math.max(0, parseInt(editForm.tasks) || 0),
            });
            setEditingProject(null);
          }} style={{ width:'100%', padding:'10px', background:editingProject.color, color:'#060c18', border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Guardar</button>
        </Modal>
      )}

      {/* New project modal */}
      {showModal && (
        <Modal title="Nuevo Proyecto" color={SS.yellow} onClose={() => setShowModal(false)}>
          {[
            { label:'Nombre', key:'name' as const, placeholder:'App SS...' },
            { label:'Categoría', key:'cat' as const, placeholder:'🚀 Tech' },
            { label:'Fecha límite', key:'deadline' as const, placeholder:'15 May 2026' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:10 }}>
              <label style={labelStyle}>{f.label}</label>
              <input value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder={f.placeholder} style={inputStyle(SS.yellow)}/>
            </div>
          ))}
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Color</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[SS.cyan,SS.yellow,SS.green,SS.pink,SS.blue,SS.orange,SS.purple,SS.red].map(c => (
                <div key={c} onClick={() => setForm(prev => ({ ...prev, color: c }))}
                  style={{ width:22, height:22, borderRadius:6, background:c, cursor:'pointer', border: form.color === c ? `2px solid white` : `2px solid transparent`, boxShadow: form.color === c ? `0 0 8px ${c}` : 'none' }}/>
              ))}
            </div>
          </div>
          <button onClick={handleAdd} style={{ width:'100%', padding:'10px', background:SS.yellow, color:'#060c18', border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Crear Proyecto</button>
        </Modal>
      )}

      {/* Manual session modal */}
      {showSessionModal && (
        <Modal title={sessionForm.type === 'study' ? 'Registrar Sesión de Estudio' : 'Registrar Sesión de Trabajo'} color={sessionForm.type === 'study' ? SS.yellow : SS.blue} onClose={() => setShowSessionModal(false)}>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            {(['study','work'] as const).map(t => (
              <button key={t} onClick={() => setSessionForm(p => ({ ...p, type: t }))}
                style={{ flex:1, padding:'7px', borderRadius:8, border:`1px solid ${sessionForm.type===t?(t==='study'?SS.yellow:SS.blue):'rgba(255,255,255,0.1)'}`, background: sessionForm.type===t?(t==='study'?`${SS.yellow}20`:`${SS.blue}20`):'transparent', color: sessionForm.type===t?(t==='study'?SS.yellow:SS.blue):'rgba(255,255,255,0.4)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                {t === 'study' ? '📚 Estudio' : '💼 Trabajo'}
              </button>
            ))}
          </div>
          <label style={labelStyle}>{sessionForm.type === 'study' ? 'Materia / Tema' : 'Proyecto'}</label>
          <input value={sessionForm.subject} onChange={e => setSessionForm(p => ({ ...p, subject: e.target.value }))}
            placeholder={sessionForm.type === 'study' ? 'Inteligencia Artificial…' : 'App SS Personal…'}
            autoFocus style={inputStyle(sessionForm.type === 'study' ? SS.yellow : SS.blue)}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
            <div>
              <label style={labelStyle}>Horas</label>
              <input type="number" min="0" max="23" value={sessionForm.hours} onChange={e => setSessionForm(p => ({ ...p, hours: e.target.value }))} placeholder="0" style={inputStyle(sessionForm.type === 'study' ? SS.yellow : SS.blue)}/>
            </div>
            <div>
              <label style={labelStyle}>Minutos</label>
              <input type="number" min="0" max="59" value={sessionForm.minutes} onChange={e => setSessionForm(p => ({ ...p, minutes: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleAddSession()} placeholder="30" style={inputStyle(sessionForm.type === 'study' ? SS.yellow : SS.blue)}/>
            </div>
          </div>
          <button onClick={handleAddSession} style={{ width:'100%', padding:'10px', background: sessionForm.type === 'study' ? SS.yellow : SS.blue, color:'#060c18', border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Registrar Sesión</button>
        </Modal>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize:11, color:'rgba(255,255,255,0.45)', display:'block', marginBottom:4 };
const inputStyle = (color: string): React.CSSProperties => ({
  width:'100%', background:'#0f2038', border:`1px solid ${color}40`, borderRadius:8,
  padding:'8px 12px', color:'white', fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none',
});

function timerBtnStyle(active: string | null, color: string): React.CSSProperties {
  return { padding:'8px 14px', borderRadius:10, border:`1px solid ${active ? SS.red : color}50`, background: active ? `${SS.red}22` : `${color}22`, color: active ? SS.red : color, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap' };
}


function Modal({ title, color, onClose, children }: { title:string; color:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={onClose}>
      <div style={{ background:'#0c1828', borderRadius:16, padding:24, minWidth:300, maxWidth:400, width:'90%', border:`1px solid ${color}30` }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:14, fontWeight:700, color:'white', marginBottom:16 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}
