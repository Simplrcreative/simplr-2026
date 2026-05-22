import { useLoaderData } from 'react-router-dom'
import Seo from '../components/Seo.jsx'
import CategoryBadge from '../components/CategoryBadge.jsx'
import RichText from '../components/RichText.jsx'

export default function ThinkingSinglePage() {
  const { slug, page } = useLoaderData() ?? {}
  const title = page?.title || 'Unititled'
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
  console.log(page)

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

      <section className="more-posts px-5 py-20 bg-white section-dark">
        
      </section>
    </>
  )
}
