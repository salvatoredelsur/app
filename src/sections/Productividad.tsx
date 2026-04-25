import { useEffect, useState } from 'react';
import type { AppState, Project } from '../store/useStore';
import { useIsMobile } from '../hooks/useIsMobile';
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
  incrementPomodoro: () => void;
}

const WEEK_LABELS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

const SUBJECTS = [
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

export function Productividad({ state, addProject, updateProject, deleteProject, toggleStudyTimer, toggleWorkTimer, incrementPomodoro }: Props) {
  const mobile = useIsMobile();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState<{ name:string; cat:string; deadline:string; color:string }>({ name:'', cat:'', deadline:'', color: SS.cyan });
  const [editForm, setEditForm] = useState<{ pct:string; done:string; tasks:string }>({ pct:'', done:'', tasks:'' });
  const [studyElapsed, setStudyElapsed] = useState(0);
  const [workElapsed, setWorkElapsed] = useState(0);

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

  const TODAY = getDateStr(0);
  const studyMin = state.studySessions.filter(s => s.date === TODAY).reduce((a, b) => a + b.durationMin, 0)
    + (state.studyTimerStart ? Math.floor(studyElapsed / 60) : 0);
  const workMin  = state.workSessions.filter(s => s.date === TODAY).reduce((a, b) => a + b.durationMin, 0)
    + (state.workTimerStart ? Math.floor(workElapsed / 60) : 0);
  const studyH = +((studyMin || 210) / 60).toFixed(1);
  const workH  = +((workMin  || 300) / 60).toFixed(1);

  // Build weekly chart from real sessions
  const weekStudy = Array.from({ length: 7 }, (_, i) => {
    const date = getDateStr(6 - i);
    const mins = state.studySessions.filter(s => s.date === date).reduce((a, b) => a + b.durationMin, 0);
    return mins / 60 || (i === 4 ? 3.5 : i === 0 ? 4 : i === 1 ? 5 : i === 2 ? 3 : i === 3 ? 6 : i === 5 ? 2 : 1);
  });
  const weekWork = Array.from({ length: 7 }, (_, i) => {
    const date = getDateStr(6 - i);
    const mins = state.workSessions.filter(s => s.date === date).reduce((a, b) => a + b.durationMin, 0);
    return mins / 60 || (i === 0 ? 7 : i === 1 ? 8 : i === 2 ? 6 : i === 3 ? 8 : i === 4 ? 5 : i === 5 ? 3 : 0);
  });
  const maxHrs = Math.max(...weekStudy, ...weekWork, 1);

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addProject({ name: form.name, cat: form.cat || '🚀 Tech', pct:0, color: form.color, deadline: form.deadline || 'Sin fecha', tasks:0, done:0 });
    setShowModal(false);
    setForm({ name:'', cat:'', deadline:'', color: SS.cyan });
  };

  const rings = [
    { label:'Estudio Hoy',       current: studyH, goal:6,  color:SS.yellow, noUnit:false },
    { label:'Trabajo Hoy',       current: workH,  goal:8,  color:SS.blue,   noUnit:false },
    { label:'Pomodoros',         current: state.pomodoroCount, goal:10, color:SS.cyan, noUnit:true },
    { label:'Proyectos Act.',    current: state.projects.length, goal: Math.max(state.projects.length, 5), color:SS.green, noUnit:true },
  ];

  return (
    <div style={{ position:'relative' }}>
      <CircuitBg id="pr" opacity={0.05}/>
      <Blob color={SS.yellow} top={-40} left={-40}/>
      <SectionHdr title="Productividad" sub="Estudio, trabajo y proyectos" color={SS.yellow} action="+ Proyecto" onAction={() => setShowModal(true)}/>

      {/* 4 rings — 2×2 on mobile */}
      <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {rings.map((item, i) => (
          <Card key={i} color={item.color} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'16px 10px' }}>
            <Donut pct={Math.min((item.current / item.goal) * 100, 100)} color={item.color} size={72} stroke={8}
              label={item.noUnit ? `${item.current}` : `${item.current}h`}/>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.7)', letterSpacing:.3 }}>{item.label}</div>
              <div style={{ fontSize:9, color:SS.dimText }}>{item.current}/{item.goal}{item.noUnit ? '' : ' h'}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Session timers row — stack on mobile */}
      <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr', gap:12, marginBottom:20 }}>
        <Card color={SS.yellow} style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ flex:1 }}>
            <CardTitle color={SS.yellow}>Timer Estudio</CardTitle>
            <div style={{ fontSize:20, fontWeight:800, color:'white', fontVariantNumeric:'tabular-nums' }}>
              {state.studyTimerStart ? fmt(studyElapsed) : '00:00:00'}
            </div>
          </div>
          <button onClick={() => toggleStudyTimer('General')} style={timerBtnStyle(state.studyTimerStart, SS.yellow)}>
            {state.studyTimerStart ? '⏹ Stop' : '▶ Start'}
          </button>
        </Card>

        <Card color={SS.blue} style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ flex:1 }}>
            <CardTitle color={SS.blue}>Timer Trabajo</CardTitle>
            <div style={{ fontSize:20, fontWeight:800, color:'white', fontVariantNumeric:'tabular-nums' }}>
              {state.workTimerStart ? fmt(workElapsed) : '00:00:00'}
            </div>
          </div>
          <button onClick={() => toggleWorkTimer('General')} style={timerBtnStyle(state.workTimerStart, SS.blue)}>
            {state.workTimerStart ? '⏹ Stop' : '▶ Start'}
          </button>
        </Card>

        <Card color={SS.cyan} style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ flex:1 }}>
            <CardTitle color={SS.cyan}>Pomodoros Hoy</CardTitle>
            <div style={{ fontSize:28, fontWeight:900, color:SS.cyan, textShadow:`0 0 18px ${SS.cyan}80` }}>
              {state.pomodoroCount}<span style={{ fontSize:13, fontWeight:500, color:SS.dimText }}>/10</span>
            </div>
          </div>
          <button onClick={incrementPomodoro} style={{ padding:'8px 14px', borderRadius:10, border:`1px solid ${SS.cyan}50`, background:`${SS.cyan}22`, color:SS.cyan, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap' }}>
            + 1 🍅
          </button>
        </Card>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap:14, marginBottom:20 }}>
        {/* Weekly chart from real data */}
        <Card color={SS.yellow}>
          <CardTitle color={SS.yellow}>Horas Semanales</CardTitle>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80, marginBottom:4 }}>
            {WEEK_LABELS.map((d, i) => (
              <div key={d} style={{ flex:1, display:'flex', flexDirection:'column', gap:1, alignItems:'stretch' }}>
                <div style={{ background:SS.blue, borderRadius:'3px 3px 0 0', height:`${(weekWork[i]/maxHrs)*64}px`, boxShadow:`0 0 5px ${SS.blue}55`, minHeight:2 }}/>
                <div style={{ background:SS.yellow, borderRadius:'0 0 3px 3px', height:`${(weekStudy[i]/maxHrs)*64}px`, boxShadow:`0 0 5px ${SS.yellow}55`, minHeight:2 }}/>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {WEEK_LABELS.map(d => <span key={d} style={{ flex:1, textAlign:'center', fontSize:8, color:SS.mutedText }}>{d}</span>)}
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

        {/* Subjects */}
        <Card color={SS.cyan}>
          <CardTitle color={SS.cyan}>Materias — Este Mes</CardTitle>
          {SUBJECTS.map((s, i) => (
            <div key={i} style={{ marginBottom: i < SUBJECTS.length - 1 ? 10 : 0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.8)', fontWeight:500 }}>{s.name}</span>
                <span style={{ fontSize:11, color:s.color, fontWeight:700 }}>{s.hrs}h</span>
              </div>
              <Bar pct={(s.hrs/15)*100} color={s.color} height={4}/>
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
                value={editForm[f.key]} onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
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
