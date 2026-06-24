import { useEffect, useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { lockScroll, unlockScroll } from '../lib/animations/index.js'

export default function IntroOverlay({ shouldFadeOut = false, onFadeOutComplete }) {
  const overlayRef = useRef(null)
  const hasStartedFadeOut = useRef(false)

  useLayoutEffect(() => {
    window.dispatchEvent(new Event('intro-overlay-ready'))
  }, [])

  useEffect(() => {
    if (!overlayRef.current) {
      return undefined
    }

    const overlayNode = overlayRef.current

    window.scrollTo(0, 0)
    lockScroll('intro-overlay')

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => {
        unlockScroll('intro-overlay')
      }
    }

    // Hold the overlay in place; fade out is handled by RootLayout state
    gsap.set(overlayNode, { autoAlpha: 1 })

    // Sequential looping dot animation: each dot slides out then back before the next starts
    // 5 dots × 0.6s each = 3s per cycle — matches the minimum timer in RootLayout
    const dots = overlayNode.querySelectorAll('.dot')
    const dotsTimeline = gsap.timeline({ repeat: -1 })
    dots.forEach((dot) => {
      dotsTimeline
        .to(dot, { x: '50.5%', duration: 0.4, ease: 'power2.in' })
        .to(dot, { x: 0, duration: 0.5, delay: 0.1, ease: 'power2.in' })
    })

    return () => {
      unlockScroll('intro-overlay')
      dotsTimeline.kill()
    }
  }, [])

  // Fade out when both conditions are met
  useEffect(() => {
    if (!shouldFadeOut || !overlayRef.current || hasStartedFadeOut.current) {
      return
    }

    hasStartedFadeOut.current = true
    const overlayNode = overlayRef.current

    gsap.to(overlayNode, {
      autoAlpha: 0,
      duration: 0.45,
      ease: 'power2.in',
      onComplete: () => {
        onFadeOutComplete?.()
      },
    })
  }, [shouldFadeOut, onFadeOutComplete])

  return (
    <div
      ref={overlayRef}
      className="fixed z-[10050] inset-0 flex items-center justify-center overflow-hidden px-6 text-white"
      style={{ backgroundColor: '#FFF', opacity: 1 }}
      aria-hidden="true"
    > 
      <div className="dots relative h-[1.875rem] w-[1.875rem]">
        <div className="top-dot h-[1.875rem] w-[1.875rem] rounded-full bg-black absolute z-7 inset-0" />
        <div className="dot-hider h-[1.875rem] w-[1.875rem] bg-white absolute z-6 inset-0" />
        <div id="dot-1" className="dot h-[1.875rem] w-[1.875rem] rounded-full bg-motion absolute z-5 inset-0" />
        <div id="dot-2" className="dot h-[1.875rem] w-[1.875rem] rounded-full bg-strategy absolute z-4 inset-0" />
        <div id="dot-3" className="dot h-[1.875rem] w-[1.875rem] rounded-full bg-web-design-development absolute z-3 inset-0" />
        <div id="dot-4" className="dot h-[1.875rem] w-[1.875rem] rounded-full bg-branding-design absolute z-2 inset-0" />
        <div id="dot-5" className="dot h-[1.875rem] w-[1.875rem] rounded-full bg-templates absolute z-1 inset-0" />
      </div>
    </div>
  )
}