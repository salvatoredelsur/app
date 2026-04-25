import { useState, useEffect, useCallback } from 'react';

export type SectionId = 'dashboard' | 'salud' | 'productividad' | 'habitos' | 'finanzas';

export interface WeightEntry { date: string; kg: number; }
export interface FastEntry { date: string; completed: boolean; pct: number; }
export interface HabitCompletion { habitId: number; date: string; }
export interface Habit { id: number; name: string; color: string; }
export interface Project { id: number; name: string; cat: string; pct: number; color: string; deadline: string; tasks: number; done: number; }
export interface Transaction { id: number; date: string; amount: number; category: string; description: string; type: 'income' | 'expense'; }
export interface Payment { id: number; name: string; amount: number; dueDate: string; category: string; paid: boolean; icon: string; urgent?: boolean; }
export interface Goal { id: number; name: string; current: number; target: number; icon: string; color: string; }

export interface HealthMetrics { imc: number; grasa: number; musculo: number; }

export interface AppState {
  section: SectionId;
  sidebarCollapsed: boolean;
  fastStartTime: string | null;
  fastGoalHours: number;
  weightLog: WeightEntry[];
  fastLog: FastEntry[];
  healthMetrics: HealthMetrics;
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  projects: Project[];
  studySessions: { date: string; subject: string; durationMin: number }[];
  workSessions: { date: string; project: string; durationMin: number }[];
  studyTimerStart: string | null;
  workTimerStart: string | null;
  pomodoroCount: number;
  notes: Record<string, string>;
  transactions: Transaction[];
  payments: Payment[];
  goals: Goal[];
}

const today = () => new Date().toISOString().slice(0, 10);

const defaultState: AppState = {
  section: 'dashboard',
  sidebarCollapsed: false,
  fastStartTime: null,
  fastGoalHours: 16,
  healthMetrics: { imc: 23.4, grasa: 18.2, musculo: 42.1 },
  studyTimerStart: null,
  workTimerStart: null,
  weightLog: (() => {
    const arr: WeightEntry[] = [];
    const vals = [82.0,81.8,81.5,81.2,80.9,80.6,80.2,80.1,79.8,79.5,79.2,79.0,78.8,78.7,78.5,78.4,78.5,78.3,78.1,78.5,78.3,78.2,78.0,78.1,78.5,78.3,78.2,78.5,78.4,78.5];
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - (29 - i));
      arr.push({ date: d.toISOString().slice(0, 10), kg: vals[i] });
    }
    return arr;
  })(),
  fastLog: (() => {
    const arr: FastEntry[] = [];
    let s = 7;
    const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
    for (let i = 0; i < 28; i++) {
      const d = new Date(); d.setDate(d.getDate() - (27 - i));
      arr.push({ date: d.toISOString().slice(0, 10), completed: rng() > 0.2, pct: 70 + Math.round(rng() * 30) });
    }
    return arr;
  })(),
  habits: [
    { id:1, name:'Ejercicio',   color:'#00e896' },
    { id:2, name:'Meditación',  color:'#ff3080' },
    { id:3, name:'Lectura',     color:'#00aaff' },
    { id:4, name:'Agua',        color:'#ffe040' },
    { id:5, name:'Sueño',       color:'#ff7c2a' },
    { id:6, name:'Dieta',       color:'#a855f7' },
    { id:7, name:'Código',      color:'#00e5ff' },
    { id:8, name:'Caminar',     color:'#ff9f43' },
    { id:9, name:'Vitaminas',   color:'#74b9ff' },
    { id:10,name:'Diario',      color:'#fd79a8' },
  ],
  habitCompletions: (() => {
    const arr: HabitCompletion[] = [];
    let s = 99;
    const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
    for (let habitId = 1; habitId <= 10; habitId++) {
      for (let d = 0; d < 25; d++) {
        if (rng() > 0.22) {
          const date = new Date(); date.setDate(date.getDate() - (24 - d));
          arr.push({ habitId, date: date.toISOString().slice(0, 10) });
        }
      }
    }
    return arr;
  })(),
  projects: [
    { id:1, name:'App SS Personal',   cat:'🚀 Tech',       pct:68, color:'#00e5ff', deadline:'15 May 2026', tasks:12, done:8 },
    { id:2, name:'Curso IA Avanzado', cat:'📚 Estudio',    pct:45, color:'#ffe040', deadline:'30 Jun 2026', tasks:20, done:9 },
    { id:3, name:'Podcast Semanal',   cat:'🎙 Contenido',  pct:80, color:'#ff3080', deadline:'Continuo',    tasks:4,  done:3 },
    { id:4, name:'Certificación AWS', cat:'📚 Estudio',    pct:30, color:'#00aaff', deadline:'1 Sep 2026',  tasks:15, done:4 },
    { id:5, name:'Fondo Emergencia',  cat:'💰 Finanzas',   pct:72, color:'#00e896', deadline:'31 Dic 2026', tasks:3,  done:2 },
  ],
  studySessions: [
    { date: today(), subject: 'IA', durationMin: 210 },
  ],
  workSessions: [
    { date: today(), project: 'App SS', durationMin: 300 },
  ],
  pomodoroCount: 7,
  notes: {},
  transactions: [
    { id:1, date: today(), amount: 28000, category: 'Salario',      description: 'Salario mensual', type: 'income' },
    { id:2, date: today(), amount: 8500,  category: 'Vivienda',     description: 'Renta',           type: 'expense' },
    { id:3, date: today(), amount: 3000,  category: 'Alimentación', description: 'Supermercado',    type: 'expense' },
    { id:4, date: today(), amount: 2000,  category: 'Transporte',   description: 'Gasolina',        type: 'expense' },
    { id:5, date: today(), amount: 1760,  category: 'Suscripciones',description: 'Netflix, Spotify, Claude', type: 'expense' },
    { id:6, date: today(), amount: 1800,  category: 'Salud',        description: 'Seguro médico',   type: 'expense' },
    { id:7, date: today(), amount: 1440,  category: 'Otros',        description: 'Varios',          type: 'expense' },
  ],
  payments: [
    { id:1, name:'Renta',              amount:8500,  dueDate:'30 Abr', category:'Vivienda',      paid:false, icon:'🏠', urgent:true },
    { id:2, name:'Netflix + Spotify',  amount:340,   dueDate:'2 May',  category:'Suscripciones', paid:false, icon:'📱' },
    { id:3, name:'Seguro médico',      amount:1200,  dueDate:'5 May',  category:'Salud',         paid:false, icon:'🏥' },
    { id:4, name:'Crédito BBVA',       amount:3200,  dueDate:'10 May', category:'Crédito',       paid:false, icon:'💳' },
    { id:5, name:'Suscripción Claude', amount:420,   dueDate:'15 May', category:'Tech',           paid:false, icon:'🤖' },
  ],
  goals: [
    { id:1, name:'Fondo de emergencia', current:45230, target:60000, icon:'🛡️', color:'#00e896' },
    { id:2, name:'Laptop nueva',        current:12000, target:25000, icon:'💻', color:'#00e5ff' },
    { id:3, name:'Viaje Japón',         current:8500,  target:35000, icon:'✈️', color:'#ff3080' },
    { id:4, name:'Inversiones (CETES)', current:25000, target:50000, icon:'📈', color:'#ffe040' },
  ],
};

