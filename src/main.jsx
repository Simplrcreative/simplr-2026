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

/**
 * Keep the boot loader up until linked stylesheets (and fonts) are ready.
 * Avoids FOUC on prerendered pages without overriding logo/tagline CSS.
 */
function stylesheetsReady() {
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
  if (!links.length) return Promise.resolve()

  return Promise.all(
    links.map((link) => {
      if (link.sheet) return Promise.resolve()
      return new Promise((resolve) => {
        link.addEventListener('load', resolve, { once: true })
        link.addEventListener('error', resolve, { once: true })
      })
    }),
  )
}

function fontsReady() {
  if (!document.fonts?.ready) return Promise.resolve()
  return document.fonts.ready.catch(() => undefined)
}

function nextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve)
    })
  })
}

async function hideBootLoader() {
  if (!bootLoader || bootLoader.dataset.hiding === 'true') return
  bootLoader.dataset.hiding = 'true'

  try {
    await Promise.all([stylesheetsReady(), fontsReady()])
    await nextPaint()
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
