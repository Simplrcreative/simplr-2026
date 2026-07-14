import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLoaderData, useParams } from 'react-router-dom'
import { gsap } from 'gsap'
import Seo from '../components/Seo.jsx'
import { buildStaticPageSeo } from '../lib/page-seo.js'
import { createSplitTextAnimation, refreshScrollTriggers, refreshSmoothScroll } from '../lib/animations/index.js'
import { buildEntryPath, fetchThinkingPostsData, getThinkingTopicSlug } from '../lib/wp-api.js'
import PictureImg from '../components/PictureImg.jsx'

const FILTER_COLOR_MAP = {
  strategy: 'var(--color-strategy)',
  branding: 'var(--color-branding-design)',
  'branding-design': 'var(--color-branding-design)',
  web: 'var(--color-web-design-development)',
  'web-design-development': 'var(--color-web-design-development)',
  motion: 'var(--color-motion)',
  template: 'var(--color-templates)',
  templates: 'var(--color-templates)',
}

const LIGHT_BG_SLUGS = new Set(['strategy', 'web-design-development'])
const CARD_START_HEIGHT = 12
const THINKING_INITIAL_LOAD_SIZE = 8
const THINKING_BATCH_SIZE = 4

function getFilterColor(slug) {
  const entry = Object.entries(FILTER_COLOR_MAP).find(([key]) => slug.includes(key))
  return entry ? entry[1] : 'var(--color-coffee)'
}

function getThumbnail(acfFeaturedThumbnail, preferredSize = 'large', fallbackSize = 'large') {
  const thumbnailNode = acfFeaturedThumbnail?.node
  const sizes = thumbnailNode?.mediaDetails?.sizes ?? []

  return (
    sizes.find((s) => s.name === preferredSize)?.sourceUrl ??
    sizes.find((s) => s.name === fallbackSize)?.sourceUrl ??
    thumbnailNode?.guid ??
    ''
  )
}

function postMatchesFilter(post, filterId) {
  if (filterId === 'all') return true
  const categories = post.topics?.nodes ?? []
  return categories.some((category) => category.slug === filterId)
}

