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

function isHomePath() {
  const path = window.location.pathname
  return path === '/' || path === ''
}

if (bootLoader) {
  if (isHomePath()) {
    window.addEventListener('intro-overlay-ready', hideBootLoader, { once: true })
  } else {
    window.addEventListener('app-shell-ready', hideBootLoader, { once: true })
  }

  // Fallback in case shell-ready / intro events are missed.
  window.setTimeout(hideBootLoader, 6000)
}
