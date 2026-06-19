import * as React from 'react'
import styles from './style.module.css'

export function PageLoader({ progress, onComplete, minVisibleMs = 1500 }) {
  const [show, setShow] = React.useState(true)
  const [minTimeElapsed, setMinTimeElapsed] = React.useState(minVisibleMs <= 0)
  const visualRef = React.useRef(0)
  const hasCompletedRef = React.useRef(false)
  const [visualProgress, setVisualProgress] = React.useState(0)

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
    if (minTimeElapsed && progress === 100 && visualProgress >= 99.5) {
      const t = setTimeout(() => {
        setShow(false)
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true
          onComplete?.()
        }
      }, 200)
      return () => clearTimeout(t)
    }
  }, [minTimeElapsed, progress, visualProgress, onComplete])

  if (!show) return null

  const isHidden = minTimeElapsed && progress === 100 && visualProgress >= 99.5

  return (
    <div className={`${styles.overlay} ${isHidden ? styles.hidden : styles.visible}`}>
      <div className={styles.progressBarContainer}>
        <div className={styles.progressBarFill} style={{ transform: `scaleX(${visualProgress / 100})` }} />
      </div>
    </div>
  )
}
