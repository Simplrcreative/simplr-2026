import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './styles/app.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)

const bootLoader = document.getElementById('boot-loader')

function hideBootLoader() {
  if (!bootLoader) return

  bootLoader.classList.add('is-hidden')
  window.setTimeout(() => {
    bootLoader.remove()
  }, 260)
}

if (bootLoader) {
  window.addEventListener('app-shell-ready', hideBootLoader, { once: true })

  // Fallback in case shell-ready event is missed.
  window.setTimeout(hideBootLoader, 6000)
}
