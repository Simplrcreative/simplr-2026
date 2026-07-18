import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router-dom'
import Seo from '../components/Seo.jsx'
import PictureImg from '../components/PictureImg.jsx'
import { buildStaticPageSeo } from '../lib/page-seo.js'
import { buildEntryPath } from '../lib/wp-api.js'
import PeopleSectionMobile from '../components/about/PeopleSectionMobile.jsx'
import {
  createSplitTextAnimation,
  createBulletsAnimation,
  createBulletsStackAnimation,
  createPeopleScatterAnimation,
  createPeopleSectionClear,
  createBioAnimation,
  createHowWeWorkAnimation,
  createSlideUpAnimations,
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
  useEffect(() => createSlideUpAnimations(document.body), [])
  const { people, aboutContent, page } = useLoaderData()
  const navigate = useNavigate()
  const seo = buildStaticPageSeo('about', page)

  //const aboutContent = page?.acfAboutBuilder ?? []
  const principles = aboutContent?.acfPrinciples ?? []
  const values = aboutContent?.acfValues ?? []
  const howWeWork = aboutContent?.acfHowWeWork ?? []
  const clients = aboutContent?.acfClients ?? []
  const awards = aboutContent?.acfAwards ?? []
  const [activeBio, setActiveBio] = useState(null)
  const [bioLayoutOpen, setBioLayoutOpen] = useState(false)
  const [hoveredPerson, setHoveredPerson] = useState(null)
  const [activeValueIndex, setActiveValueIndex] = useState(0)
  const [offValueIndex, setOffValueIndex] = useState(null)
  const [resetValueIndex, setResetValueIndex] = useState(null)
  const [activeClientIndex, setActiveClientIndex] = useState(null)
  const offValueTimeoutRef = useRef(null)
  const resetValueTimeoutRef = useRef(null)

  const VALUE_CONTENT_OFF_MS = 600

  const activateValue = (index) => {
    if (index === activeValueIndex) return

    if (offValueTimeoutRef.current) {
      window.clearTimeout(offValueTimeoutRef.current)
      offValueTimeoutRef.current = null
    }
    if (resetValueTimeoutRef.current) {
      window.clearTimeout(resetValueTimeoutRef.current)
      resetValueTimeoutRef.current = null
    }

    const previousIndex = activeValueIndex
    setResetValueIndex(null)
    setOffValueIndex(previousIndex)
    setActiveValueIndex(index)

    offValueTimeoutRef.current = window.setTimeout(() => {
      // Disable transition, drop .off, then clear reset so next enter starts from below.
      setOffValueIndex(null)
      setResetValueIndex(previousIndex)
      offValueTimeoutRef.current = null

      resetValueTimeoutRef.current = window.setTimeout(() => {
        setResetValueIndex(null)
        resetValueTimeoutRef.current = null
      }, 50)
    }, VALUE_CONTENT_OFF_MS)
  }

  useEffect(() => {
    return () => {
      if (offValueTimeoutRef.current) {
        window.clearTimeout(offValueTimeoutRef.current)
      }
      if (resetValueTimeoutRef.current) {
        window.clearTimeout(resetValueTimeoutRef.current)
      }
    }
  }, [])

  const scatterRef = useRef(null)
  const overlayRef = useRef(null)
  const closeRef = useRef(null)
  const peopleSectionRef = useRef(null)
  const bulletsSectionRef = useRef(null)
  const howWeWorkSectionRef = useRef(null)

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

  // Bullets animation — tablet up gets the fade-in, mobile gets the pinned stack.
  useEffect(() => createBulletsAnimation(bulletsSectionRef.current), [])
  useEffect(() => createBulletsStackAnimation(bulletsSectionRef.current), [])

  useEffect(() => {
    if (!howWeWork.length) return undefined
    return createHowWeWorkAnimation(howWeWorkSectionRef.current)
  }, [howWeWork.length])

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
    // Locking is triggered from handlePersonClick's scroll onComplete instead
    // (see below) — locking here as soon as bioLayoutOpen flips true would call
    // Lenis's stop(), which kills that in-flight centering scroll before it
    // gets anywhere near its target. This effect only ever needs to unlock.
    if (!bioLayoutOpen) {
      unlockScroll('about-bio')
    }

    return () => unlockScroll('about-bio')
  }, [bioLayoutOpen])

  const handlePersonClick = (name) => {
    setBioLayoutOpen(true)
    setActiveBio(name)

    const section = peopleSectionRef.current
    const isDesktop = window.matchMedia('(min-width: 768px)').matches

    if (!section || !isDesktop) {
      return
    }

    // Center the section in the viewport rather than aligning its top edge —
    // min-h-screen means the section can be taller than the viewport once
    // its content (names, meta, etc.) grows, so a plain top-align no longer
    // lines up with the section's own vertically-centered content.
    const offset = (section.offsetHeight - window.innerHeight) / 2

    lenisScrollTo(section, {
      offset,
      onComplete: () => lockScroll('about-bio', { preventTouch: false }),
    })
  }

  const handlePersonEnter = (person) => {
    if (activeBio) return
    setHoveredPerson(person.acfName)
  }

  const CLIENTS_THREE_COL_THRESHOLD = 9
  const clientColumnCount = clients.length > CLIENTS_THREE_COL_THRESHOLD ? 3 : 2
  const clientsPerColumn = Math.ceil(clients.length / clientColumnCount)
  const clientColumns = Array.from({ length: clientColumnCount }, (_, columnIndex) => {
    const start = columnIndex * clientsPerColumn
    const end = start + clientsPerColumn
    return clients.slice(start, end).map((client, rowIndex) => ({
      client,
      originalIndex: start + rowIndex,
    }))
  }).filter((column) => column.length > 0)

  return (
    <>
      <Seo {...seo} />

      <section className="page-hero px-5 py-5 md:py-20 bg-coffee section-dark lg:min-h-[75vh] flex flex-col md:items-end">
        <div className="grid grid-cols-12 w-full grid-rows-[30px_auto]">
          <div className="col-span-12 change-logo-back" aria-hidden="true" />
          <div className="col-span-12 lg:col-span-7 text-white change-logo mt-50 mb-10 md:mt-40 md:mb-0 max-w-[85ch]">
            <div className="eyebrow">About</div>
            {aboutContent?.acfLandingHeading && (
              <h1
                className="hero-title"
                dangerouslySetInnerHTML={{ __html: aboutContent.acfLandingHeading }}
              />
            )}
          </div>
        </div>
      </section>

      <section className="px-5 bg-coffee section-dark">
        <div className="grid grid-cols-12">
          <div className="col-start-1 col-span-12 md:col-start-4 md:col-span-8 lg:col-start-4 lg:col-span-5 text-white">
            {aboutContent?.acfLandingLead && (
              <div
                className="lead"
                data-split-start="top 70%"
                data-split-end="top 50%"
                dangerouslySetInnerHTML={{ __html: aboutContent.acfLandingLead}}
              />
            )}
            {aboutContent?.acfLandingIntroduction && (
              <div
                className="article-content text-body mt-10 split-text trigger-split-text"
                data-split-start="top 60%"
                data-split-end="top 40%"
                dangerouslySetInnerHTML={{ __html: aboutContent.acfLandingIntroduction }}
              />
            )}
            {aboutContent?.acfTeamIntroduction && (
              <div
                className="article-content text-body mt-10 split-text trigger-split-text"
                data-split-start="top 50%"
                data-split-end="top 30%"
                dangerouslySetInnerHTML={{ __html: aboutContent.acfTeamIntroduction }}
              />
            )}
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
                {/*{person.acfExperience && <span className="person-exp">{person.acfExperience} years exp.</span>}*/}
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

      <section className="px-5 md:pt-10 md:pb-30 xl:py-20 bg-coffee section-dark slide-up-subtle">
        <div className="grid grid-cols-12">
          <div className="col-start-1 md:col-start-2 lg:col-start-4 col-span-12 md:col-span-9 lg:col-span-5 text-white">
            <div className="lead mb-5">Different disciplines. One shared standard:</div>
            {aboutContent?.acfPrinciplesHeading && (
              <h2
                className="section-heading"
                dangerouslySetInnerHTML={{ __html: aboutContent.acfPrinciplesHeading }}
              />
            )}
          </div>
        </div>
      </section>

      <section
        ref={bulletsSectionRef}
        data-mobile-animation="false"
        className="bullets px-5 py-20 bg-coffee section-dark min-h-[75vh] md:min-h-[50vh] flex items-start md:items-center overflow-hidden"
      >
        <div className="bullets-grid-inner">
          <div className="grid grid-cols-12 gap-x-5 w-full">
            <div className="col-start-1 col-span-12 md:col-start-1 md:col-span-3 mb-10 md:mb-0 lead text-white">
              Three core principles
            </div>
            <div className="col-start-1 col-span-12 md:col-start-4 md:col-span-9">
              
                <div className="bullets-grid">

                {principles.map((principle, index) => {
                  return (
                    <div id={`bullet-item-${index + 1}`} className="bullet-item" key={`${principle?.acfHeading ?? 'principle'}-${index}`}>
                      <div className={`bullet-body bg-${principle?.acfColour ?? ''}`}>
                        <h3
                          className="bullet-heading"
                          dangerouslySetInnerHTML={{ __html: principle?.acfHeading ?? '' }}
                        />
                        <div
                          className="bullet-text"
                          dangerouslySetInnerHTML={{ __html: principle?.acfContent ?? '' }}
                        />
                      </div>
                    </div>
                  )
                })}

                </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 bg-coffee section-dark values-section slide-up-subtle">
        <div className="grid grid-cols-12">
          <div className="col-start-1 col-span-12">
            <div className="lead mb-5 text-white">Our values</div>
          </div>
          <div className="col-start-1 col-span-12 md:col-span-6 lg:col-span-3 text-white">
            {values.map((value, index) => (
              <div key={`${value?.acfValue ?? 'value'}-${index}`} className="flex gap-5 align-center mb-4">
                <div className="font-literata flex flex-col items-center justify-center opacity-90">
                  {index < 9 ? `0${index + 1}` : index + 1}
                </div>
                <div
                  className={`value lead flex flex-col items-center justify-center${activeValueIndex === index ? ' active' : ''}`}
                  onMouseEnter={() => activateValue(index)}
                  onClick={() => activateValue(index)}
                  dangerouslySetInnerHTML={{ __html: value?.acfValue ?? '' }}
                >
                </div>
              </div>
            ))}
          </div>
          <div className="col-start-1 col-span-12 md:col-start-7 md:col-span-6 lg:col-start-4 lg:col-span-6 relative">
            {values.map((value, index) => {
              const isActive = activeValueIndex === index
              const isOff = offValueIndex === index
              const isReset = resetValueIndex === index

              return (
              <div
                key={`${value?.acfContent ?? 'value-content'}-${index}`}
                className={[
                  'value-content-container text-white absolute top-0 left-0',
                  isActive ? 'active' : '',
                  isOff ? 'off' : '',
                  isReset ? 'reset' : '',
                ].filter(Boolean).join(' ')}
              >
                <div
                  className="value-content lead mb-5"
                  dangerouslySetInnerHTML={{ __html: value?.acfContent ?? '' }}
                />
                <h2
                  className="value-title section-heading"
                  dangerouslySetInnerHTML={{ __html: value?.acfTitle ?? '' }}
                />
              </div>
              )
            })}
          </div>
        </div>
      </section>


      <section
        ref={howWeWorkSectionRef}
        className="hidden bg-coffee section-dark min-h-screen how-we-work-section overflow-hidden flex items-center justify-center"
      >
        <div className="grid grid-cols-12 w-full relative">
          <div className="absolute top-[50%] translate-y-[-50%] left-5">
            <div className="lead text-white">How we work</div>
          </div>
          <div className="col-start-1 col-span-12 how-we-work-stage ">
            <div className="how-we-work-track">
              {howWeWork.map((item, index) => {
                const videoSrc = item?.acfVideo?.node?.sourceUrl ?? ''
                const loaderSrc = getThumbnail(item?.acfImage, 'loader')
                const mobileSrc = getThumbnail(item?.acfImage, 'medium')
                const desktopSrc = getThumbnail(item?.acfImage, 'large')
                const hasImage = Boolean(loaderSrc || mobileSrc || desktopSrc)
                const itemKey = `${item?.acfHeading ?? 'how-we-work'}-${index}`

                return (
                  <Fragment key={itemKey}>
                    <div className="how-we-work-item-media">
                      <div className="how-we-work-media-inner">
                        {videoSrc ? (
                          <video
                            src={videoSrc}
                            title={item?.acfHeading ?? ''}
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="metadata"
                          />
                        ) : hasImage ? (
                          <PictureImg
                            loaderSrc={loaderSrc ? `${loaderSrc}.webp` : ''}
                            mobileSrc={mobileSrc ? `${mobileSrc}.webp` : ''}
                            desktopSrc={desktopSrc ? `${desktopSrc}.webp` : ''}
                            altText={item?.acfHeading ?? ''}
                          />
                        ) : null}
                      </div>
                      <div
                        className="lead how-we-work-heading"
                        dangerouslySetInnerHTML={{ __html: item?.acfHeading ?? '' }}
                      />
                    </div>
                    <div className={`how-we-work-item-content relative z-2 bg-${item?.acfColour ?? ''}`}>
                      <div
                        className="how-we-work-content"
                        dangerouslySetInnerHTML={{ __html: item?.acfContent ?? '' }}
                      />
                    </div>
                  </Fragment>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 bg-coffee section-dark clients-section slide-up-subtle">
        <div className="grid grid-cols-12 w-full">
          <div className="col-start-1 col-span-12 mb-10">
            <div className="lead text-white">Our clients</div>
          </div>
          <div
            className={`col-start-1 col-span-12 clients-list clients-list--${clientColumnCount}`}
          >
            {clientColumns.map((column, columnIndex) => (
              <div className="clients-column" key={`clients-column-${columnIndex}`}>
                {column.map(({ client, originalIndex }) => (
                  <div
                    key={`${client?.acfClient ?? 'client'}-${originalIndex}`}
                    className="client-item flex align-center justify-between gap-5 text-white"
                  >
                    <div className="flex items-center gap-5">
                      <div className="font-literata flex flex-col items-center justify-center opacity-90">
                        {originalIndex < 9 ? `0${originalIndex + 1}` : originalIndex + 1}
                      </div>
                      <div
                        className="client lead flex items-center"
                        onMouseEnter={() => setActiveClientIndex(originalIndex)}
                        onMouseLeave={() => setActiveClientIndex(null)}
                      >
                        {client?.acfClient}
                      </div>
                    </div>
                    <div className={`client-logo-container${activeClientIndex === originalIndex ? ' active' : ''}`}>
                      {client?.acfLogo && (
                        <img
                          src={client?.acfLogo?.node?.sourceUrl}
                          alt={client?.acfClient}
                          className={`client-logo ${client?.acfLogoFormat ?? 'landscape'}`}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {awards.length > 0 ? (
        <section className="px-5 py-20 bg-coffee section-dark awards-section">
          {awards.map((award, awardIndex) => {
            const projects = Array.isArray(award?.acfProjects) ? award.acfProjects : []

            return (
              <div key={`${award?.acfAward ?? 'award'}-${awardIndex}`} className="award-group slide-up-subtle mb-10 md:mb-15">
                {projects.map((project, projectIndex) => {
                  const caseStudy = project?.acfCaseStudy?.nodes?.[0]
                  const slug = caseStudy?.slug || ''
                  const client = caseStudy?.acfWorkBuilder?.acfClient?.nodes?.[0]?.name || 'Client'
                  const detail = project?.acfAwardDetails || ''
                  const year = project?.acfYear
                    ? new Date(caseStudy.date).getFullYear()
                    : ''
                  
                  return (
                    <div
                      key={`${slug}-${awardIndex}-${projectIndex}`}
                      className="award-item grid grid-cols-12 w-full text-white"
                    >
                      <div className="award-heading col-start-1 col-span-12 md:col-span-4 lead flex flex-col justify-center mb-5 md:mb-3">
                        {projectIndex === 0 ? (award?.acfAward|| '') : null}
                      </div>
                      <div className="col-start-1 md:col-start-5 col-span-12 md:col-span-2 lead flex flex-col justify-center mb-1 md:mb-3">
                        {client}
                      </div>
                      <div className="col-start-1 md:col-start-7 col-span-12 md:col-span-3 flex flex-col justify-center mb-1 md:mb-3">
                        {detail}
                      </div>
                      <div className="col-start-1 md:col-start-10 col-span-12 md:col-span-3 flex justify-between items-center mb-1 md:mb-3">
                        <div>{year}</div>
                        {slug && (
                          <div className="hidden lg:block relative min-w-[210px] h-[60px] flex items-center justify-end">
                            <Link
                              to={buildEntryPath('work', slug)}
                              className=" btn award-btn alt relative"
                              title="View case study"
                              onPointerDown={(event) => {
                                if (
                                  event.button !== 0
                                  || event.metaKey
                                  || event.ctrlKey
                                  || event.shiftKey
                                  || event.altKey
                                ) {
                                  return
                                }

                                // Document capture already snapped the page. Navigate here
                                // because the overlay can clear :hover and set pointer-events:none
                                // before the click event fires.
                                const path = buildEntryPath('work', slug)
                                event.currentTarget.dataset.transitionHover = 'true'
                                event.currentTarget.closest('.award-item')?.classList.add('hover-active')
                                navigate(path)
                              }}
                              onClick={(event) => {
                                // Navigation already started on pointerdown.
                                event.preventDefault()
                              }}
                            >
                              <span>View case study</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </section>
      ) : null}
    </>
  )
}
