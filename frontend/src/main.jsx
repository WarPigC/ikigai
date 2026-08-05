import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'  // 👈 This imports Tailwind styles

// Disable Right Click (Context Menu)
document.addEventListener('contextmenu', event => event.preventDefault());

// Disable common Developer Tools shortcuts
document.addEventListener('keydown', (e) => {
  // F12
  if (e.key === 'F12' || e.keyCode === 123) {
    e.preventDefault();
  }
  // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
  if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
    e.preventDefault();
  }
  // Ctrl+U (View Source)
  if (e.ctrlKey && e.key === 'U') {
    e.preventDefault();
  }
  // Mac equivalents (Cmd+Opt+I, Cmd+Opt+J, Cmd+Opt+C, Cmd+U)
  if (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'j' || e.key === 'c' || e.key === 'u')) {
    e.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
