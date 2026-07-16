import { useEffect, useRef } from 'react'
import { useLoaderData } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Seo from '../components/Seo.jsx'
import { buildStaticPageSeo } from '../lib/page-seo.js'
import { serviceCatalogSchema } from '../lib/seo.js'
import { createSplitTextAnimation, createBtnHoverAnimation } from '../lib/animations/index.js'
import { buildCollectionPath, buildEntryPath } from '../lib/wp-api.js'
import { routeDefinitions } from '../config/site.js'
import { Link } from 'react-router-dom'
import RichHeading from '../components/RichHeading.jsx'
import RichText from '../components/RichText.jsx'
import {
  releaseMobileServiceVideo,
  requestMobileServiceVideoPlay,
} from '../lib/service-video-playback.js'

gsap.registerPlugin(ScrollTrigger)

const SERVICE_COLORS = {
  strategy: 'var(--color-strategy)',
  branding: 'var(--color-branding-design)',
  web: 'var(--color-web-design-development)',
  motion: 'var(--color-motion)',
  template: 'var(--color-templates)',
}

function toSlug(str = '') {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // strip &, punctuation, etc.
    .trim()
    .replace(/\s+/g, '-')
}

function getServiceColor(serviceName = '') {
  const lower = serviceName.toLowerCase()
  const key = Object.keys(SERVICE_COLORS).find((k) => lower.includes(k))
  return key ? SERVICE_COLORS[key] : 'var(--color-coffee)'
}

function ServiceLabelIcon({ color }) {
  return (
    <span className="service-label-icon" style={{ '--service-accent': color }}>
      <span className="service-label-icon__circle service-label-icon__circle--left" />
      <span className="service-label-icon__circle service-label-icon__circle--right" />
    </span>
  )
}

function ServiceVideo({ src, poster, title, to }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return undefined

    const isMobile = window.matchMedia('(max-width: 767.9px)').matches
    const observers = []

    const pauseVideo = () => {
      if (isMobile) {
        releaseMobileServiceVideo(video)
        return
      }

      video.pause()
    }

    const playVideo = () => {
      if (document.hidden) return

      if (isMobile) {
        requestMobileServiceVideoPlay(video)
        return
      }

      video.play().catch(() => {})
    }

    if (isMobile) {
      // Mobile: load and play only while sufficiently in view; one clip at a time.
      const mobileObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            if (video.preload === 'none') {
              video.preload = 'auto'
            }
            playVideo()
          } else {
            pauseVideo()
          }
        },
        { threshold: 0.5, rootMargin: '0px' },
      )

      mobileObserver.observe(video)
      observers.push(mobileObserver)
    } else {
      const preloadObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            video.preload = 'auto'
            video.load()
            preloadObserver.disconnect()
          }
        },
        { rootMargin: '300px 0px', threshold: 0 },
      )

      const playObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            playVideo()
          } else {
            pauseVideo()
          }
        },
        { threshold: 0.3 },
      )

      preloadObserver.observe(video)
      playObserver.observe(video)
      observers.push(preloadObserver, playObserver)
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        pauseVideo()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      observers.forEach((observer) => observer.disconnect())
      document.removeEventListener('visibilitychange', onVisibilityChange)
      pauseVideo()
    }
  }, [src])

  return (
    <Link
      to={to}
      className="service-card__video col-start-1 md:col-start-4 lg:col-start-8 col-span-8 md:col-span-8 lg:col-span-5"
      data-transition-source-key={to}
      data-transition-dock-selector="[data-transition-dock='service-featured-media']"
      aria-label={`View ${title}`}
    >
      <div
        className="service-card__media full-image overflow-hidden rounded-[10px] alt-transition-img"
        data-transition-source="media"
        data-transition-source-key={to}
        data-transition-variant="service-card"
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          title={title}
          //loop
          muted
          playsInline
          preload="none"
        />
      </div>
    </Link>
  )
}

