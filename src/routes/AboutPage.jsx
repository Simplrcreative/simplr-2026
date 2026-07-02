import { useEffect, useRef, useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import Seo from '../components/Seo.jsx'
import { buildStaticPageSeo } from '../lib/page-seo.js'
import PeopleSectionMobile from '../components/about/PeopleSectionMobile.jsx'
import {
  createSplitTextAnimation,
  createBulletsAnimation,
  createPeopleScatterAnimation,
  createPeopleSectionClear,
  createBioAnimation,
  lenisScrollTo,
  lockScroll,
  unlockScroll,
} from '../lib/animations/index.js'

function getThumbnail(acfFeaturedThumbnail, preferredSize = 'medium', fallbackSize = 'medium_large') {
  const thumbnailNode = acfFeaturedThumbnail?.node
  const sizes = thumbnailNode?.mediaDetails?.sizes ?? []

  return (
    sizes.find((s) => s.name === preferredSize)?.sourceUrl ??
    sizes.find((s) => s.name === fallbackSize)?.sourceUrl ??
    thumbnailNode?.guid ??
    ''
  )
}

export default function AboutPage() {
  useEffect(() => createSplitTextAnimation(), [])
  const { people, page } = useLoaderData()
  const seo = buildStaticPageSeo('about', page)

  const [activeBio, setActiveBio] = useState(null)
  const [bioLayoutOpen, setBioLayoutOpen] = useState(false)
  const [hoveredPerson, setHoveredPerson] = useState(null)

  const scatterRef = useRef(null)
  const overlayRef = useRef(null)
  const closeRef = useRef(null)
  const peopleSectionRef = useRef(null)
  const bulletsSectionRef = useRef(null)

  // Keep last active person so the overlay content doesn't vanish during close animation
  const lastPersonRef = useRef(null)
  const activePerson = people.find((p) => p.acfName === activeBio) ?? null
  if (activePerson) lastPersonRef.current = activePerson
  const displayPerson = activePerson ?? lastPersonRef.current

  // Image shown on hover, active bio, or while close animation finishes
  const displayImageName = hoveredPerson ?? activeBio ?? (bioLayoutOpen ? displayPerson?.acfName : null)

  const closeBio = () => {
    setActiveBio(null)
    setHoveredPerson(null)
  }

  // Bullets animation
  useEffect(() => createBulletsAnimation(bulletsSectionRef.current), [])

  useEffect(
    () => {
      if (!window.matchMedia('(min-width: 768px)').matches) {
        return undefined
      }

      return createPeopleScatterAnimation(peopleSectionRef.current, scatterRef.current)
    },
    [],
  )

  useEffect(
    () => {
      if (!window.matchMedia('(min-width: 768px)').matches) {
        return undefined
      }

      return createPeopleSectionClear(peopleSectionRef.current, closeBio)
    },
    [],
  )

  useEffect(() => {
    if (!window.matchMedia('(min-width: 768px)').matches) {
      return undefined
    }

    return createBioAnimation(
      scatterRef.current,
      overlayRef.current,
      closeRef.current,
      !!activeBio,
      () => setBioLayoutOpen(false),
    )
  }, [activeBio])

  useEffect(() => {
    if (!bioLayoutOpen) {
      unlockScroll('about-bio')
      return undefined
    }

    if (!window.matchMedia('(min-width: 768px)').matches) {
      return undefined
    }

    lockScroll('about-bio', { preventTouch: false })

    return () => unlockScroll('about-bio')
  }, [bioLayoutOpen])

  const handlePersonClick = (name) => {
    setBioLayoutOpen(true)
    setActiveBio(name)
    if (peopleSectionRef.current) {
      lenisScrollTo(peopleSectionRef.current)
    }
  }

  const handlePersonEnter = (person) => {
    if (activeBio) return
    setHoveredPerson(person.acfName)
  }

  return (
    <>
      <Seo {...seo} />

      <section className="page-hero px-5 py-5 md:py-20 bg-coffee section-dark min-h-[80vh] flex flex-col md:items-end">
        <div className="grid grid-cols-12 w-full grid-rows-[30px_auto]">
          <div className="col-span-12 change-logo-back" aria-hidden="true" />
          <div className="col-span-12 md:col-span-6 text-white change-logo mt-40 max-w-[85ch]">
            <div className="eyebrow">About</div>
            <h1 className="hero-title">A <span>brand and digital design agency</span> partnering with <span><i>forward-thinking</i></span> clients around the world</h1>
          </div>
        </div>
      </section>

      <section className="px-5 py-5 md:py-20 bg-coffee section-dark trigger-split-text">
        <div className="grid grid-cols-12">
          <div className="col-start-1 md:col-start-4 col-span-12 md:col-span-5 text-white md:pt-20">
            <div className="lead split-text">
              <p>Guided by creative intelligence, we bring strategy, design, development, motion, and content together to turn complexity into work people can understand, trust, and use.</p>
              <p className="mt-5">Simplr is a Cape Town-based brand identity and digital design agency working with clients in South Africa and around the world.</p>
              <p className="mt-5">Since 2014, we have helped organisations define how they look, sound, work, and grow. Our team brings strategy, identity design, UX and UI, website design and development, motion, content, templates, and project leadership into one connected process.</p>
              <p className="mt-5">The result is work with a clear idea behind it, a strong system beneath it, and the craft to hold up in the real world.</p>
            </div>
          </div>
        </div>
      </section>

      {/* People section */}
      <div id="our-people">
      <section
        ref={peopleSectionRef}
        className={`people people-desktop hidden md:flex py-10 md:py-40 bg-coffee section-dark min-h-screen relative text-white overflow-hidden flex-col justify-center items-center${bioLayoutOpen ? ' people--bio-open' : ''}${bioLayoutOpen && !activeBio ? ' people--bio-closing' : ''}${hoveredPerson && !activeBio && !bioLayoutOpen ? ' people--preview' : ''}`}
      >
        <div
          className={`people-bio-backdrop${bioLayoutOpen ? ' active' : ''}`}
          aria-hidden="true"
          onClick={closeBio}
        />

        {/* Names scatter — slides left when bio opens; z-3 sits above image (z-1) */}
        <div ref={scatterRef} className="people-scatter relative z-[1011] max-w-[98vw] flex flex-wrap items-center justify-center gap-1">
          {people.map((person) => (
            <div
              key={person.acfName}
              className={`person-item mb-4 md:mb-0 flex${hoveredPerson === person.acfName ? ' is-hovered' : ''}${person.acfAlign ? ` align-${person.acfAlign}` : ''}`}
              onMouseEnter={() => handlePersonEnter(person)}
              onMouseLeave={() => setHoveredPerson(null)}
              onTouchStart={() => handlePersonEnter(person)}
              onClick={() => handlePersonClick(person.acfName)}
            >
              <span className={`person-name ${person.acfFont ?? ''} ${person.acfDivision ?? ''}`}>
                {person.acfName}
              </span>
              <span className="hidden md:block person-meta">
                {person.acfExperience && <span className="person-exp">{person.acfExperience} years exp.</span>}
                {person.acfLinkedIn && (
                  <a
                    href={`https://www.linkedin.com/in/${person.acfLinkedIn}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="person-linkedin"
                    onClick={(e) => e.stopPropagation()}
                  >
                    LinkedIn
                  </a>
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="absolute people-grid w-full grid grid-cols-12 pointer-events-none px-5">

          {/* Image column — all images stacked; is-visible drives CSS transition */}
          <div className="people-info col-start-4 col-span-6 md:col-start-6 md:col-span-2 relative pointer-events-none" style={{ zIndex: 1 }}>
            <button
              ref={closeRef}
              className="bio-close"
              aria-label="Close bio"
              onClick={closeBio}
            >
              <svg width="20" height="20" viewBox="0 0 22 22" stroke="currentColor">
                <path d="M1 1L21 21" strokeWidth="2" strokeLinecap="round"/>
                <path d="M1 21L21 0.999998" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            {people.map((person) => {
              const src = getThumbnail(person.acfProfileImage)
              if (!src) return null
              return (
                <img
                  key={person.acfName}
                  src={src + '.webp'}
                  alt={person.acfName}
                  className={`person-hover-img${displayImageName === person.acfName ? ' is-visible' : ''}${activeBio === person.acfName ? ' is-active' : ''}`}
                />
              )
            })}
          </div>

          {/* Bio column — single panel, GSAP drives opacity + y; starts hidden */}
          <div
            ref={overlayRef}
            className="bio-overlay col-start-1 md:col-start-9 col-span-12 md:col-span-3 flex flex-col justify-start"
          >
            {displayPerson && (
              <div className="bio-content" data-lenis-prevent>
                <h3 className="bio-name">{displayPerson.acfName}</h3>
                <div className="bio-role">{displayPerson.acfRole}</div>
                {displayPerson.acfExperience && (
                  <div className="bio-exp">{displayPerson.acfExperience} years exp.</div>
                )}
                {displayPerson.acfLinkedIn && (
                  <a
                    href={`https://www.linkedin.com/in/${displayPerson.acfLinkedIn}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bio-linkedin"
                    style={{ pointerEvents: 'auto' }}
                  >
                    LinkedIn
                  </a>
                )}
                <div
                  className="bio-text"
                  dangerouslySetInnerHTML={{ __html: displayPerson.acfBio }}
                />
              </div>
            )}
          </div>

        </div>

      </section>

      <PeopleSectionMobile people={people} />
      </div>

      <section className="px-5 pb-20 bg-coffee trigger-split-text">
        <div className="grid grid-cols-12">
          <div className="col-start-1 md:col-start-2 lg:col-start-4 col-span-12 md:col-span-9 lg:col-span-5 text-white">
            <div className="lead split-text">
              <p>Simplr brings together strategists, designers, developers, project leads, and makers who work as one team.</p>
              <p className="mt-5">Our experience spans brand identity, UX and UI, website design and development, campaign systems, motion, packaging, environmental design, template systems, and large-scale brand implementation.</p>
              <p className="mt-5">Different disciplines, one shared standard: make the complex feel clear, and make the clear feel compelling.</p>
            </div>
          </div>
        </div>
      </section>

      <section ref={bulletsSectionRef} className="bullets px-5 py-20 bg-coffee section-dark min-h-[50vh] flex items-center overflow-hidden">
        <div className="grid grid-cols-12 gap-x-5 w-full">
          <div className="col-start-1 md:col-start-2 col-span-12 md:col-span-8 lg:col-span-10">
            <div className="bullets-grid">

              <div id="bullet-item-1" className="bullet-item">
                <div className="bullet-dot bullet-dot-coral" />
                <div className="bullet-body">
                  <h3 className="bullet-heading">Brand is where<br/>everything begins</h3>
                  <div className="bullet-text">
                    <p>Every project starts with understanding the brand: what it stands for, who it serves, where it is going, and why people should care.</p>
                    <p className="mt-5">That clarity shapes the strategy, identity, interface, message, motion, and technology behind the work.</p>
                  </div>
                </div>
              </div>

              <div id="bullet-item-2" className="bullet-item">
                <div className="bullet-dot bullet-dot-lavender" />
                <div className="bullet-body">
                  <h3 className="bullet-heading">Design and development,<br/>seamlessly connected</h3>
                  <div className="bullet-text">
                    <p>Our designers and developers work together from the start, so every idea is visually considered, technically sound, and built for real-world performance.</p>
                  </div>
                </div>
              </div>

              <div id="bullet-item-3" className="bullet-item">
                <div className="bullet-dot bullet-dot-lime" />
                <div className="bullet-body">
                  <h3 className="bullet-heading">Built for<br/>lasting impact</h3>
                  <div className="bullet-text">
                    <p>The work needs to adapt across teams, markets, channels, and time, while staying clear enough for people to recognise, use, and trust.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 md:pt-10 md:pb-30 xl:py-40 bg-coffee trigger-split-text">
        <div className="grid grid-cols-12">
          <div className="col-start-1 md:col-start-2 lg:col-start-4 col-span-12 md:col-span-9 lg:col-span-5 text-white">
            <div className="lead split-text">Guided by creative intelligence, we simplify complexity to help brands connect, adapt, and grow.</div>
          </div>
        </div>
      </section>

    </>
  )
}
