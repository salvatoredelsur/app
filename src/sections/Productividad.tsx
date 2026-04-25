import { useState } from 'react';
import type { AppState, Project } from '../store/useStore';
import { SS } from '../tokens';
import { CircuitBg } from '../components/shared/CircuitBg';
import { Blob } from '../components/shared/Blob';
import { SectionHdr } from '../components/shared/SectionHdr';
import { Card, CardTitle } from '../components/shared/Card';
import { Bar } from '../components/shared/Bar';
import { Donut } from '../components/shared/Donut';

interface Props { state: AppState; addProject: (p: Omit<Project, 'id'>) => void; }

const TODAY_STR = new Date().toISOString().slice(0, 10);
const WEEK_DAYS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const STUDY_HRS = [4,5,3,6,3.5,2,1];
const WORK_HRS  = [7,8,6,8,5,3,0];

const SUBJECTS = [
  { name:'Inteligencia Artificial', hrs:12.5, color:SS.cyan },
  { name:'Programación Web',        hrs:8.0,  color:SS.blue },
  { name:'Inglés',                  hrs:5.5,  color:SS.yellow },
  { name:'Finanzas Personales',     hrs:3.0,  color:SS.green },
];

const MAX_HRS = Math.max(...STUDY_HRS, ...WORK_HRS);

export function Productividad({ state, addProject }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:'', cat:'', deadline:'', color: SS.cyan });

  const studyMin = state.studySessions.filter(s => s.date === TODAY_STR).reduce((a, b) => a + b.durationMin, 0);
  const workMin  = state.workSessions.filter(s => s.date === TODAY_STR).reduce((a, b) => a + b.durationMin, 0);
  const studyH = +(studyMin / 60).toFixed(1) || 3.5;
  const workH  = +(workMin  / 60).toFixed(1) || 5.0;

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
    { label:'Proyectos Act.',    current: state.projects.length, goal: state.projects.length || 5, color:SS.green, noUnit:true },
  ];

  return (
    <div style={{ position:'relative' }}>
      <CircuitBg id="pr" opacity={0.05}/>
      <Blob color={SS.yellow} top={-40} left={-40}/>
      <SectionHdr title="Productividad" sub="Estudio, trabajo y proyectos" color={SS.yellow} action="+ Proyecto" onAction={() => setShowModal(true)}/>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {rings.map((item, i) => (
          <Card key={i} color={item.color} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'16px 10px' }}>
            <Donut pct={(item.current / item.goal) * 100} color={item.color} size={72} stroke={8}
              label={item.noUnit ? `${item.current}` : `${item.current}h`}/>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.7)', letterSpacing:.3 }}>{item.label}</div>
              <div style={{ fontSize:9, color:SS.dimText }}>{item.current}/{item.goal}{item.noUnit ? '' : ' h'}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        <Card color={SS.yellow}>
          <CardTitle color={SS.yellow}>Horas Semanales</CardTitle>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80, marginBottom:4 }}>
            {WEEK_DAYS.map((d, i) => (
              <div key={d} style={{ flex:1, display:'flex', flexDirection:'column', gap:1, alignItems:'stretch' }}>
                <div style={{ background:SS.blue, borderRadius:'3px 3px 0 0', height:`${(WORK_HRS[i]/MAX_HRS)*64}px`, boxShadow:`0 0 5px ${SS.blue}55` }}/>
                <div style={{ background:SS.yellow, borderRadius:'0 0 3px 3px', height:`${(STUDY_HRS[i]/MAX_HRS)*64}px`, boxShadow:`0 0 5px ${SS.yellow}55` }}/>
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

      <Card color={SS.cyan}>
        <CardTitle color={SS.cyan}>Proyectos en Seguimiento</CardTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {state.projects.map((p) => (
            <div key={p.id} style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:12, alignItems:'center', padding:'10px 12px', background:SS.card2, borderRadius:12, border:`1px solid ${p.color}18` }}>
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
            </div>
          ))}
        </div>
      </Card>

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
            <button onClick={handleAdd} style={{ marginTop:4, width:'100%', padding:'10px', background:SS.yellow, color:SS.bg, border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Crear Proyecto</button>
          </div>
        </div>
      )}
    </div>
  );
}
