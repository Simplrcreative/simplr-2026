import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function IntroOverlay({ onComplete }) {
  const overlayRef = useRef(null)
  const boxRef = useRef(null)
  const creativeRef = useRef(null)
  const intelligenceRef = useRef(null)
  const appliedRef = useRef(null)
  const onCompleteRef = useRef(onComplete)
  const hasFinishedRef = useRef(false)

  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!overlayRef.current) {
      return undefined
    }

    const overlayNode = overlayRef.current
    let timeline

    window.scrollTo(0, 0)
    document.body.style.overflow = 'hidden'

    const finishIntro = () => {
      if (hasFinishedRef.current) {
        return
      }

      hasFinishedRef.current = true
      document.body.style.backgroundColor = '#ffffff'
      document.body.style.overflow = ''
      onCompleteRef.current?.()
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishIntro()
      return undefined
    }

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { ease: 'power4.out' },
        onComplete: finishIntro,
      })

      timeline
        .set(overlayNode, { autoAlpha: 1 })
        .to(
          boxRef.current,
          { autoAlpha: 1, transformOrigin: "50% 50%", y: "-25%", x: "-50%", width: '100vw', height: '100vh', borderRadius: 0, duration: 2 },
        )
        .fromTo(
          creativeRef.current,
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 0.72, y: 0, duration: 0.55 },
          0.16,
        )

      timeline
        .to(boxRef.current, { autoAlpha: 1, y: -300, x: -600, duration: 0.5 }, '<')
        .to(creativeRef.current, { autoAlpha: 0, y: -12, duration: 0.35 }, '+=0.45')
        
        .to(overlayNode, { autoAlpha: 0, duration: 0.45, ease: 'power2.inOut' }, '-=0.08')
    }, overlayNode)

    return () => {
      document.body.style.overflow = ''
      ctx.revert()
    }
  }, [])

  return (
    <div
      ref={overlayRef}
      className="fixed z-[10] inset-0 flex items-center justify-center overflow-hidden px-6 text-white"
      aria-hidden="true"
    > 
      <div
      ref={boxRef}
      className="fixed z-[0]" 
      />
      <div className="dots flex items-center gap-1">
        <div className="dot h-[1.875rem] w-[1.875rem] rounded-full bg-white" />
        <div className="dot h-[1.875rem] w-[1.875rem] rounded-full bg-white" />
        <div className="dot h-[1.875rem] w-[1.875rem] rounded-full bg-white" />
        <div className="dot h-[1.875rem] w-[1.875rem] rounded-full bg-white" />
        <div className="dot h-[1.875rem] w-[1.875rem] rounded-full bg-white" />
        <div className="dot h-[1.875rem] w-[1.875rem] rounded-full bg-white" />
      </div>
      <div className="relative flex max-w-[42rem] flex-col items-center gap-4 text-center">
        <div
          ref={creativeRef}
          className="uppercase text-white"
        >
          Creative.
        </div>
        <div
          ref={intelligenceRef}
          className="uppercase text-white"
        >
          Intelligence.
        </div>
        <div
          ref={appliedRef}
          className="uppercase text-white"
        >
          Applied.
        </div>
      </div>
    </div>
  )
}