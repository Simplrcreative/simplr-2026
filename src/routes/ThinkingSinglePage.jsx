import { useEffect, useMemo, useRef } from 'react'
import { Link, useLoaderData} from 'react-router-dom'
import Seo from '../components/Seo.jsx'
import { buildThinkingSingleSeo } from '../lib/page-seo.js'
import CategoryBadge from '../components/CategoryBadge.jsx'
import RichText from '../components/RichText.jsx'
import { createNextWorkAnimation, createSlideUpAnimations, refreshScrollTriggers } from '../lib/animations/index.js'
import { buildCollectionPath, buildEntryPath, buildThinkingFilterPath, getThinkingTopicSlug } from '../lib/wp-api.js'
import PictureImg from '../components/PictureImg.jsx'

function categoryToFilterSlug(category) {
  const bySlug = String(category?.slug || '').trim().toLowerCase()
  if (bySlug) return bySlug

  return String(category?.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function ThinkingSinglePage() {
  const pageRef = useRef(null)
  const postContentRef = useRef(null)
  const { slug, page, posts = [] } = useLoaderData() ?? {}
  const title = page?.title || 'Untitled'
  const date = page?.date
    ? new Date(page.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    : ''
  const content = page?.content || ''
  const topicSlug = getThinkingTopicSlug(page)
  const pathname = page?.slug
    ? buildEntryPath('thinking', page.slug, { topicSlug })
    : buildCollectionPath('thinking')
  const categories = page?.topics?.nodes ?? []
  const author = page?.acfPostBuilder?.acfAuthor?.nodes[0]?.name || page?.author?.node?.name || ''
  const profileImageSizes = page?.acfPostBuilder?.acfAuthor?.nodes[0]?.acfUserBuilder?.acfProfileImage?.node?.mediaDetails?.sizes
    || page?.author?.node?.acfUserBuilder?.acfProfileImage?.node?.mediaDetails?.sizes
    || []
  const profileImage = profileImageSizes.find((size) => size?.name === 'thumbnail')?.sourceUrl
    || profileImageSizes.find((size) => size?.name === 'medium')?.sourceUrl
    || profileImageSizes[0]?.sourceUrl
    || ''

  const seo = buildThinkingSingleSeo(page, pathname)

  useEffect(() => {
    const cleanupNextWork = createNextWorkAnimation()
    return () => {
      cleanupNextWork?.()
    }
  }, [])

  useEffect(() => {
    const cleanupSlideUp = createSlideUpAnimations(pageRef.current)
    const timer = setTimeout(() => refreshScrollTriggers(), 250)

    return () => {
      clearTimeout(timer)
      cleanupSlideUp?.()
    }
  }, [content, page, posts, slug])

  useEffect(() => {
    const root = postContentRef.current
    if (!root) return undefined

    const listeners = []
    const groups = root.querySelectorAll('.service-accordion-list, [data-accordion-group]')

    function setupGroup(group) {
      const items = Array.from(group.querySelectorAll('.service-accordion-item'))
      if (items.length === 0) return

      items.forEach((item) => {
        const trigger = item.querySelector('.service-accordion-trigger')
        const panel = item.querySelector('.service-accordion-panel')
        const symbol = item.querySelector('.service-accordion-symbol')
        const initialOpen = item.classList.contains('is-open')

        if (!trigger || !panel) {
          return
        }

        trigger.setAttribute('aria-expanded', String(initialOpen))
        panel.setAttribute('aria-hidden', String(!initialOpen))
        if (symbol) {
          symbol.textContent = initialOpen ? '-' : '+'
        }

        const onClick = () => {
          const isOpen = item.classList.contains('is-open')

          items.forEach((candidate) => {
            const candidateTrigger = candidate.querySelector('.service-accordion-trigger')
            const candidatePanel = candidate.querySelector('.service-accordion-panel')
            const candidateSymbol = candidate.querySelector('.service-accordion-symbol')
            candidate.classList.remove('is-open')
            candidateTrigger?.setAttribute('aria-expanded', 'false')
            candidatePanel?.setAttribute('aria-hidden', 'true')
            if (candidateSymbol) {
              candidateSymbol.textContent = '+'
            }
          })

          if (isOpen) {
            return
          }

          item.classList.add('is-open')
          trigger.setAttribute('aria-expanded', 'true')
          panel.setAttribute('aria-hidden', 'false')
          if (symbol) {
            symbol.textContent = '-'
          }
        }

        trigger.addEventListener('click', onClick)
        listeners.push(() => trigger.removeEventListener('click', onClick))
      })
    }

    if (groups.length > 0) {
      groups.forEach(setupGroup)
    } else {
      setupGroup(root)
    }

    return () => {
      listeners.forEach((removeListener) => removeListener())
    }
  }, [content])

  function getThumbnail(acfFeaturedThumbnail, preferredSize = 'large', fallbackSize = 'medium_large') {
    const thumbnailNode = acfFeaturedThumbnail?.node
    const sizes = thumbnailNode?.mediaDetails?.sizes ?? []

    return (
      sizes.find((s) => s.name === preferredSize)?.sourceUrl ??
      sizes.find((s) => s.name === fallbackSize)?.sourceUrl ??
      thumbnailNode?.guid ??
      ''
    )
  }
  const loaderThumb = getThumbnail(page.acfPostBuilder?.acfFeaturedImage, 'loader')
  const thumb = getThumbnail(page.acfPostBuilder?.acfFeaturedImage)

  const morePosts = useMemo(() => {
    const others = posts.filter((p) => p.slug !== slug)
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]]
    }
    return others.slice(0, 4)
  }, [posts, slug])
  const linkedWork = page?.acfPostBuilder?.acfLinkedWork?.nodes ?? []
  let linkedWorkLoader = ''
  let linkedWorkThumbnail = ''
  let linkedWorkCategories = ''
  let linkedWorkClient = ''
  if(linkedWork.length > 0) {
    //linkedWorkThumbnail = linkedWork[0].acfWorkBuilder?.acfFeaturedThumbnail?.node?.guid || ''
    linkedWorkLoader= getThumbnail(linkedWork[0].acfWorkBuilder?.acfFeaturedThumbnail, 'loader')
    linkedWorkThumbnail = getThumbnail(linkedWork[0].acfWorkBuilder?.acfFeaturedThumbnail)
    linkedWorkCategories = linkedWork[0].acfWorkBuilder?.acfCategory?.nodes || []
    linkedWorkClient = linkedWork[0].acfWorkBuilder?.acfClient?.nodes?.[0]?.name || ''
  }

  return (
    <>
      <div ref={pageRef}>
      <Seo {...seo} />

      <section className="post-hero px-5 py-20 bg-white section-light min-h-screen flex items-end">
        <div className="grid grid-cols-12 w-full">
          <div className="col-start-1 md:col-start-3 col-span-12 md:col-span-8 text-coffee mt-40 flex flex-col items-center change-logo-back">
              <div className="eyebrow">Thinking {categories.length > 0 && (
                categories.map((category) => {
                  const filterSlug = categoryToFilterSlug(category)
                  if (!filterSlug) return null

                  return (
                    <Link key={category.slug ?? category.name} to={buildThinkingFilterPath(filterSlug)} title={category.name}>
                      <CategoryBadge name={category.name} />
                    </Link>
                  )
                })
              )}</div>
              <h1 className="hero-title text-center"><span>{title}</span></h1>
              {date && (
                <div className="mt-10 text-[0.875rem] flex justify-center items-center gap-5">
                  <div>{date}</div>
                  {profileImage ? (
                    <img
                        src={profileImage}
                        alt={author || 'Author profile image'}
                        className="w-[4.25rem] h-[4.25rem] rounded-full object-cover"
                        loading="lazy"
                      />
                  ) : null}
                  <div>{author}</div>
                </div>
              )}
          </div>
          {thumb && ( 
          <div className="col-start-1 md:col-start-4 col-span-12 md:col-span-6 pt-20">
            <div className="ratio overflow-hidden rounded-[10px]" style={{ '--aspect-ratio-desktop': '54%', '--aspect-ratio-mobile': '54%' }} >
              <PictureImg
                loaderSrc = {loaderThumb + '.webp'}
                mobileSrc = {thumb + '.webp'}
                desktopSrc = {thumb + '.webp'}
                imgClass = ''
                altText = ''
              />
            </div>
          </div>
          )}
        </div>
      </section>

      <section className="post-content px-5 pb-20 bg-white section-light slide-up-subtle">
        <div className="grid grid-cols-12 w-full">
          <div ref={postContentRef} className="col-start-1 md:col-start-4 col-span-12 md:col-span-6">
            
            {content && (
            <RichText html={content} />
            )}
          </div>
        </div>
      </section>

      {linkedWork.length > 0 && (
        
      <section className="next-work px-5 py-20 bg-white section-light relative overflow-hidden">
        <div className="grid grid-cols-12 relative z-1">
            <div className="col-start-1 md:col-start-5 col-span-12 md:col-span-4 pt-20">
              <div className="client-work">
                <Link
                  to={buildEntryPath('work', linkedWork[0].slug)}
                  className="client-work-img overflow-hidden rounded-[10px] block alt-transition-img"
                  data-card-key={linkedWork[0].slug}
                  data-transition-variant="work-next"
                >
                  <div className="ratio overflow-hidden rounded-[10px]" style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '90%' }} >
                    <PictureImg
                      loaderSrc = {linkedWorkLoader + '.webp'}
                      mobileSrc = {linkedWorkThumbnail + '.webp'}
                      desktopSrc = {linkedWorkThumbnail + '.webp'}
                      imgClass = ''
                      altText = {linkedWork[0].title}
                    />
                  </div>
                  
                </Link>
              </div>
              <div className="work-featured__meta mt-3">
                  <h3 className="work-card__title alt-transition-txt">{linkedWorkClient}</h3>
                  {linkedWorkCategories.length > 0 && (
                    <div className="work-card__categories mt-3 flex flex-wrap">
                      {linkedWorkCategories.map(({ name }) => <CategoryBadge key={name} name={name} />)}
                    </div>
                  )}
                </div>
            </div>
        </div>
        <div className="next-title-wrapper ">
          <div className="next-title text-coffee min-h-[600px]" >
            View Case Study
          </div>
        </div>
      </section>
      )}

      {morePosts.length > 0 && (
        <section className="more-posts px-5 py-20 bg-white section-dark">
          <div className="thinking-posts-grid">
            {morePosts.map((post) => {
              const postLoader = getThumbnail(post.acfPostBuilder?.acfFeaturedImage, 'loader')
              const postThumb = getThumbnail(post.acfPostBuilder?.acfFeaturedImage)
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
                    <div className="ratio overflow-hidden rounded-[10px]" style={{ '--aspect-ratio-desktop': '128%', '--aspect-ratio-mobile': '54%' }} >
                      <PictureImg
                        loaderSrc = {postLoader + '.webp'}
                        mobileSrc = {postThumb + '.webp'}
                        desktopSrc = {postThumb + '.webp'}
                        imgClass = ''
                        altText = {postTitle}
                        attributes = {{ 'data-post-image-frame': true }}
                      />
                    </div>
                    <h2 className="thinking-post__title pe-10" data-post-title>{postTitle}</h2>
                  </Link>
                </article>
              )
            })}
          </div>
        </section>
      )}
      </div>
    </>
  )
}
