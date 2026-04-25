import { useEffect, useState } from 'react';
import type { AppState, Project } from '../store/useStore';
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

const TODAY_STR = new Date().toISOString().slice(0, 10);
const WEEK_DAYS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const STUDY_HRS_DEMO = [4,5,3,6,3.5,2,1];
const WORK_HRS_DEMO  = [7,8,6,8,5,3,0];

const SUBJECTS = [
  { name:'Inteligencia Artificial', hrs:12.5, color:SS.cyan },
  { name:'Programación Web',        hrs:8.0,  color:SS.blue },
  { name:'Inglés',                  hrs:5.5,  color:SS.yellow },
  { name:'Finanzas Personales',     hrs:3.0,  color:SS.green },
];

const MAX_HRS = Math.max(...STUDY_HRS_DEMO, ...WORK_HRS_DEMO);

function fmt(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export function Productividad({ state, addProject, updateProject, deleteProject, toggleStudyTimer, toggleWorkTimer, incrementPomodoro }: Props) {
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

  const studyMin = state.studySessions.filter(s => s.date === TODAY_STR).reduce((a, b) => a + b.durationMin, 0)
    + (state.studyTimerStart ? Math.floor(studyElapsed / 60) : 0);
  const workMin  = state.workSessions.filter(s => s.date === TODAY_STR).reduce((a, b) => a + b.durationMin, 0)
    + (state.workTimerStart ? Math.floor(workElapsed / 60) : 0);
  const studyH = +((studyMin || 210) / 60).toFixed(1);
  const workH  = +((workMin  || 300) / 60).toFixed(1);

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addProject({ name: form.name, cat: form.cat || '🚀 Tech', pct:0, color: form.color, deadline: form.deadline || 'Sin fecha', tasks:0, done:0 });
    setShowModal(false);
    setForm({ name:'', cat:'', deadline:'', color: SS.cyan });
  };

  const rings = [
    { label:'Estudio Hoy',       current: studyH, goal:6,  color:SS.yellow, noUnit:false },
    { label:'Trabajo Hoy',       current: workH,  goal:8,  color:SS.blue,   noUnit:false },
    { label:'Focus (Pomodoros)', current: state.pomodoroCount, goal:10, color:SS.cyan, noUnit:true },
    { label:'Proyectos Act.',    current: state.projects.length, goal: Math.max(state.projects.length, 5), color:SS.green, noUnit:true },
  ];

  return (
    <div style={{ position:'relative' }}>
      <CircuitBg id="pr" opacity={0.05}/>
      <Blob color={SS.yellow} top={-40} left={-40}/>
      <SectionHdr title="Productividad" sub="Estudio, trabajo y proyectos" color={SS.yellow} action="+ Proyecto" onAction={() => setShowModal(true)}/>

      {/* Today rings */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
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

      {/* Session timers row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
        {/* Study timer */}
        <Card color={SS.yellow} style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ flex:1 }}>
            <CardTitle color={SS.yellow}>Timer Estudio</CardTitle>
            <div style={{ fontSize:20, fontWeight:800, color:'white', fontVariantNumeric:'tabular-nums' }}>
              {state.studyTimerStart ? fmt(studyElapsed) : '00:00:00'}
            </div>
          </div>
          <button onClick={() => toggleStudyTimer('General')} style={{
            padding:'8px 14px', borderRadius:10, border:`1px solid ${state.studyTimerStart ? SS.red : SS.yellow}50`,
            background: state.studyTimerStart ? `${SS.red}22` : `${SS.yellow}22`,
            color: state.studyTimerStart ? SS.red : SS.yellow,
            fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap',
          }}>
            {state.studyTimerStart ? '⏹ Stop' : '▶ Start'}
          </button>
        </Card>

        {/* Work timer */}
        <Card color={SS.blue} style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ flex:1 }}>
            <CardTitle color={SS.blue}>Timer Trabajo</CardTitle>
            <div style={{ fontSize:20, fontWeight:800, color:'white', fontVariantNumeric:'tabular-nums' }}>
              {state.workTimerStart ? fmt(workElapsed) : '00:00:00'}
            </div>
          </div>
          <button onClick={() => toggleWorkTimer('General')} style={{
            padding:'8px 14px', borderRadius:10, border:`1px solid ${state.workTimerStart ? SS.red : SS.blue}50`,
            background: state.workTimerStart ? `${SS.red}22` : `${SS.blue}22`,
            color: state.workTimerStart ? SS.red : SS.blue,
            fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap',
          }}>
            {state.workTimerStart ? '⏹ Stop' : '▶ Start'}
          </button>
        </Card>

        {/* Pomodoro */}
        <Card color={SS.cyan} style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ flex:1 }}>
            <CardTitle color={SS.cyan}>Pomodoros Hoy</CardTitle>
            <div style={{ fontSize:28, fontWeight:900, color:SS.cyan, textShadow:`0 0 18px ${SS.cyan}80` }}>
              {state.pomodoroCount}<span style={{ fontSize:13, fontWeight:500, color:SS.dimText }}>/10</span>
            </div>
          </div>
          <button onClick={incrementPomodoro} style={{
            padding:'8px 14px', borderRadius:10, border:`1px solid ${SS.cyan}50`,
            background:`${SS.cyan}22`, color:SS.cyan,
            fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap',
          }}>
            + 1 🍅
          </button>
        </Card>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        {/* Weekly chart */}
        <Card color={SS.yellow}>
          <CardTitle color={SS.yellow}>Horas Semanales</CardTitle>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80, marginBottom:4 }}>
            {WEEK_DAYS.map((d, i) => (
              <div key={d} style={{ flex:1, display:'flex', flexDirection:'column', gap:1, alignItems:'stretch' }}>
                <div style={{ background:SS.blue, borderRadius:'3px 3px 0 0', height:`${(WORK_HRS_DEMO[i]/MAX_HRS)*64}px`, boxShadow:`0 0 5px ${SS.blue}55` }}/>
                <div style={{ background:SS.yellow, borderRadius:'0 0 3px 3px', height:`${(STUDY_HRS_DEMO[i]/MAX_HRS)*64}px`, boxShadow:`0 0 5px ${SS.yellow}55` }}/>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {WEEK_DAYS.map(d => <span key={d} style={{ flex:1, textAlign:'center', fontSize:8, color:SS.mutedText }}>{d}</span>)}
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
            <div key={p.id} style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:10, alignItems:'center', padding:'10px 12px', background:SS.card2, borderRadius:12, border:`1px solid ${p.color}18` }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:p.color, boxShadow:`0 0 6px ${p.color}` }}/>
                  <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.9)' }}>{p.name}</span>
                  <span style={{ fontSize:9, color:SS.dimText, background:'rgba(255,255,255,0.05)', padding:'1px 7px', borderRadius:10 }}>{p.cat}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <Bar pct={p.pct} color={p.color} height={4} style={{ flex:1 }}/>
                  <span style={{ fontSize:10, color:p.color, fontWeight:700, minWidth:30 }}>{p.pct}%</span>
                </div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.6)' }}>{p.done}/{p.tasks}</div>
                <div style={{ fontSize:8, color:SS.dimText }}>tareas</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:9, color:SS.dimText }}>vence</div>
                <div style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.6)' }}>{p.deadline}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <button onClick={() => { setEditingProject(p); setEditForm({ pct: String(p.pct), done: String(p.done), tasks: String(p.tasks) }); }} style={{ background:'transparent', border:`1px solid ${p.color}40`, borderRadius:6, cursor:'pointer', color:p.color, fontSize:10, padding:'2px 7px', fontFamily:"'DM Sans',sans-serif" }}>✏️</button>
                <button onClick={() => deleteProject(p.id)} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:10, padding:'2px 7px', fontFamily:"'DM Sans',sans-serif" }}
                  onMouseEnter={e => (e.currentTarget.style.color = SS.red)}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Edit project modal */}
      {editingProject && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setEditingProject(null)}>
          <div style={{ background:'#0c1828', borderRadius:16, padding:24, minWidth:300, border:`1px solid ${editingProject.color}30` }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:14, fontWeight:700, color:'white', marginBottom:4 }}>Editar Proyecto</div>
            <div style={{ fontSize:11, color:SS.dimText, marginBottom:16 }}>{editingProject.name}</div>
            {[
              { label:'Progreso (%)', key:'pct' as const, placeholder:'68' },
              { label:'Tareas completadas', key:'done' as const, placeholder:'8' },
              { label:'Total de tareas', key:'tasks' as const, placeholder:'12' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:10 }}>
                <label style={{ fontSize:11, color:SS.dimText, display:'block', marginBottom:4 }}>{f.label}</label>
                <input
                  type="number" min="0" max={f.key==='pct'?100:undefined}
                  value={editForm[f.key]} onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width:'100%', background:SS.card2, border:`1px solid ${editingProject.color}40`, borderRadius:8, padding:'8px 12px', color:'white', fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none' }}
                />
              </div>
            ))}
            <button onClick={() => {
              updateProject(editingProject.id, {
                pct:   Math.min(100, Math.max(0, parseInt(editForm.pct)   || 0)),
                done:  Math.max(0, parseInt(editForm.done)  || 0),
                tasks: Math.max(0, parseInt(editForm.tasks) || 0),
              });
              setEditingProject(null);
            }} style={{ width:'100%', padding:'10px', background:editingProject.color, color:SS.bg, border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Guardar</button>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background:'#0c1828', borderRadius:16, padding:24, minWidth:300, border:`1px solid ${SS.yellow}30`, boxShadow:`0 0 40px ${SS.yellow}20` }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:14, fontWeight:700, color:'white', marginBottom:16 }}>Nuevo Proyecto</div>
            {[
              { label:'Nombre', key:'name' as const, placeholder:'App SS...' },
              { label:'Categoría', key:'cat' as const, placeholder:'🚀 Tech' },
              { label:'Fecha límite', key:'deadline' as const, placeholder:'15 May 2026' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:10 }}>
                <label style={{ fontSize:11, color:SS.dimText, display:'block', marginBottom:4 }}>{f.label}</label>
                <input
                  value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width:'100%', background:SS.card2, border:`1px solid ${SS.yellow}40`, borderRadius:8, padding:'8px 12px', color:'white', fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none' }}
                />
              </div>
            ))}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, color:SS.dimText, display:'block', marginBottom:6 }}>Color</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {[SS.cyan, SS.yellow, SS.green, SS.pink, SS.blue, SS.orange, SS.purple, SS.red].map(c => (
                  <div key={c} onClick={() => setForm(prev => ({ ...prev, color: c }))} style={{ width:22, height:22, borderRadius:6, background:c, cursor:'pointer', border: form.color === c ? `2px solid white` : `2px solid transparent`, boxShadow: form.color === c ? `0 0 8px ${c}` : 'none' }}/>
                ))}
              </div>
            </div>
            <button onClick={handleAdd} style={{ marginTop:4, width:'100%', padding:'10px', background:SS.yellow, color:SS.bg, border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Crear Proyecto</button>
          </div>
        </div>
      )}
    </div>
  );
}
