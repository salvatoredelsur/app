import { useState } from 'react';
import type { AppState, Transaction } from '../store/useStore';
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
}

const BALANCE_TREND = [38000,39500,40200,38800,41000,42500,41800,43200,44000,43500,44800,45230];

const GASTOS_CAT = [
  { cat:'Vivienda',      pct:46, color:SS.blue,    amount:8500 },
  { cat:'Alimentación',  pct:16, color:SS.green,   amount:3000 },
  { cat:'Transporte',    pct:11, color:SS.yellow,  amount:2000 },
  { cat:'Suscripciones', pct:9,  color:SS.purple,  amount:1760 },
  { cat:'Salud',         pct:10, color:SS.cyan,    amount:1800 },
  { cat:'Otros',         pct:8,  color:SS.dimText, amount:1440 },
];

export function Finanzas({ state, togglePayment, addTransaction, addGoalFunds }: Props) {
  const [showTxModal, setShowTxModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState<number | null>(null);
  const [txForm, setTxForm] = useState({ amount:'', category:'', description:'', type:'expense' as 'income'|'expense' });
  const [goalAmount, setGoalAmount] = useState('');

  const income  = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const savings = income - expense;

  const pendingPayments = state.payments.filter(p => !p.paid);
  const pendingTotal    = pendingPayments.reduce((s, p) => s + p.amount, 0);

  const handleAddTx = () => {
    const amt = parseFloat(txForm.amount);
    if (!isNaN(amt) && amt > 0) {
      addTransaction({ date: new Date().toISOString().slice(0,10), amount: amt, category: txForm.category || 'Otros', description: txForm.description, type: txForm.type });
      setShowTxModal(false);
      setTxForm({ amount:'', category:'', description:'', type:'expense' });
    }
  };

  const handleAddGoal = () => {
    const amt = parseFloat(goalAmount);
    if (!isNaN(amt) && amt > 0 && showGoalModal != null) {
      addGoalFunds(showGoalModal, amt);
      setShowGoalModal(null);
      setGoalAmount('');
    }
  };

  const txFields = [
    { label:'Monto ($)', key:'amount' as const, placeholder:'1500', type:'number' },
    { label:'Categoría', key:'category' as const, placeholder:'Alimentación', type:'text' },
    { label:'Descripción', key:'description' as const, placeholder:'Supermercado...', type:'text' },
  ];

  return (
    <div style={{ position:'relative' }}>
      <CircuitBg id="fn" opacity={0.05}/>
      <Blob color={SS.green} top={-40} right={-40}/>
      <SectionHdr title="Finanzas" sub="Balance y objetivos — Abril 2026" color={SS.green} action="+ Transacción" onAction={() => setShowTxModal(true)}/>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { lb:'Balance Total',  val:`$${balance.toLocaleString()}`,  sub:'+$1,430 este mes',        c:SS.green  },
          { lb:'Ingresos/mes',   val:`$${income.toLocaleString()}`,   sub:'Salario + freelance',      c:SS.cyan   },
          { lb:'Gastos/mes',     val:`$${expense.toLocaleString()}`,  sub:'−$500 vs mes anterior',    c:SS.orange },
          { lb:'Ahorro/mes',     val:`$${savings.toLocaleString()}`,  sub:`${income>0?Math.round((savings/income)*100):0}% tasa de ahorro`, c:SS.yellow },
        ].map((s, i) => (
          <Card key={i} color={s.c} style={{ padding:'14px 14px' }}>
            <div style={{ fontSize:9, fontWeight:600, letterSpacing:1, textTransform:'uppercase', color:SS.dimText, marginBottom:4 }}>{s.lb}</div>
            <div style={{ fontSize:22, fontWeight:900, color:s.c, textShadow:`0 0 18px ${s.c}80`, letterSpacing:-0.5, lineHeight:1 }}>{s.val}</div>
            <div style={{ fontSize:10, color:SS.dimText, marginTop:4 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        <Card color={SS.green}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <CardTitle color={SS.green}>Tendencia de Balance</CardTitle>
            <span style={{ fontSize:11, color:SS.green, fontWeight:700 }}>+19% ↑</span>
          </div>
          <Sparkline data={BALANCE_TREND} color={SS.green} width={280} height={60}/>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            {['Ene','Feb','Mar','Abr'].map(m => <span key={m} style={{ fontSize:8, color:SS.mutedText }}>{m}</span>)}
          </div>
        </Card>

        <Card color={SS.orange}>
          <CardTitle color={SS.orange}>Gastos por Categoría</CardTitle>
          {GASTOS_CAT.map((g, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom: i < GASTOS_CAT.length - 1 ? 6 : 0 }}>
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

      <Card color={SS.red} style={{ marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <CardTitle color={SS.red}>Pagos Pendientes</CardTitle>
          <span style={{ fontSize:11, fontWeight:700, color:SS.red }}>Total: ${pendingTotal.toLocaleString()}</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {state.payments.map((p) => (
            <div key={p.id}
              onClick={() => togglePayment(p.id)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:SS.card2, borderRadius:11, border:`1px solid ${p.urgent && !p.paid ? SS.red + '50' : SS.border}`, cursor:'pointer', opacity: p.paid ? 0.5 : 1, transition:'opacity .2s' }}>
              <span style={{ fontSize:18 }}>{p.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.85)', textDecoration: p.paid ? 'line-through' : 'none' }}>{p.name}</div>
                <div style={{ fontSize:9, color:SS.dimText }}>Vence: {p.dueDate}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:14, fontWeight:800, color: p.paid ? SS.green : (p.urgent ? SS.red : SS.orange), textShadow:`0 0 10px ${p.paid ? SS.green : SS.orange}80` }}>${p.amount.toLocaleString()}</div>
                {p.paid
                  ? <span style={{ fontSize:8, color:SS.green }}>✓ Pagado</span>
                  : p.urgent && <span style={{ fontSize:8, color:SS.red, background:`${SS.red}15`, padding:'1px 6px', borderRadius:8, border:`1px solid ${SS.red}40` }}>Urgente</span>
                }
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card color={SS.yellow}>
        <CardTitle color={SS.yellow}>Objetivos Financieros</CardTitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {state.goals.map((o) => (
            <div key={o.id} onClick={() => setShowGoalModal(o.id)} style={{ padding:'12px', background:SS.card2, borderRadius:12, border:`1px solid ${o.color}20`, cursor:'pointer' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={{ fontSize:20 }}>{o.icon}</span>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.85)' }}>{o.name}</div>
                  <div style={{ fontSize:9, color:SS.dimText }}>${o.current.toLocaleString()} / ${o.target.toLocaleString()}</div>
                </div>
              </div>
              <Bar pct={(o.current/o.target)*100} color={o.color}/>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                <span style={{ fontSize:9, color:SS.dimText }}>Progreso</span>
                <span style={{ fontSize:9, fontWeight:700, color:o.color }}>{Math.round((o.current/o.target)*100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showTxModal && (
        <Modal title="Nueva Transacción" color={SS.green} onClose={() => setShowTxModal(false)}>
          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
            {(['income','expense'] as const).map(t => (
              <button key={t} onClick={() => setTxForm(prev => ({ ...prev, type: t }))} style={{ flex:1, padding:'7px', borderRadius:8, border:`1px solid ${txForm.type===t?(t==='income'?SS.green:SS.red):'rgba(255,255,255,0.1)'}`, background: txForm.type===t?(t==='income'?`${SS.green}20`:`${SS.red}20`):'transparent', color: txForm.type===t?(t==='income'?SS.green:SS.red):'rgba(255,255,255,0.4)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                {t === 'income' ? '↑ Ingreso' : '↓ Gasto'}
              </button>
            ))}
          </div>
          {txFields.map(f => (
            <div key={f.key} style={{ marginBottom:8 }}>
              <label style={{ fontSize:11, color:SS.dimText, display:'block', marginBottom:4 }}>{f.label}</label>
              <input
                type={f.type}
                value={txForm[f.key]} onChange={e => setTxForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ width:'100%', background:SS.card2, border:`1px solid ${SS.green}40`, borderRadius:8, padding:'8px 12px', color:'white', fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none' }}
              />
            </div>
          ))}
          <button onClick={handleAddTx} style={{ marginTop:4, width:'100%', padding:'10px', background:SS.green, color:SS.bg, border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Registrar</button>
        </Modal>
      )}

      {showGoalModal !== null && (
        <Modal title="Agregar fondos" color={SS.yellow} onClose={() => setShowGoalModal(null)}>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, color:'white', fontWeight:600, marginBottom:2 }}>{state.goals.find(g => g.id === showGoalModal)?.name}</div>
          </div>
          <label style={{ fontSize:11, color:SS.dimText, display:'block', marginBottom:6 }}>Monto a agregar ($)</label>
          <input
            type="number" value={goalAmount} onChange={e => setGoalAmount(e.target.value)}
            placeholder="500"
            style={{ width:'100%', background:SS.card2, border:`1px solid ${SS.yellow}40`, borderRadius:8, padding:'8px 12px', color:'white', fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none' }}
            autoFocus
          />
          <button onClick={handleAddGoal} style={{ marginTop:12, width:'100%', padding:'10px', background:SS.yellow, color:SS.bg, border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Agregar</button>
        </Modal>
      )}
    </div>
  );
}

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
