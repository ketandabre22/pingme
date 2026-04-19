import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply saved theme on load
const savedTheme = localStorage.getItem('pingme-theme');
if (savedTheme) {
  document.body.className = savedTheme;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
