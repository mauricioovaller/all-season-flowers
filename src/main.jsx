import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { jsPDF } from 'jspdf';

// Hacer jsPDF disponible globalmente para toda la aplicación
window.jspdf = { jsPDF };

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/DatenBankenApp/AllSeasonFlowers">
      <App />
    </BrowserRouter>
  </StrictMode>,
)