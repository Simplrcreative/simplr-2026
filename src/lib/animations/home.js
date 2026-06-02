import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let pluginsRegistered = false

function registerPlugins() {
    if (!pluginsRegistered) {
        gsap.registerPlugin(ScrollTrigger)
        pluginsRegistered = true
    }
}

export function setIntroHeroInitialState(section) {
    if (!section) return

    const heroVideo = section.querySelector('.hero-video')
    const heroTitle = section.querySelector('.hero-title')

    if (heroVideo) {
        gsap.set(heroVideo, {
            autoAlpha: 0,
            scale: 0.1,
            transformOrigin: 'bottom right',
            willChange: 'transform, opacity',
        })
    }

    if (heroTitle) {
        gsap.set(heroTitle, {
            autoAlpha: 0,
            y: 200,
            willChange: 'transform, opacity',
        })
    }
}

export function createIntroVideoAnimation(section) {
    if (!section) return () => undefined

    const heroVideo = section.querySelector('.hero-video')
    if (!heroVideo) return () => undefined

    gsap.set(heroVideo, {
        autoAlpha: 0,
        scale: 0.1,
        transformOrigin: 'bottom right',
        willChange: 'transform, opacity',
    })

    const heroVideoIntro = gsap.to(heroVideo, {
        autoAlpha: 1,
        scale: 1,
        duration: 1,
        delay: 0.75,
        ease: 'power4.out',
        overwrite: 'auto',
        clearProps: 'opacity,visibility,transform,willChange',
    })

    return () => {
        heroVideoIntro.kill()
        gsap.set(heroVideo, { clearProps: 'opacity,visibility,transform,willChange' })
    }
}

export function createIntroHeroTitleAnimation(section) {
    if (!section) return () => undefined

    const heroTitle = section.querySelector('.hero-title')
    if (!heroTitle) return () => undefined

    gsap.set(heroTitle, {
        autoAlpha: 0,
        filter: 'blur(20px)',
        y: 200,
        willChange: 'transform, opacity',
    })

    const heroTitleIntro = gsap.to(heroTitle, {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1.5,
        delay: 1,
        ease: 'power4.out',
        overwrite: 'auto',
        clearProps: 'opacity,visibility,transform,willChange',
    })

    return () => {
        heroTitleIntro.kill()
        gsap.set(heroTitle, { clearProps: 'opacity,visibility,transform,willChange' })
    }
}

/**
 * Scrubs the home showreel title from right to left while the landing section
 * enters the viewport, matching the "Next Case Study" movement pattern.
 */
export function createShowreelScrollAnimation(scope) {
    registerPlugins()

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

    const section = scope?.matches?.('section.landing') ? scope : scope?.querySelector?.('section.landing')
    const title = section?.querySelector('.show-title')

    if (!section || !title) return () => {}

    let st = null
    let tween = null

    function setup() {
        const titleWidth = title.offsetWidth
        const viewportWidth = window.innerWidth
        const startX = (viewportWidth + titleWidth) / 1.5
        const endX = -startX / 1.5

        tween?.kill()
        st?.kill()

        gsap.set(title, { clearProps: 'x', startX })

        tween = gsap.fromTo(
            title,
            { x: startX },
            { x: endX, ease: 'none', paused: true },
        )

        st = ScrollTrigger.create({
            trigger: section,
            start: 'top 20%',
            end: () => `+=${Math.round(Math.max(window.innerHeight * 1.8, 480))}`,
            scrub: 4,
            animation: tween,
            invalidateOnRefresh: true,
            //markers: true
        })
    }

    if (document.documentElement.classList.contains('page-transitioning')) {
        window.addEventListener('page-transition:complete', setup, { once: true })
    } else {
        setup()
    }

    return () => {
        window.removeEventListener('page-transition:complete', setup)
        st?.kill()
        tween?.kill()
        gsap.set(title, { clearProps: 'x' })
    }
}