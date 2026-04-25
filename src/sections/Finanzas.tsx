import { useState } from 'react';
import type { AppState, Transaction, Payment, Goal } from '../store/useStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { SS } from '../tokens';
import { CircuitBg } from '../components/shared/CircuitBg';
import { Blob } from '../components/shared/Blob';
import { SectionHdr } from '../components/shared/SectionHdr';
import { Card, CardTitle } from '../components/shared/Card';
import { Bar } from '../components/shared/Bar';
import { Sparkline } from '../components/shared/Sparkline';

interface Props {
  state: AppState;
  togglePayment: (id: number) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  addGoalFunds: (id: number, amount: number) => void;
  deleteTransaction: (id: number) => void;
  addPayment: (p: Omit<Payment, 'id'>) => void;
  deletePayment: (id: number) => void;
  addGoal: (g: Omit<Goal, 'id'>) => void;
  deleteGoal: (id: number) => void;
}

const BALANCE_TREND = [38000,39500,40200,38800,41000,42500,41800,43200,44000,43500,44800,45230];

const CAT_COLORS: Record<string, string> = {
  'Vivienda':      SS.blue,
  'Alimentación':  SS.green,
  'Transporte':    SS.yellow,
  'Suscripciones': SS.purple,
  'Salud':         SS.cyan,
  'Salario':       SS.green,
  'Freelance':     SS.cyan,
  'Crédito':       SS.orange,
  'Tech':          SS.blue,
  'Otros':         SS.dimText,
};

const GOAL_COLORS = [SS.green, SS.cyan, SS.pink, SS.yellow, SS.orange, SS.purple];
const GOAL_ICONS  = ['🛡️','💻','✈️','📈','🏠','🎯','💪','🚀'];

function catColor(cat: string) {
  return CAT_COLORS[cat] ?? SS.silver;
}

type ModalType = 'tx' | 'payment' | 'goal' | 'goalfunds' | null;

