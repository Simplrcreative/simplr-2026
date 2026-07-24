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

function stylesheetsReady() {
  const sheets = Array.from(document.styleSheets)
  if (!sheets.length) return Promise.resolve()

  return Promise.all(
    Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((link) => {
      if (link.sheet) return Promise.resolve()
      return new Promise((resolve) => {
        link.addEventListener('load', resolve, { once: true })
        link.addEventListener('error', resolve, { once: true })
      })
    }),
  )
}

async function hideBootLoader() {
  if (!bootLoader) return

  try {
    await stylesheetsReady()
  } catch {
    // Still dismiss — fallback timeout covers hard failures.
  }

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
    window.addEventListener('intro-overlay-ready', () => {
      void hideBootLoader()
    }, { once: true })
  } else {
    window.addEventListener('app-shell-ready', () => {
      void hideBootLoader()
    }, { once: true })
  }

  // Fallback in case shell-ready / intro events are missed.
  window.setTimeout(() => {
    void hideBootLoader()
  }, 6000)
}
