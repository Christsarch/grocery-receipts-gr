import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Το σημείο εκκίνησης: το React "ζωγραφίζει" το <App /> μέσα στο <div id="root"> του index.html
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