export function Finanzas({ state, togglePayment, addTransaction, addGoalFunds, deleteTransaction, addPayment, deletePayment, addGoal, deleteGoal }: Props) {
  const mobile = useIsMobile();
  const [modal, setModal]   = useState<ModalType>(null);
  const [goalFundsId, setGoalFundsId] = useState<number | null>(null);
  const [showTxList, setShowTxList]   = useState(false);
  const [txFilter, setTxFilter] = useState<'all' | 'income' | 'expense'>('all');
  useEscapeKey(() => { setModal(null); setGoalFundsId(null); }, modal !== null);

  const [txForm, setTxForm] = useState({ amount:'', category:'', description:'', type:'expense' as 'income'|'expense' });
  const [goalAmount, setGoalAmount]   = useState('');
  const [payForm, setPayForm] = useState({ name:'', amount:'', dueDate:'', category:'', icon:'🏠', urgent: false });
  const [goalForm, setGoalForm] = useState<{ name:string; current:string; target:string; icon:string; color:string }>({ name:'', current:'', target:'', icon:'🎯', color: SS.green });

  const income  = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const savings = income - expense;

  const gastosCat = (() => {
    const bycat: Record<string, number> = {};
    for (const t of state.transactions.filter(t => t.type === 'expense')) {
      bycat[t.category] = (bycat[t.category] ?? 0) + t.amount;
    }
    return Object.entries(bycat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cat, amount]) => ({ cat, amount, pct: expense > 0 ? Math.round((amount / expense) * 100) : 0, color: catColor(cat) }));
  })();

  const pendingPayments = state.payments.filter(p => !p.paid);
  const pendingTotal    = pendingPayments.reduce((s, p) => s + p.amount, 0);

  const handleAddTx = () => {
    const amt = parseFloat(txForm.amount);
    if (!isNaN(amt) && amt > 0) {
      addTransaction({ date: new Date().toISOString().slice(0,10), amount: amt, category: txForm.category || 'Otros', description: txForm.description, type: txForm.type });
      setModal(null);
      setTxForm({ amount:'', category:'', description:'', type:'expense' });
    }
  };

  const handleAddGoalFunds = () => {
    const amt = parseFloat(goalAmount);
    if (!isNaN(amt) && amt > 0 && goalFundsId != null) {
      addGoalFunds(goalFundsId, amt);
      setModal(null);
      setGoalAmount('');
    }
  };

  const handleAddPayment = () => {
    const amt = parseFloat(payForm.amount);
    if (!isNaN(amt) && amt > 0 && payForm.name.trim()) {
      addPayment({ name: payForm.name.trim(), amount: amt, dueDate: payForm.dueDate || '—', category: payForm.category || 'Otros', icon: payForm.icon, paid: false, urgent: payForm.urgent });
      setModal(null);
      setPayForm({ name:'', amount:'', dueDate:'', category:'', icon:'🏠', urgent: false });
    }
  };

  const handleAddGoal = () => {
    const cur = parseFloat(goalForm.current);
    const tgt = parseFloat(goalForm.target);
    if (!isNaN(tgt) && tgt > 0 && goalForm.name.trim()) {
      addGoal({ name: goalForm.name.trim(), current: isNaN(cur) ? 0 : cur, target: tgt, icon: goalForm.icon, color: goalForm.color });
      setModal(null);
      setGoalForm({ name:'', current:'', target:'', icon:'🎯', color: SS.green });
    }
  };

  const filteredTx = [...state.transactions].reverse().filter(t => txFilter === 'all' || t.type === txFilter);
  const recentTx = filteredTx.slice(0, 8);

  const inputStyle = (accent: string) => ({
    width:'100%', background:SS.card2, border:`1px solid ${accent}40`, borderRadius:8,
    padding:'8px 12px', color:'white', fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none',
  });

  return (
    <div style={{ position:'relative' }}>
      <CircuitBg id="fn" opacity={0.05}/>
      <Blob color={SS.green} top={-40} right={-40}/>
      <SectionHdr title="Finanzas" sub={`Balance y objetivos — ${new Date().toLocaleDateString('es-MX',{month:'long',year:'numeric'})}`} color={SS.green} action="+ Transacción" onAction={() => setModal('tx')}/>

      <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { lb:'Balance Total',  val:`$${balance.toLocaleString()}`,  sub:balance >= 0 ? 'Saldo positivo' : 'Saldo negativo', c:balance >= 0 ? SS.green : SS.red },
          { lb:'Ingresos/mes',   val:`$${income.toLocaleString()}`,   sub:'Salario + freelance',      c:SS.cyan   },
          { lb:'Gastos/mes',     val:`$${expense.toLocaleString()}`,  sub:'Total egresos',             c:SS.orange },
          { lb:'Ahorro/mes',     val:`$${Math.max(savings,0).toLocaleString()}`, sub:`${income>0?Math.round((Math.max(savings,0)/income)*100):0}% tasa de ahorro`, c:SS.yellow },
        ].map((s, i) => (
          <Card key={i} color={s.c} style={{ padding:'14px 14px' }}>
            <div style={{ fontSize:9, fontWeight:600, letterSpacing:1, textTransform:'uppercase', color:SS.dimText, marginBottom:4 }}>{s.lb}</div>
            <div style={{ fontSize:mobile ? 18 : 22, fontWeight:900, color:s.c, textShadow:`0 0 18px ${s.c}80`, letterSpacing:-0.5, lineHeight:1 }}>{s.val}</div>
            <div style={{ fontSize:10, color:SS.dimText, marginTop:4 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap:14, marginBottom:20 }}>
        <Card color={SS.green}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <CardTitle color={SS.green}>Tendencia de Balance</CardTitle>
            <span style={{ fontSize:11, color:SS.green, fontWeight:700 }}>+19% ↑</span>
          </div>
          <Sparkline data={BALANCE_TREND} color={SS.green} width={400} height={60} fluid/>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            {['Ene','Feb','Mar','Abr'].map(m => <span key={m} style={{ fontSize:8, color:SS.mutedText }}>{m}</span>)}
          </div>
        </Card>

        <Card color={SS.orange}>
          <CardTitle color={SS.orange}>Gastos por Categoría</CardTitle>
          {gastosCat.length === 0 && <div style={{ fontSize:11, color:SS.dimText }}>Sin gastos registrados aún.</div>}
          {gastosCat.map((g, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom: i < gastosCat.length - 1 ? 6 : 0 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:g.color, flexShrink:0 }}/>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.7)', flex:1 }}>{g.cat}</span>
              <div style={{ width:80 }}>
                <Bar pct={g.pct} color={g.color} height={4}/>
              </div>
              <span style={{ fontSize:9, color:g.color, fontWeight:600, minWidth:28, textAlign:'right' }}>{g.pct}%</span>
            </div>
          ))}
        </Card>
      </div>

      <Card color={SS.cyan} style={{ marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <CardTitle color={SS.cyan}>Transacciones Recientes</CardTitle>
          <button onClick={() => setShowTxList(v => !v)} style={{ fontSize:10, color:SS.cyan, background:'transparent', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", opacity:.7 }}>
            {showTxList ? 'Ver menos' : 'Ver todas'}
          </button>
        </div>
        <div style={{ display:'flex', gap:6, marginBottom:10 }}>
          {(['all','income','expense'] as const).map(f => (
            <button key={f} onClick={() => setTxFilter(f)}
              style={{ padding:'4px 10px', borderRadius:8, fontSize:10, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", border:`1px solid ${txFilter===f ? SS.cyan : 'rgba(255,255,255,0.1)'}`, background: txFilter===f ? `${SS.cyan}20` : 'transparent', color: txFilter===f ? SS.cyan : 'rgba(255,255,255,0.4)' }}>
              {f === 'all' ? 'Todos' : f === 'income' ? '↑ Ingresos' : '↓ Gastos'}
            </button>
          ))}
        </div>
        {recentTx.length === 0 && <div style={{ fontSize:11, color:SS.dimText }}>Sin transacciones. Añade con + Transacción.</div>}
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {(showTxList ? filteredTx : recentTx).map(t => (
            <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:SS.card2, borderRadius:10 }}>
              <div style={{ width:8, height:8, borderRadius:2, background: catColor(t.category), flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.85)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.description || t.category}</div>
                <div style={{ fontSize:9, color:SS.dimText }}>{t.category} · {t.date}</div>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color: t.type === 'income' ? SS.green : SS.red, flexShrink:0 }}>
                {t.type === 'income' ? '+' : '−'}${t.amount.toLocaleString()}
              </span>
              <button onClick={() => deleteTransaction(t.id)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.2)', fontSize:14, padding:'0 2px', lineHeight:1 }}
                onMouseEnter={e => (e.currentTarget.style.color = SS.red)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}>×</button>
            </div>
          ))}
        </div>
      </Card>

      <Card color={SS.red} style={{ marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <CardTitle color={SS.red}>Pagos Pendientes</CardTitle>
            <button onClick={() => setModal('payment')} style={{ fontSize:10, color:SS.red, background:`${SS.red}15`, border:`1px solid ${SS.red}40`, borderRadius:8, padding:'3px 10px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>+ Pago</button>
          </div>
          <span style={{ fontSize:11, fontWeight:700, color:SS.red }}>Total: ${pendingTotal.toLocaleString()}</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {state.payments.map((p) => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', background:SS.card2, borderRadius:11, border:`1px solid ${p.urgent && !p.paid ? SS.red + '50' : SS.border}`, opacity: p.paid ? 0.5 : 1, transition:'opacity .2s' }}>
              <span style={{ fontSize:18, cursor:'pointer' }} onClick={() => togglePayment(p.id)}>{p.icon}</span>
              <div style={{ flex:1, cursor:'pointer' }} onClick={() => togglePayment(p.id)}>
                <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.85)', textDecoration: p.paid ? 'line-through' : 'none' }}>{p.name}</div>
                <div style={{ fontSize:9, color:SS.dimText }}>Vence: {p.dueDate}</div>
              </div>
              <div style={{ textAlign:'right', cursor:'pointer' }} onClick={() => togglePayment(p.id)}>
                <div style={{ fontSize:14, fontWeight:800, color: p.paid ? SS.green : (p.urgent ? SS.red : SS.orange) }}>${p.amount.toLocaleString()}</div>
                {p.paid
                  ? <span style={{ fontSize:8, color:SS.green }}>✓ Pagado</span>
                  : p.urgent && <span style={{ fontSize:8, color:SS.red, background:`${SS.red}15`, padding:'1px 6px', borderRadius:8, border:`1px solid ${SS.red}40` }}>Urgente</span>
                }
              </div>
              <button onClick={() => deletePayment(p.id)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.15)', fontSize:14, padding:'0 2px', lineHeight:1, flexShrink:0 }}
                onMouseEnter={e => (e.currentTarget.style.color = SS.red)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.15)')}>×</button>
            </div>
          ))}
          {state.payments.length === 0 && <div style={{ fontSize:11, color:SS.dimText }}>Sin pagos pendientes. Añade con + Pago.</div>}
        </div>
      </Card>

      <Card color={SS.yellow}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <CardTitle color={SS.yellow}>Objetivos Financieros</CardTitle>
          <button onClick={() => setModal('goal')} style={{ fontSize:10, color:SS.yellow, background:`${SS.yellow}15`, border:`1px solid ${SS.yellow}40`, borderRadius:8, padding:'3px 10px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>+ Objetivo</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap:12 }}>
          {state.goals.map((o) => (
            <div key={o.id} style={{ padding:'12px', background:SS.card2, borderRadius:12, border:`1px solid ${o.color}20`, position:'relative' }}>
              <button onClick={() => deleteGoal(o.id)} style={{ position:'absolute', top:8, right:8, background:'transparent', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.15)', fontSize:14, padding:'0 2px', lineHeight:1 }}
                onMouseEnter={e => (e.currentTarget.style.color = SS.red)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.15)')}>×</button>
              <div onClick={() => { setGoalFundsId(o.id); setModal('goalfunds'); }} style={{ cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:20 }}>{o.icon}</span>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.85)' }}>{o.name}</div>
                    <div style={{ fontSize:9, color:SS.dimText }}>${o.current.toLocaleString()} / ${o.target.toLocaleString()}</div>
                  </div>
                </div>
                <Bar pct={(o.current/o.target)*100} color={o.color}/>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                  <span style={{ fontSize:9, color:SS.dimText }}>Toca para añadir fondos</span>
                  <span style={{ fontSize:9, fontWeight:700, color:o.color }}>{Math.round((o.current/o.target)*100)}%</span>
                </div>
              </div>
            </div>
          ))}
          {state.goals.length === 0 && <div style={{ fontSize:11, color:SS.dimText }}>Sin objetivos. Añade con + Objetivo.</div>}
        </div>
      </Card>

      {/* + Transacción modal */}
      {modal === 'tx' && (
        <Modal title="Nueva Transacción" color={SS.green} onClose={() => setModal(null)}>
          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
            {(['income','expense'] as const).map(t => (
              <button key={t} onClick={() => setTxForm(prev => ({ ...prev, type: t }))}
                style={{ flex:1, padding:'7px', borderRadius:8, border:`1px solid ${txForm.type===t?(t==='income'?SS.green:SS.red):'rgba(255,255,255,0.1)'}`, background: txForm.type===t?(t==='income'?`${SS.green}20`:`${SS.red}20`):'transparent', color: txForm.type===t?(t==='income'?SS.green:SS.red):'rgba(255,255,255,0.4)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                {t === 'income' ? '↑ Ingreso' : '↓ Gasto'}
              </button>
            ))}
          </div>
          {([
            { label:'Monto ($)',    key:'amount'      as const, placeholder:'1500',          type:'number' },
            { label:'Categoría',   key:'category'    as const, placeholder:'Alimentación',  type:'text'   },
            { label:'Descripción', key:'description' as const, placeholder:'Supermercado…', type:'text'   },
          ]).map(f => (
            <div key={f.key} style={{ marginBottom:8 }}>
              <label style={{ fontSize:11, color:SS.dimText, display:'block', marginBottom:4 }}>{f.label}</label>
              <input type={f.type} value={txForm[f.key]} onChange={e => setTxForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder} onKeyDown={e => e.key === 'Enter' && handleAddTx()}
                style={inputStyle(SS.green)}/>
            </div>
          ))}
          <button onClick={handleAddTx} style={{ marginTop:4, width:'100%', padding:'10px', background:SS.green, color:SS.bg, border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Registrar</button>
        </Modal>
      )}

      {/* + Pago modal */}
      {modal === 'payment' && (
        <Modal title="Nuevo Pago" color={SS.red} onClose={() => setModal(null)}>
          {([
            { label:'Nombre',     key:'name'     as const, placeholder:'Netflix…', type:'text'   },
            { label:'Monto ($)',  key:'amount'   as const, placeholder:'350',      type:'number' },
            { label:'Vence',      key:'dueDate'  as const, placeholder:'15 May',   type:'text'   },
            { label:'Categoría', key:'category' as const, placeholder:'Servicios', type:'text'   },
          ]).map(f => (
            <div key={f.key} style={{ marginBottom:8 }}>
              <label style={{ fontSize:11, color:SS.dimText, display:'block', marginBottom:4 }}>{f.label}</label>
              <input type={f.type} value={payForm[f.key]} onChange={e => setPayForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder} onKeyDown={e => e.key === 'Enter' && handleAddPayment()}
                style={inputStyle(SS.red)}/>
            </div>
          ))}
          <div style={{ marginBottom:8 }}>
            <label style={{ fontSize:11, color:SS.dimText, display:'block', marginBottom:4 }}>Icono</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {['🏠','📱','🏥','💳','🤖','🎵','🚗','💡'].map(ic => (
                <button key={ic} onClick={() => setPayForm(prev => ({ ...prev, icon: ic }))}
                  style={{ fontSize:18, background: payForm.icon===ic ? `${SS.red}25` : 'transparent', border:`1px solid ${payForm.icon===ic ? SS.red : 'rgba(255,255,255,0.1)'}`, borderRadius:8, padding:'4px 6px', cursor:'pointer' }}>{ic}</button>
              ))}
            </div>
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:SS.dimText, marginBottom:12, cursor:'pointer' }}>
            <input type="checkbox" checked={payForm.urgent} onChange={e => setPayForm(prev => ({ ...prev, urgent: e.target.checked }))} style={{ accentColor: SS.red }}/>
            Marcar como urgente
          </label>
          <button onClick={handleAddPayment} style={{ width:'100%', padding:'10px', background:SS.red, color:'white', border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Agregar Pago</button>
        </Modal>
      )}

      {/* + Objetivo modal */}
      {modal === 'goal' && (
        <Modal title="Nuevo Objetivo" color={SS.yellow} onClose={() => setModal(null)}>
          {([
            { label:'Nombre',          key:'name'    as const, placeholder:'Fondo emergencia…', type:'text'   },
            { label:'Meta ($)',         key:'target'  as const, placeholder:'50000',              type:'number' },
            { label:'Ahorro actual ($)',key:'current' as const, placeholder:'0',                  type:'number' },
          ]).map(f => (
            <div key={f.key} style={{ marginBottom:8 }}>
              <label style={{ fontSize:11, color:SS.dimText, display:'block', marginBottom:4 }}>{f.label}</label>
              <input type={f.type} value={goalForm[f.key as keyof typeof goalForm] as string}
                onChange={e => setGoalForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder} onKeyDown={e => e.key === 'Enter' && handleAddGoal()}
                style={inputStyle(SS.yellow)}/>
            </div>
          ))}
          <div style={{ marginBottom:8 }}>
            <label style={{ fontSize:11, color:SS.dimText, display:'block', marginBottom:4 }}>Icono</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {GOAL_ICONS.map(ic => (
                <button key={ic} onClick={() => setGoalForm(prev => ({ ...prev, icon: ic }))}
                  style={{ fontSize:18, background: goalForm.icon===ic ? `${SS.yellow}25` : 'transparent', border:`1px solid ${goalForm.icon===ic ? SS.yellow : 'rgba(255,255,255,0.1)'}`, borderRadius:8, padding:'4px 6px', cursor:'pointer' }}>{ic}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:SS.dimText, display:'block', marginBottom:6 }}>Color</label>
            <div style={{ display:'flex', gap:8 }}>
              {GOAL_COLORS.map(c => (
                <div key={c} onClick={() => setGoalForm(prev => ({ ...prev, color: c }))}
                  style={{ width:22, height:22, borderRadius:6, background:c, cursor:'pointer', border: goalForm.color===c ? '2px solid white' : '2px solid transparent', boxShadow: goalForm.color===c ? `0 0 8px ${c}` : 'none' }}/>
              ))}
            </div>
          </div>
          <button onClick={handleAddGoal} style={{ width:'100%', padding:'10px', background:SS.yellow, color:SS.bg, border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Crear Objetivo</button>
        </Modal>
      )}

      {/* Agregar fondos a objetivo */}
      {modal === 'goalfunds' && goalFundsId !== null && (
        <Modal title="Agregar fondos" color={SS.yellow} onClose={() => { setModal(null); setGoalFundsId(null); }}>
          <div style={{ fontSize:12, color:'white', fontWeight:600, marginBottom:12 }}>{state.goals.find(g => g.id === goalFundsId)?.name}</div>
          <label style={{ fontSize:11, color:SS.dimText, display:'block', marginBottom:6 }}>Monto a agregar ($)</label>
          <input type="number" value={goalAmount} onChange={e => setGoalAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddGoalFunds()}
            placeholder="500" autoFocus style={inputStyle(SS.yellow)}/>
          <button onClick={handleAddGoalFunds} style={{ marginTop:12, width:'100%', padding:'10px', background:SS.yellow, color:SS.bg, border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Agregar</button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, color, onClose, children }: { title:string; color:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={onClose}>
      <div style={{ background:'#0c1828', borderRadius:16, padding:24, minWidth:300, maxWidth:420, width:'90%', border:`1px solid ${color}30`, boxShadow:`0 0 40px ${color}20` }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:14, fontWeight:700, color:'white', marginBottom:16 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}