function ServiceCard({ service }) {
  const { acfService, acfTitle, acfDescription, acfLinkToService } = service
  const linkedServicePage = acfLinkToService?.nodes?.[0] ?? null
  const videoUrl = linkedServicePage?.acfServiceBuilder?.acfFeaturedVideo?.node?.guid ?? ''
  const posterUrl = linkedServicePage?.acfServiceBuilder?.acfFeaturedImage?.node?.guid ?? ''
  const servicePath = buildEntryPath('services', toSlug(acfService))
  const accentColor = getServiceColor(acfService)
  const btnRef = useRef(null)
  useEffect(() => createBtnHoverAnimation(btnRef.current), [])

  return (
    <article className="service-card bg-white flex flex-col justify-end">
        <div className="service-card-inner pt-10 md:pt-40">
            <div className="service-card__header">
                <div className="service-card__label">
                    <ServiceLabelIcon color={accentColor} />
                    <span className="service-card__label-text">{acfService}</span>
                </div>
                <h2 className="service-card__title">{acfTitle}</h2>
            </div>

            <div className="service-card__body grid grid-cols-12">
              <div className="service-card__content col-start-1 col-span-8 md:col-start-4 md:col-span-8 lg:col-start-2 lg:col-span-5 xl:col-start-4 xl:col-span-3">
                  <div className="text-body service-card__description">{acfDescription}</div>
                  <div className="button-wrapper mt-10">
                      <Link 
                          to={servicePath}
                          ref={btnRef}
                          className="btn relative alt-transition-text"
                          data-transition-source-key={servicePath}
                          data-transition-dock-selector="[data-transition-dock='service-featured-media']"
                          >
                          <span>Explore {acfService}</span>
                      </Link>
                  </div>
                </div>
                {videoUrl && <ServiceVideo src={videoUrl} poster={posterUrl} title={acfTitle} to={servicePath} />}
            </div>
      </div>
    </article>
  )
}

export default function ServicesPage() {
  const { services, page } = useLoaderData() ?? {}
  const servicesCards = services?.acfServices || []
  const seo = buildStaticPageSeo('services', page, [
    serviceCatalogSchema(routeDefinitions.services.path, page?.sections || []),
  ])

  useEffect(() => {
    let cleanupSplitText = null
    let cardTweens = []

    // Defer heavy animations until after page transition completes
    const timer = setTimeout(() => {
      cleanupSplitText = createSplitTextAnimation()

      const cards = document.querySelectorAll('.service-card')
      cardTweens = Array.from(cards).map((card) => {
        const circle = card.querySelector('.service-label-icon__circle--right')
        if (!circle) return null
        gsap.set(circle, { x: -15 })
        return gsap.to(circle, {
          x: 0,
          duration: 0.4,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 40%',
            toggleActions: 'play none none reverse',
          },
        })
      })

      ScrollTrigger.refresh()
    }, 400)

    return () => {
      clearTimeout(timer)
      cleanupSplitText?.()
      cardTweens.forEach((t) => t?.scrollTrigger?.kill())
    }
  }, [])

  return (
    <>
      <Seo {...seo} />

      <section className="page-hero px-5 py-5 md:py-20 bg-white section-light md:min-h-[75vh] flex flex-col md:items-end">
        <div className="grid grid-cols-12 w-full grid-rows-[30px_auto]">
          <div className="col-span-12 change-logo-back" aria-hidden="true" />
          <div className="col-span-12 md:col-span-9 text-coffee change-logo mt-50 mb-5 md:mt-40 md:mb-0 max-w-[90ch]">
            <div className="eyebrow">{services.acfHeading}</div>
            <RichHeading as="h1" html={services.acfIntroductionLead} className="hero-title" />
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 bg-white section-light ">
        <div className="grid grid-cols-12">
          <div className="col-start-1 md:col-start-2 lg:col-start-4 col-span-12 md:col-span-8 lg:col-span-5 text-coffee pt-20">
            <RichText html={services.acfIntroduction} className="lead split-text-coffee trigger-split-text-coffee" />
          </div>
        </div>
      </section>

      <section className="services-cards bg-white section-light">
        {servicesCards.map((service, i) => (
          <ServiceCard key={i} service={service} />
        ))}
      </section>

      <section className="bg-white py-20 relative z-3"></section>
    </>
  )
}