export default function ThinkingPage() {
  const { posts: initialPosts = [], page } = useLoaderData() ?? {}
  const seo = buildStaticPageSeo('thinking', page)
  const { filterSlug } = useParams()
  const postsResultsRef = useRef(null)
  const postsLoadSentinelRef = useRef(null)
  const animatedPostKeysRef = useRef(new Set())
  const [posts, setPosts] = useState(initialPosts)
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false)
  const [hasMorePosts, setHasMorePosts] = useState(true)

  useEffect(() => {
    setPosts(initialPosts)
    setHasMorePosts(initialPosts.length >= THINKING_BATCH_SIZE)
    setIsLoadingMorePosts(false)
    animatedPostKeysRef.current.clear()
  }, [initialPosts])

  const filters = useMemo(() => {
    const categoriesBySlug = new Map()

    posts.forEach((post) => {
      ;(post.topics?.nodes ?? []).forEach((category) => {
        if (!category?.slug) return
        if (!categoriesBySlug.has(category.slug)) {
          categoriesBySlug.set(category.slug, category)
        }
      })
    })

    return [
      {
        id: 'all',
        label: 'All',
        bg: 'var(--color-coffee)',
        text: '#fff',
      },
      ...Array.from(categoriesBySlug.values())
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
        .map((category) => {
          const bg = getFilterColor(category.slug)
          const text = LIGHT_BG_SLUGS.has(category.slug) ? 'var(--color-coffee)' : '#fff'

          return {
            id: category.slug,
            label: category.name ?? category.slug,
            bg,
            text,
          }
        }),
    ]
  }, [posts])

  const filterIds = useMemo(() => new Set(filters.map((filter) => filter.id)), [filters])
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    const nextFilter = filterSlug && filterIds.has(filterSlug) ? filterSlug : 'all'
    setActiveFilter(nextFilter)
  }, [filterIds, filterSlug])

  useEffect(() => {
    animatedPostKeysRef.current.clear()
  }, [activeFilter])

  const activeFilterLabel = useMemo(() => {
    if (activeFilter === 'all') return ''
    return filters.find((filter) => filter.id === activeFilter)?.label ?? ''
  }, [activeFilter, filters])

  const filteredPosts = useMemo(
    () => posts.filter((post) => postMatchesFilter(post, activeFilter)),
    [posts, activeFilter],
  )

  const loadNextPostsBatch = useCallback(async () => {
    if (isLoadingMorePosts || !hasMorePosts) {
      return
    }

    setIsLoadingMorePosts(true)
    const nextFirst = Math.max(posts.length + THINKING_BATCH_SIZE, THINKING_INITIAL_LOAD_SIZE)

    try {
      const { posts: nextPosts = [] } = await fetchThinkingPostsData({ first: nextFirst })

      if (!Array.isArray(nextPosts) || !nextPosts.length) {
        setHasMorePosts(false)
        return
      }

      if (nextPosts.length <= posts.length) {
        setHasMorePosts(false)
        return
      }

      setPosts(nextPosts)
    } catch {
      setHasMorePosts(false)
    } finally {
      setIsLoadingMorePosts(false)
    }
  }, [hasMorePosts, isLoadingMorePosts, posts.length])

  useEffect(() => {
    const sentinel = postsLoadSentinelRef.current

    if (!sentinel || !hasMorePosts) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadNextPostsBatch()
        }
      },
      {
        root: null,
        rootMargin: '0px 0px 420px 0px',
        threshold: 0,
      },
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [hasMorePosts, loadNextPostsBatch])

  useEffect(() => createSplitTextAnimation(), [])

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      refreshScrollTriggers()
      refreshSmoothScroll()
    })

    return () => cancelAnimationFrame(rafId)
  }, [activeFilter, posts.length, filteredPosts.length])

  useEffect(() => {
    const container = postsResultsRef.current
    if (!container) return

    const cards = Array.from(container.querySelectorAll('[data-post-card]'))
    if (!cards.length) return

    const newCards = cards.filter((card) => {
      const key = card.dataset.postCardKey
      return key && !animatedPostKeysRef.current.has(key)
    })

    if (!newCards.length) return

    const context = gsap.context(() => {
      newCards.forEach((card, index) => {
        const key = card.dataset.postCardKey
        const imageFrame = card.querySelector('[data-post-image-frame]')
        const title = card.querySelector('[data-post-title]')

        if (!imageFrame) return

        if (key) {
          animatedPostKeysRef.current.add(key)
        }

        const finalHeight = imageFrame.getBoundingClientRect().height
        const startHeight = CARD_START_HEIGHT

        gsap.fromTo(
          imageFrame,
          { height: startHeight, autoAlpha: 0.8 },
          {
            height: finalHeight,
            autoAlpha: 1,
            duration: 0.9,
            delay: index * 0.06,
            ease: 'power3.out',
            clearProps: 'height,opacity,visibility',
          },
        )

        if (title) {
          gsap.fromTo(
            title,
            { autoAlpha: 0, y: 18 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.6,
              delay: 0.12 + index * 0.06,
              ease: 'power2.out',
              clearProps: 'opacity,visibility,transform',
            },
          )
        }
      })
    }, container)

    return () => context.revert()
  }, [filteredPosts])

  return (
    <>
      <Seo {...seo} />

      <section className="page-hero px-5 py-5 md:py-20 bg-white section-light min-h-[80vh] flex flex-col md:items-end">
        <div className="grid grid-cols-12 w-full grid-rows-[30px_auto]">
          <div className="col-span-12 change-logo-back" aria-hidden="true" />
          <div className="col-span-12 md:col-span-9 text-coffee change-logo mt-40 max-w-[115ch]">
            <div className="eyebrow">
              Thinking
              {activeFilterLabel ? (
                <span className="category bg-white text-coffee border leading-none font-medium rounded-full mb-1 md:mb-0">{activeFilterLabel}</span>
              ) : null}
            </div>
            {/* {!activeFilterLabel ? ( */}
              <h1 className="hero-title">Our latest thinking on <span>strategy, design, and building brands</span> that connect <span><i>purpose</i></span> with <span><i>performance.</i></span></h1>
            {/* ) : null} */}
          </div>
        </div>
      </section>

      <section className="post-filter px-5 py-8 bg-white flex md:justify-end">
        <div className="flex flex-wrap gap-1">
          {filters.map(({ id, label, bg, text }) => {
            const isActive = activeFilter === id
            return (
              <button
                key={id}
                onClick={() => setActiveFilter(id)}
                className="work-filter-btn"
                data-active={isActive}
                style={isActive ? { backgroundColor: bg, color: text, borderColor: bg } : undefined}
              >
                {label}
              </button>
            )
          })}
        </div>
      </section>

      <section ref={postsResultsRef} className="posts-results px-5 pb-20 bg-white">
        <div className="thinking-posts-grid">
          {filteredPosts.map((post) => {
            const loaderThumb = getThumbnail(post.acfPostBuilder?.acfFeaturedImage, 'loader')
            const thumb = getThumbnail(post.acfPostBuilder?.acfFeaturedImage)
            const postTitle = post.title ?? 'Thinking post'

            return (
              <article
                key={post.databaseId ?? post.slug}
                className="thinking-post-card"
                data-post-card
                data-post-card-key={post.databaseId ?? post.slug}
                onMouseEnter={(event) => event.currentTarget.classList.add('hover-active')}
                onMouseLeave={(event) => event.currentTarget.classList.remove('hover-active')}
              >
                <Link
                  to={buildEntryPath('thinking', post.slug, { topicSlug: getThinkingTopicSlug(post) })}
                  className="thinking-post-link"
                  data-transition-snapshot-state="hover"
                >
                  <div className="ratio overflow-hidden rounded-[10px]" style={{ '--aspect-ratio-desktop': '128%', '--aspect-ratio-mobile': '65%' }} >
                    <PictureImg
                      loaderSrc = {loaderThumb + '.webp'}
                      mobileSrc = {thumb + '.webp'}
                      desktopSrc = {thumb + '.webp'}
                      imgClass = ''
                      altText = ''
                      attributes = {{ 'data-post-image-frame': true }}
                    />
                  </div>
                  <h2 className="thinking-post__title pe-10" data-post-title>{postTitle}</h2>
                </Link>
              </article>
            )
          })}
        </div>

        {hasMorePosts && (
          <div className="bg-white px-5 pt-20">
            <div ref={postsLoadSentinelRef} className="w-full h-px" aria-hidden="true" />
            {isLoadingMorePosts ? (
              <div className="flex justify-center" aria-label="Loading more thinking posts">
                <div className="boot-dots" aria-hidden="true">
                  <span className="boot-dot-top"></span>
                  <span className="boot-dot-mask"></span>
                  <span className="boot-dot boot-dot-1"></span>
                  <span className="boot-dot boot-dot-2"></span>
                  <span className="boot-dot boot-dot-3"></span>
                  <span className="boot-dot boot-dot-4"></span>
                  <span className="boot-dot boot-dot-5"></span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

    </>
  )
}
