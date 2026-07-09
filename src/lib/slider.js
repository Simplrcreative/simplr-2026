import { lenisScrollTo } from './animations/smooth-scroll.js'

export function initSlider(slider) {
  if (!slider) return () => undefined

  const cursor = slider.querySelector('.cursor')
  const progress = slider.querySelector('[data-slider-progress]')
  const currentEl = slider.querySelector('[data-slider-current]')
  const dragHint = slider.querySelector('[data-slider-drag-hint]')
  const slideEls = Array.from(slider.querySelectorAll('.slide'))
  const N = slideEls.length
  if (!N) return () => undefined

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isMobile = window.matchMedia('(max-width: 768px)').matches

  let index = 0
  let W = slider.clientWidth

  let targetX = 0; let midX = 0; let currentX = 0
  let prevX = 0
  let mouseX = 0; let mouseY = 0; let curX = 0; let curY = 0
  let cursorSeeded = false

  const STAGE_ONE = reduceMotion ? 1 : 0.045
  const STAGE_TWO = reduceMotion ? 1 : 0.075
  const CURSOR_EASE = reduceMotion ? 1 : 0.14
  const CLICK_DELAY = reduceMotion ? 0 : 220

  const PARALLAX = isMobile ? 0.12 : 0.28
  const ZOOM_MAX = isMobile ? 0 : 0.055
  const ZOOM_GAIN = 0.0022

  const lerp = (a, b, t) => a + (b - a) * t
  const wrapIndex = (i) => ((i % N) + N) % N

  let pendingTimer = null
  let zoom = 0
  let running = false
  let rafId = null
  let dragging = false; let dragMoved = false
  let dragStartX = 0; let dragBase = 0
  let lastMoveX = 0; let lastMoveT = 0; let flickV = 0
  let hintShown = true

  function updateHud() {
    if (currentEl) currentEl.textContent = String(wrapIndex(index) + 1).padStart(2, '0')
    if (progress) progress.style.width = `${((wrapIndex(index) + 1) / N) * 100}%`
  }

  function goTo(i, delayed) {
    index = i
    updateHud()
    clearTimeout(pendingTimer)
    if (delayed) {
      pendingTimer = setTimeout(() => { targetX = -index * W }, CLICK_DELAY)
    } else {
      targetX = -index * W
    }
  }

  function centerSliderInViewport() {
    const rect = slider.getBoundingClientRect()
    const delta = rect.top + rect.height / 2 - window.innerHeight / 2
    if (Math.abs(delta) < 1) return
    lenisScrollTo(slider, {
      offset: -((window.innerHeight - rect.height) / 2),
      immediate: reduceMotion,
      force: true,
    })
  }

  function raf() {
    if (!running) return

    midX = lerp(midX, targetX, dragging ? 0.4 : STAGE_ONE)
    currentX = lerp(currentX, midX, dragging ? 0.5 : STAGE_TWO)

    const velocity = Math.abs(currentX - prevX)
    prevX = currentX
    const zoomTarget = Math.min(velocity * ZOOM_GAIN, ZOOM_MAX)
    zoom = lerp(zoom, zoomTarget, 0.08)

    const total = N * W
    slideEls.forEach((slide, i) => {
      let x = (i * W + currentX) % total
      if (x > total / 2) x -= total
      if (x < -total / 2) x += total
      slide.style.transform = `translate3d(${x}px,0,0)`
      if (slide.firstElementChild) {
        slide.firstElementChild.style.transform = `translate3d(${x * PARALLAX}px,0,0) scale(${1 + zoom})`
      }
    })

    if (!isMobile && cursor) {
      curX = lerp(curX, mouseX, CURSOR_EASE)
      curY = lerp(curY, mouseY, CURSOR_EASE)
      cursor.style.transform = `translate3d(${curX}px,${curY}px,0)`
    }

    rafId = requestAnimationFrame(raf)
  }

  const intersectionObserver = new IntersectionObserver((entries) => {
    const visible = entries[0]?.isIntersecting
    if (visible && !running) {
      running = true
      rafId = requestAnimationFrame(raf)
    }
    if (!visible) {
      running = false
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, { threshold: 0.05 })
  intersectionObserver.observe(slider)

  const onMouseMove = (e) => {
    mouseX = e.clientX; mouseY = e.clientY
    if (!cursorSeeded) { curX = mouseX; curY = mouseY; cursorSeeded = true }
    cursor?.classList.add('active')
    cursor?.classList.toggle('flip', e.clientX < slider.getBoundingClientRect().left + W / 2)
  }
  const onMouseLeave = () => cursor?.classList.remove('active')
  const onMouseDown = () => { dragMoved = false }
  const onClick = (e) => {
    if (dragMoved) return
    const rect = slider.getBoundingClientRect()
    const leftHalf = e.clientX < rect.left + W / 2
    goTo(leftHalf ? index - 1 : index + 1, true)
    centerSliderInViewport()
    if (cursor) {
      cursor.classList.remove('pulse')
      void cursor.offsetWidth
      cursor.classList.add('pulse')
    }
  }

  if (!isMobile) {
    slider.addEventListener('mousemove', onMouseMove)
    slider.addEventListener('mouseleave', onMouseLeave)
    slider.addEventListener('mousedown', onMouseDown)
    slider.addEventListener('click', onClick)
  }

  const onTouchStart = (e) => {
    dragging = true; dragMoved = false
    dragStartX = e.touches[0].clientX
    dragBase = currentX
    midX = currentX
    targetX = currentX
    lastMoveX = dragStartX
    lastMoveT = performance.now()
    flickV = 0
    clearTimeout(pendingTimer)
  }

  const onTouchMove = (e) => {
    if (!dragging) return
    const x = e.touches[0].clientX
    const dx = x - dragStartX
    if (Math.abs(dx) > 6) dragMoved = true
    targetX = dragBase + dx

    const now = performance.now()
    const dt = now - lastMoveT
    if (dt > 0) flickV = (x - lastMoveX) / dt
    lastMoveX = x; lastMoveT = now

    if (hintShown && dragHint) {
      hintShown = false
      dragHint.classList.add('hide')
    }
  }

  const onTouchEnd = () => {
    if (!dragging) return
    dragging = false
    if (!dragMoved) return
    const projected = targetX + flickV * 180
    index = Math.round(-projected / W)
    goTo(index, false)
  }

  slider.addEventListener('touchstart', onTouchStart, { passive: true })
  slider.addEventListener('touchmove', onTouchMove, { passive: true })
  slider.addEventListener('touchend', onTouchEnd)

  slider.setAttribute('tabindex', '0')
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      goTo(index + 1, true)
      centerSliderInViewport()
    }
    if (e.key === 'ArrowLeft') {
      goTo(index - 1, true)
      centerSliderInViewport()
    }
  }
  slider.addEventListener('keydown', onKeyDown)

  const onResize = () => {
    W = slider.clientWidth
    targetX = -index * W
    midX = targetX; currentX = targetX; prevX = targetX
  }
  window.addEventListener('resize', onResize)

  updateHud()

  return () => {
    running = false
    if (rafId) cancelAnimationFrame(rafId)
    clearTimeout(pendingTimer)
    intersectionObserver.disconnect()
    slider.removeEventListener('touchstart', onTouchStart)
    slider.removeEventListener('touchmove', onTouchMove)
    slider.removeEventListener('touchend', onTouchEnd)
    slider.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('resize', onResize)
    if (!isMobile) {
      slider.removeEventListener('mousemove', onMouseMove)
      slider.removeEventListener('mouseleave', onMouseLeave)
      slider.removeEventListener('mousedown', onMouseDown)
      slider.removeEventListener('click', onClick)
    }
  }
}