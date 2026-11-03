import { useState } from 'react'
import Home from './pages/Home.jsx'
import NewReceipt from './pages/NewReceipt.jsx'
import History from './pages/History.jsx'
import Stats from './pages/Stats.jsx'

// Οι καρτέλες της εφαρμογής. Για να προσθέσεις νέα σελίδα,
// φτιάξε το component της στο src/pages/ και πρόσθεσέ τη εδώ.
const TABS = [
  { id: 'home', label: 'Αρχική', icon: '⌂', component: Home },
  { id: 'new', label: 'Νέα', icon: '+', component: NewReceipt },
  { id: 'history', label: 'Ιστορικό', icon: '☰', component: History },
  { id: 'stats', label: 'Στατιστικά', icon: '▤', component: Stats },
]

export default function App() {
  // useState: η "μνήμη" του component. Όταν αλλάζει, το React ξαναζωγραφίζει την οθόνη.
  const [activeTab, setActiveTab] = useState('home')

  const ActivePage = TABS.find((tab) => tab.id === activeTab).component

  return (
    <div className="app">
      <header className="app-header">
        <h1>Grocery receipts</h1>
      </header>

      <main className="app-main">
        <ActivePage onNavigate={setActiveTab} />
      </main>

      <nav className="tab-bar" aria-label="Κύρια πλοήγηση">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={tab.id === activeTab ? 'tab active' : 'tab'}
            onClick={() => setActiveTab(tab.id)}
            aria-current={tab.id === activeTab ? 'page' : undefined}
          >
            <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
