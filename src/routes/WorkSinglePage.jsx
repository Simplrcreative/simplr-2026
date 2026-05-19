import { useLoaderData } from 'react-router-dom'
import Seo from '../components/Seo.jsx'

function getThumbnail(acfFeaturedThumbnail, preferredSize = 'large') {
  const sizes = acfFeaturedThumbnail?.node?.mediaDetails?.sizes
  if (!sizes?.length) return ''

  return (
    sizes.find((size) => size.name === preferredSize)?.sourceUrl
    ?? sizes[sizes.length - 1]?.sourceUrl
    ?? ''
  )
}

export default function WorkSinglePage() {
  const { work } = useLoaderData() ?? {}
  const title = work?.title || 'Work'
  const pathname = work?.slug ? `/work/${work.slug}` : '/work'
  const builder = work?.acfWorkBuilder ?? {}
  const featuredImage = getThumbnail(builder.acfFeaturedThumbnail)
  const clientName = builder.acfClient?.nodes?.[0]?.name || 'Client name'

  return (
    <>
      <Seo
        title={title}
        description=""
        pathname={pathname}
      />
    
      <section className="page-hero px-5 bg-white section-light min-h-screen flex items-end">
        <div className="grid grid-cols-12">
          <div className="col-span-12 change-logo-back" />
          <div className="col-start-1 col-span-5 text-coffee change-logo mt-40 max-w-[115ch]">
            <div className="eyebrow">{clientName}</div>
            <h1 className="hero-title"><span>Evolving visual language for an AI-powered brand</span></h1>
          </div>
          <div className="col-start-8 col-span-5 change-logo section-dark">
            <div className="featured-image overflow-hidden rounded-[10px]">
              <picture className="ratio overflow-hidden bg-gray" style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '90%' }}>
                {featuredImage ? <img src={featuredImage} alt={title} /> : null}
              </picture>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
