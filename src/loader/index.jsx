import * as React from 'react'
import gsap from 'gsap'
import styles from './style.module.css'

const OVERLAY_FADE_MS = 500
const HINT_EXIT_MS = 500
const HINT_ENTER_DELAY = 0.35
const HINT_ENTER_DURATION = 0.75

export function PageLoader({ progress, onComplete, minVisibleMs = 1500, hintText, staticHint = false }) {
  const [showOverlay, setShowOverlay] = React.useState(true)
  const [showHint, setShowHint] = React.useState(false)
  const [hintExiting, setHintExiting] = React.useState(false)
  const [minTimeElapsed, setMinTimeElapsed] = React.useState(minVisibleMs <= 0)
  const visualRef = React.useRef(0)
  const hasCompletedRef = React.useRef(false)
  const hasScheduledRef = React.useRef(false)
  const onCompleteRef = React.useRef(onComplete)
  const hintRef = React.useRef(null)
  const hintTweenRef = React.useRef(null)
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

    const mountMs = staticHint ? 0 : OVERLAY_FADE_MS
    let hintTimer

    if (hintText) {
      hintTimer = window.setTimeout(() => setShowHint(true), mountMs)
    }

    const overlayTimer = window.setTimeout(() => {
      setShowOverlay(false)
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true
        onCompleteRef.current?.()
      }
    }, mountMs)

    return () => {
      if (hintTimer) window.clearTimeout(hintTimer)
      window.clearTimeout(overlayTimer)
    }
  }, [isComplete, hintText, staticHint])

  React.useLayoutEffect(() => {
    hintTweenRef.current?.kill()

    if (!showHint || !hintRef.current || hintExiting) return undefined

    if (staticHint) {
      gsap.set(hintRef.current, { opacity: 1, y: 0 })
      return undefined
    }

    gsap.set(hintRef.current, { opacity: 0, y: 8 })
    hintTweenRef.current = gsap.to(hintRef.current, {
      opacity: 1,
      y: 0,
      duration: HINT_ENTER_DURATION,
      delay: HINT_ENTER_DELAY,
      ease: 'power2.out',
    })

    return () => hintTweenRef.current?.kill()
  }, [showHint, staticHint, hintExiting])

  React.useLayoutEffect(() => {
    if (!hintExiting || !hintRef.current) return undefined

    hintTweenRef.current?.kill()
    hintTweenRef.current = gsap.to(hintRef.current, {
      opacity: 0,
      y: 8,
      duration: HINT_EXIT_MS / 1000,
      ease: 'power2.out',
    })

    return () => hintTweenRef.current?.kill()
  }, [hintExiting])

  React.useEffect(() => {
    if (!showHint) {
      setHintExiting(false)
      return undefined
    }

    const dismiss = () => {
      setHintExiting(true)
      window.setTimeout(() => setShowHint(false), HINT_EXIT_MS)
    }

    const scrollGraceMs = staticHint ? 400 : 600
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
        <div ref={hintRef} className={styles.bootLoader}>
          {hintText}
        </div>
      )}
    </>
  )
}
