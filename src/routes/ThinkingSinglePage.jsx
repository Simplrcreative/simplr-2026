import { useEffect, useMemo } from 'react'
import { Link, useLoaderData} from 'react-router-dom'
import Seo from '../components/Seo.jsx'
import CategoryBadge from '../components/CategoryBadge.jsx'
import RichText from '../components/RichText.jsx'
import { createNextWorkAnimation } from '../lib/animations/index.js'
import { buildEntryPath } from '../lib/wp-api.js'

export default function ThinkingSinglePage() {

  useEffect(() => {
    const cleanupNextWork = createNextWorkAnimation()
    return () => {
      cleanupNextWork?.()
    }
  }, [])

  const { slug, page, posts = [] } = useLoaderData() ?? {}
  const title = page?.title || 'Untitled'
  const date = page?.date
    ? new Date(page.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    : ''
  const content = page?.content || ''
  const pathname = page?.slug ? `/thinking/${page?.slug}` : '/thinking'
  const categories = page?.categories?.nodes ?? []

  function getThumbnail(featuredImage, preferredSize = 'large') {
  const sizes = featuredImage?.node?.mediaDetails?.sizes
  if (sizes?.length) {
    return (
      sizes.find((size) => size.name === preferredSize)?.sourceUrl
      ?? sizes[sizes.length - 1]?.sourceUrl
      ?? featuredImage?.node?.sourceUrl
      ?? ''
    )
  }

  return featuredImage?.node?.sourceUrl ?? ''
}
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
  let linkedWorkThumbnail = ''
  let linkedWorkCategories = ''
  let linkedWorkClient = ''
  if(linkedWork.length > 0) {
    linkedWorkThumbnail = linkedWork[0].acfWorkBuilder?.acfFeaturedThumbnail?.node?.guid || ''
    linkedWorkCategories = linkedWork[0].acfWorkBuilder?.acfCategory?.nodes || []
    linkedWorkClient = linkedWork[0].acfWorkBuilder?.acfClient?.nodes?.[0]?.name || ''
  }

  return (
    <>
      <Seo
        title={title || 'Thinking'}
        description=""
        pathname={pathname}
      />

      <section className="post-hero px-5 py-20 bg-white section-light min-h-screen flex items-end">
        <div className="grid grid-cols-12 w-full">
          <div className="col-start-3 col-span-8 text-coffee mt-40 flex flex-col items-center change-logo-back">
              <div className="eyebrow">Thinking {categories.length > 0 && ( categories.map(({ name }) => <CategoryBadge key={name} name={name} />) )}</div>
              <h1 className="hero-title text-center"><span>{title}</span></h1>
              {date && (
                <p className="mt-10 text-[0.875rem]">{date}</p>
              )}
          </div>
          {thumb && ( 
          <div className="col-start-4 col-span-6 pt-20">
            <picture className="ratio overflow-hidden rounded-[10px]" style={{ '--aspect-ratio-desktop': '54%', '--aspect-ratio-mobile': '54%' }}>
              <img src={thumb} alt={title} />
            </picture>
          </div>
          )}
        </div>
      </section>

      <section className="post-content px-5 pb-20 bg-white section-light">
        <div className="grid grid-cols-12 w-full">
          <div className="col-start-4 col-span-6">
            
            {content && (
            <RichText html={content} />
            )}
          </div>
        </div>
      </section>

      {linkedWork.length > 0 && (
        
      <section className="next-work px-5 py-20 bg-white section-light relative overflow-hidden__">
        <div className="grid grid-cols-12 relative z-1">
            <div className="col-start-5 col-span-4 pt-20">
              <div className="client-work">
                <Link
                  to={`/work/${linkedWork[0].slug}`}
                  className="client-work-img overflow-hidden rounded-[10px] block alt-transition-img"
                  data-card-key={linkedWork[0].slug}
                  data-transition-variant="work-next"
                >
                  <picture
                    className="ratio overflow-hidden"
                    style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '90%' }}
                  >
                    {linkedWorkThumbnail && <img src={linkedWorkThumbnail} alt={linkedWork[0].title} />}
                  </picture>
                  
                </Link>
              </div>
              <div className="work-featured__meta mt-3">
                  <h3 className="work-card__title alt-transition-txt">{linkedWorkClient}</h3>
                  {linkedWorkCategories.length > 0 && (
                    <div className="work-card__categories mt-3 flex flex-wrap gap-2">
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
              const postThumb = getThumbnail(post.acfPostBuilder?.acfFeaturedImage)
              const postTitle = post.title ?? 'Thinking post'
              return (
                <article key={post.databaseId ?? post.slug} className="thinking-post-card" data-post-card>
                  <Link to={buildEntryPath('thinking', post.slug)} className="thinking-post-link">
                    <picture className="thinking-post__image-frame" data-post-image-frame>
                      {postThumb ? <img src={postThumb} alt={postTitle} /> : null}
                    </picture>
                    <h2 className="thinking-post__title pe-10" data-post-title>{postTitle}</h2>
                  </Link>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}
