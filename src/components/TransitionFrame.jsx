import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { siteConfig } from '../config/site.js'
import { createSurfaceColorTransitions } from '../lib/animations/transitions.js'
import { createSlideUpAnimations } from '../lib/animations/slide-up.js'

const PAGE_TRANSITION_COMPLETE_EVENT = 'page-transition:complete'

export default function TransitionFrame({ children }) {
  const ref = useRef(null)
  const hasMounted = useRef(false)
  const location = useLocation()

  useEffect(() => {
    if (!ref.current || !siteConfig.transitions.enabled) {
      return undefined
    }

    if (!hasMounted.current) {
      hasMounted.current = true
      return undefined
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        {
          autoAlpha: siteConfig.transitions.opacity,
          y: siteConfig.transitions.y,
          filter: `blur(${siteConfig.transitions.blur}px)`,
        },
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: siteConfig.transitions.duration,
          ease: siteConfig.transitions.ease,
          onComplete: () => window.dispatchEvent(new Event(PAGE_TRANSITION_COMPLETE_EVENT)),
          onInterrupt: () => window.dispatchEvent(new Event(PAGE_TRANSITION_COMPLETE_EVENT)),
          clearProps: 'opacity,transform,filter',
        },
      )
    }, ref)

    return () => ctx.revert()
  }, [location.pathname])

  useEffect(() => createSurfaceColorTransitions(ref.current), [location.pathname])
  useEffect(() => createSlideUpAnimations(ref.current), [location.pathname])

  return (
    <div key={location.pathname} ref={ref}>
      {children}
    </div>
  )
}