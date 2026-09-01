import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'sweetalert2/dist/sweetalert2.min.css'
import './index.css'
import App from './App.jsx'
import { jsPDF } from 'jspdf';

const basename = import.meta.env.VITE_BASE_PATH || '/DatenBankenApp/AllSeasonFlowers/';

// Hacer jsPDF disponible globalmente para toda la aplicación
window.jspdf = { jsPDF };

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)