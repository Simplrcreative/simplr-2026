import { useCallback, useEffect, useRef, useState } from 'react'
import { createPeopleMobileScroll } from '../../lib/animations/about-people-mobile.js'
import {
  getNameButtonFontClass,
  getPeopleMobileSectionMinHeight,
  getPersonInitials,
} from '../../lib/about/people-mobile-utils.js'
import { lenisScrollTo, lockScroll, unlockScroll } from '../../lib/animations/index.js'

function getThumbnail(acfProfileImage, preferredSize = 'medium', fallbackSize = 'medium_large') {
  const thumbnailNode = acfProfileImage?.node
  const sizes = thumbnailNode?.mediaDetails?.sizes ?? []

  return (
    sizes.find((s) => s.name === preferredSize)?.sourceUrl ??
    sizes.find((s) => s.name === fallbackSize)?.sourceUrl ??
    thumbnailNode?.guid ??
    ''
  )
}

export default function PeopleSectionMobile({ people = [] }) {
  const sectionRef = useRef(null)
  const listRef = useRef(null)
  const lastScrollYRef = useRef(0)
  const detailOpenRef = useRef(false)

  const [activeIndex, setActiveIndex] = useState(null)
  const [portraitVisible, setPortraitVisible] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  detailOpenRef.current = detailOpen

  const activePerson = activeIndex != null ? people[activeIndex] : null
  const detailPerson = detailOpen && activeIndex != null ? people[activeIndex] : null
  const portraitSrc = activePerson ? getThumbnail(activePerson.acfProfileImage) : ''
  const sectionMinHeight = getPeopleMobileSectionMinHeight(people.length)

  const openDetail = useCallback((index) => {
    lastScrollYRef.current = window.scrollY || document.documentElement.scrollTop || 0
    setActiveIndex(index)
    setPortraitVisible(true)
    setDetailOpen(true)
  }, [])

  const closeDetail = useCallback(() => {
    setDetailOpen(false)
    requestAnimationFrame(() => {
      lenisScrollTo(lastScrollYRef.current, { immediate: true })
    })
  }, [])

  useEffect(() => {
    if (!detailOpen) {
      unlockScroll('about-people-mobile')
      return undefined
    }

    lockScroll('about-people-mobile', { preventTouch: false })

    return () => unlockScroll('about-people-mobile')
  }, [detailOpen])

  useEffect(() => {
    if (!detailOpen) {
      return undefined
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeDetail()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [detailOpen, closeDetail])

  useEffect(() => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      return undefined
    }

    return createPeopleMobileScroll(sectionRef.current, {
      list: listRef.current,
      onActiveChange: setActiveIndex,
      onPortraitVisibilityChange: setPortraitVisible,
      isDetailOpen: () => detailOpenRef.current,
    })
  }, [people.length])

  useEffect(() => {
    if (detailOpen || !sectionRef.current) {
      return
    }

    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'))
    })
  }, [detailOpen])

  if (!people.length) {
    return null
  }

  return (
    <section
      ref={sectionRef}
      className={`people-mobile team-section bg-coffee section-dark text-white${detailOpen ? ' people-mobile--detail-open' : ''}`}
      style={{ minHeight: `${sectionMinHeight}px` }}
      aria-label="Our people"
    >
      <div className="portrait-stage" aria-hidden={!portraitVisible && !detailOpen}>
        <div className={`portrait-card${portraitVisible || detailOpen ? '' : ' is-hidden'}`}>
          <div className={`portrait-photo${portraitSrc ? ' portrait-photo--has-image' : ''}`}>
            {portraitSrc ? (
              <img src={`${portraitSrc}.webp`} alt={activePerson?.acfName ?? ''} />
            ) : null}
          </div>
          {!portraitSrc && activePerson ? (
            <span className="portrait-initials">{getPersonInitials(activePerson.acfName)}</span>
          ) : null}
        </div>
      </div>

      <div
        className="detail-panel"
        aria-hidden={!detailOpen}
      >
        <button
          className="close-button"
          type="button"
          aria-label="Close biography"
          onClick={closeDetail}
        >
          <span />
          <span />
        </button>
        {detailPerson ? (
          <>
            <div className="detail-panel__header">
              <p className="detail-role">{detailPerson.acfRole}</p>
              <h2 className="detail-name">{detailPerson.acfName}</h2>
              {detailPerson.acfExperience ? (
                <p className="detail-exp">{detailPerson.acfExperience} years exp.</p>
              ) : null}
              {detailPerson.acfLinkedIn ? (
                <a
                  href={`https://www.linkedin.com/in/${detailPerson.acfLinkedIn}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-linkedin"
                >
                  LinkedIn
                </a>
              ) : null}
            </div>
            <div className="detail-bio-scroll" data-lenis-prevent>
              <div
                className="detail-bio"
                dangerouslySetInnerHTML={{ __html: detailPerson.acfBio ?? '' }}
              />
            </div>
          </>
        ) : null}
      </div>

      <ol ref={listRef} className="name-list" aria-label="Team members">
        {people.map((person, index) => (
          <li key={person.acfName} className="name-item">
            <button
              type="button"
              className={`name-button ${getNameButtonFontClass(person.acfFont)}${activeIndex === index ? ' active' : ''}`}
              data-person-index={index}
              onClick={() => openDetail(index)}
            >
              {person.acfName}
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}