function loadState(): AppState {
  try {
    const raw = localStorage.getItem('ss_app_state');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate: fill any missing keys from defaultState
      return {
        ...defaultState,
        ...parsed,
        healthMetrics: { ...defaultState.healthMetrics, ...(parsed.healthMetrics ?? {}) },
      };
    }
  } catch { /* ignore */ }
  return defaultState;
}

export function useStore() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    try { localStorage.setItem('ss_app_state', JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const update = useCallback(<K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState(s => ({ ...s, [key]: value }));
  }, []);

  const toggleHabit = useCallback((habitId: number, date: string) => {
    setState(s => {
      const exists = s.habitCompletions.some(c => c.habitId === habitId && c.date === date);
      return {
        ...s,
        habitCompletions: exists
          ? s.habitCompletions.filter(c => !(c.habitId === habitId && c.date === date))
          : [...s.habitCompletions, { habitId, date }],
      };
    });
  }, []);

  const togglePayment = useCallback((id: number) => {
    setState(s => ({
      ...s,
      payments: s.payments.map(p => p.id === id ? { ...p, paid: !p.paid } : p),
    }));
  }, []);

  const addWeight = useCallback((kg: number) => {
    setState(s => {
      const date = today();
      const filtered = s.weightLog.filter(e => e.date !== date);
      return { ...s, weightLog: [...filtered, { date, kg }].slice(-30) };
    });
  }, []);

  const toggleFast = useCallback(() => {
    setState(s => {
      if (s.fastStartTime) {
        const startMs = new Date(s.fastStartTime).getTime();
        const elapsed = (Date.now() - startMs) / 3600000;
        const pct = Math.min(100, Math.round((elapsed / s.fastGoalHours) * 100));
        const date = today();
        const newLog = s.fastLog.filter(e => e.date !== date);
        newLog.push({ date, completed: elapsed >= s.fastGoalHours, pct });
        return { ...s, fastStartTime: null, fastLog: newLog };
      }
      return { ...s, fastStartTime: new Date().toISOString() };
    });
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>) => {
    setState(s => ({
      ...s,
      transactions: [...s.transactions, { ...tx, id: Date.now() }],
    }));
  }, []);

  const addGoalFunds = useCallback((id: number, amount: number) => {
    setState(s => ({
      ...s,
      goals: s.goals.map(g => g.id === id ? { ...g, current: g.current + amount } : g),
    }));
  }, []);

  const addProject = useCallback((p: Omit<Project, 'id'>) => {
    setState(s => ({
      ...s,
      projects: [...s.projects, { ...p, id: Date.now() }],
    }));
  }, []);

  const addHabit = useCallback((h: Omit<Habit, 'id'>) => {
    setState(s => ({
      ...s,
      habits: [...s.habits, { ...h, id: Date.now() }],
    }));
  }, []);

  const updateHabit = useCallback((id: number, patch: Partial<Omit<Habit, 'id'>>) => {
    setState(s => ({
      ...s,
      habits: s.habits.map(h => h.id === id ? { ...h, ...patch } : h),
    }));
  }, []);

  const toggleStudyTimer = useCallback((subject = 'General') => {
    setState(s => {
      if (s.studyTimerStart) {
        const elapsed = Math.round((Date.now() - new Date(s.studyTimerStart).getTime()) / 60000);
        if (elapsed > 0) {
          return { ...s, studyTimerStart: null, studySessions: [...s.studySessions, { date: today(), subject, durationMin: elapsed }] };
        }
        return { ...s, studyTimerStart: null };
      }
      return { ...s, studyTimerStart: new Date().toISOString() };
    });
  }, []);

  const toggleWorkTimer = useCallback((project = 'General') => {
    setState(s => {
      if (s.workTimerStart) {
        const elapsed = Math.round((Date.now() - new Date(s.workTimerStart).getTime()) / 60000);
        if (elapsed > 0) {
          return { ...s, workTimerStart: null, workSessions: [...s.workSessions, { date: today(), project, durationMin: elapsed }] };
        }
        return { ...s, workTimerStart: null };
      }
      return { ...s, workTimerStart: new Date().toISOString() };
    });
  }, []);

  const setNote = useCallback((date: string, text: string) => {
    setState(s => ({ ...s, notes: { ...s.notes, [date]: text } }));
  }, []);

  const addStudySession = useCallback((subject: string, durationMin: number) => {
    setState(s => ({ ...s, studySessions: [...s.studySessions, { date: today(), subject, durationMin }] }));
  }, []);

  const addWorkSession = useCallback((project: string, durationMin: number) => {
    setState(s => ({ ...s, workSessions: [...s.workSessions, { date: today(), project, durationMin }] }));
  }, []);

  const incrementPomodoro = useCallback(() => {
    setState(s => ({ ...s, pomodoroCount: s.pomodoroCount + 1 }));
  }, []);

  const resetPomodoro = useCallback(() => {
    setState(s => ({ ...s, pomodoroCount: 0 }));
  }, []);

  const updateProject = useCallback((id: number, patch: Partial<Omit<Project, 'id'>>) => {
    setState(s => ({
      ...s,
      projects: s.projects.map(p => p.id === id ? { ...p, ...patch } : p),
    }));
  }, []);

  const deleteProject = useCallback((id: number) => {
    setState(s => ({ ...s, projects: s.projects.filter(p => p.id !== id) }));
  }, []);

  const deleteHabit = useCallback((id: number) => {
    setState(s => ({
      ...s,
      habits: s.habits.filter(h => h.id !== id),
      habitCompletions: s.habitCompletions.filter(c => c.habitId !== id),
    }));
  }, []);

  const deleteTransaction = useCallback((id: number) => {
    setState(s => ({ ...s, transactions: s.transactions.filter(t => t.id !== id) }));
  }, []);

  const addPayment = useCallback((p: Omit<Payment, 'id'>) => {
    setState(s => ({ ...s, payments: [...s.payments, { ...p, id: Date.now() }] }));
  }, []);

  const deletePayment = useCallback((id: number) => {
    setState(s => ({ ...s, payments: s.payments.filter(p => p.id !== id) }));
  }, []);

  const addGoal = useCallback((g: Omit<Goal, 'id'>) => {
    setState(s => ({ ...s, goals: [...s.goals, { ...g, id: Date.now() }] }));
  }, []);

  const deleteGoal = useCallback((id: number) => {
    setState(s => ({ ...s, goals: s.goals.filter(g => g.id !== id) }));
  }, []);

  const updateHealthMetrics = useCallback((patch: Partial<HealthMetrics>) => {
    setState(s => ({ ...s, healthMetrics: { ...s.healthMetrics, ...patch } }));
  }, []);

  const setFastGoal = useCallback((hours: number) => {
    setState(s => ({ ...s, fastGoalHours: hours }));
  }, []);

  return {
    state, update,
    toggleHabit, addHabit, updateHabit, deleteHabit,
    togglePayment, addPayment, deletePayment,
    addWeight,
    toggleFast, setFastGoal,
    addTransaction, deleteTransaction,
    addGoalFunds, addGoal, deleteGoal,
    addProject, updateProject, deleteProject,
    setNote,
    toggleStudyTimer, toggleWorkTimer, addStudySession, addWorkSession, incrementPomodoro, resetPomodoro,
    updateHealthMetrics,
  };
}
