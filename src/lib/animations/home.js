import { gsap } from 'gsap'

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