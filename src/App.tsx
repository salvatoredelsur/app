import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import type { SectionId } from './store/useStore';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { BottomNav } from './components/layout/BottomNav';
import { Dashboard } from './sections/Dashboard';
import { Salud } from './sections/Salud';
import { Productividad } from './sections/Productividad';
import { Habitos } from './sections/Habitos';
import { Finanzas } from './sections/Finanzas';

export default function App() {
  const store = useStore();
  const { state, update } = store;
  const [mobile, setMobile] = useState(window.innerWidth < 769);

  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 769);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const setSection = (s: SectionId) => update('section', s);

  const renderSection = () => {
    switch (state.section) {
      case 'dashboard':
        return <Dashboard state={state} setSection={setSection} toggleHabit={store.toggleHabit}/>;
      case 'salud':
        return <Salud state={state} toggleFast={store.toggleFast} addWeight={store.addWeight}/>;
      case 'productividad':
        return <Productividad state={state} addProject={store.addProject} toggleStudyTimer={store.toggleStudyTimer} toggleWorkTimer={store.toggleWorkTimer} incrementPomodoro={store.incrementPomodoro}/>;
      case 'habitos':
        return <Habitos state={state} toggleHabit={store.toggleHabit} addHabit={store.addHabit}/>;
      case 'finanzas':
        return <Finanzas state={state} togglePayment={store.togglePayment} addTransaction={store.addTransaction} addGoalFunds={store.addGoalFunds}/>;
      default:
        return <Dashboard state={state} setSection={setSection} toggleHabit={store.toggleHabit}/>;
    }
  };

  return (
    <div style={{ display:'flex', width:'100%', height:'100vh', background:'#060c18', position:'relative', overflow:'hidden' }}>
      {!mobile && (
        <Sidebar
          active={state.section}
          setSection={setSection}
          collapsed={state.sidebarCollapsed}
        />
      )}

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <TopBar
          section={state.section}
          mobile={mobile}
          onToggleCollapse={() => update('sidebarCollapsed', !state.sidebarCollapsed)}
        />

        <div style={{
          flex:1, overflowY:'auto', overflowX:'hidden',
          padding: mobile ? '20px 16px 80px' : '28px 32px 32px',
        }}>
          {renderSection()}
        </div>
      </div>

      {mobile && <BottomNav active={state.section} setSection={setSection}/>}
    </div>
  );
}
