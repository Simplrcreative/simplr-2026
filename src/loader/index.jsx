import * as React from 'react'
import styles from './style.module.css'

const HINT_MOUNT_MS = 200
const HINT_EXIT_MS = 500

export function PageLoader({ progress, onComplete, minVisibleMs = 1500, hintText, staticHint = false }) {
  const [showOverlay, setShowOverlay] = React.useState(true)
  const [showHint, setShowHint] = React.useState(false)
  const [hintExiting, setHintExiting] = React.useState(false)
  const [minTimeElapsed, setMinTimeElapsed] = React.useState(minVisibleMs <= 0)
  const visualRef = React.useRef(0)
  const hasCompletedRef = React.useRef(false)
  const hasScheduledRef = React.useRef(false)
  const onCompleteRef = React.useRef(onComplete)
  const [visualProgress, setVisualProgress] = React.useState(0)

  onCompleteRef.current = onComplete

  const isComplete = minTimeElapsed && progress === 100 && visualProgress >= 99.5

  React.useEffect(() => {
    if (minVisibleMs <= 0) {
      setMinTimeElapsed(true)
      return undefined
    }

    const timer = setTimeout(() => setMinTimeElapsed(true), minVisibleMs)
    return () => clearTimeout(timer)
  }, [minVisibleMs])

  React.useEffect(() => {
    let raf

    const animate = () => {
      const diff = progress - visualRef.current

      if (diff > 0.1) {
        visualRef.current += diff * 0.08
        setVisualProgress(visualRef.current)
        raf = requestAnimationFrame(animate)
      } else {
        visualRef.current = progress
        setVisualProgress(progress)
      }
    }

    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [progress])

  React.useEffect(() => {
    if (!isComplete || hasScheduledRef.current) return undefined

    hasScheduledRef.current = true

    const hintMountMs = staticHint ? 0 : HINT_MOUNT_MS
    let hintTimer

    if (hintText) {
      hintTimer = window.setTimeout(() => setShowHint(true), hintMountMs)
    }

    const overlayTimer = window.setTimeout(() => {
      setShowOverlay(false)
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true
        onCompleteRef.current?.()
      }
    }, hintMountMs)

    return () => {
      if (hintTimer) window.clearTimeout(hintTimer)
      window.clearTimeout(overlayTimer)
    }
  }, [isComplete, hintText, staticHint])

  React.useEffect(() => {
    if (!showHint) {
      setHintExiting(false)
      return undefined
    }

    const dismiss = () => {
      setHintExiting(true)
      window.setTimeout(() => setShowHint(false), HINT_EXIT_MS)
    }

    const scrollGraceMs = staticHint ? 400 : 0
    const graceTimer = window.setTimeout(() => {
      window.addEventListener('wheel', dismiss, { once: true, passive: true })
      window.addEventListener('touchmove', dismiss, { once: true, passive: true })
    }, scrollGraceMs)

    return () => {
      window.clearTimeout(graceTimer)
      window.removeEventListener('wheel', dismiss)
      window.removeEventListener('touchmove', dismiss)
    }
  }, [showHint, staticHint])

  if (!showOverlay && !showHint) return null

  return (
    <>
      {showOverlay && (
        <div className={`${styles.overlay} ${isComplete ? styles.hidden : styles.visible}`}>
          <div className={styles.progressBarContainer}>
            <div className={styles.progressBarFill} style={{ transform: `scaleX(${visualProgress / 100})` }} />
          </div>
        </div>
      )}
      {showHint && hintText && (
        <div
          className={`${styles.bootLoader} ${
            hintExiting ? styles.exit : staticHint ? styles.static : styles.enter
          }`}
        >
          {hintText}
        </div>
      )}
    </>
  )
}
