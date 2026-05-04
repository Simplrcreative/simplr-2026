import { gsap } from 'gsap'

/**
 * Attaches a GSAP clip-path + opacity reveal animation to a button element.
 * Expects a `.btn-text` child inside the button.
 *
 * @param {HTMLElement} btn - The button (or anchor) element with class `.btn`
 * @returns {() => void} Cleanup function that removes the event listeners
 */
export function createBtnHoverAnimation(btn) {
  if (!btn) return () => {}

  const text = btn.querySelector('.btn-text')
  if (!text) return () => {}

  const onEnter = () => {
    gsap.fromTo(
      text,
      { clipPath: 'inset(0 50% 0 50%)', opacity: 0 },
      { clipPath: 'inset(0 0% 0 0%)', opacity: 1, duration: 0.6, ease: 'power3.inOut' }
    )
  }

  const onLeave = () => {
    gsap.to(text, {
      clipPath: 'inset(0 50% 0 50%)',
      opacity: 0,
      duration: 0.6,
      ease: 'power3.inOut',
    })
  }

  btn.addEventListener('mouseenter', onEnter)
  btn.addEventListener('mouseleave', onLeave)

  return () => {
    btn.removeEventListener('mouseenter', onEnter)
    btn.removeEventListener('mouseleave', onLeave)
  }
}
