import { useLoaderData } from 'react-router-dom'
import Seo from '../components/Seo.jsx'

export default function WorkSinglePage() {
  const { work } = useLoaderData() ?? {}
  const title = work?.title || 'Work'
  const pathname = work?.slug ? `/work/${work.slug}` : '/work'
  const thumbnail = work?.thumbnail || ''

  return (
    <>
      <Seo
        title={title}
        description=""
        pathname={pathname}
      />
    
      <section className="page-hero px-5 pb-20 bg-white section-light min-h-screen flex items-end">
        <div className="grid grid-cols-12 ">
          <div className="col-span-12 change-logo-back" />
          <div className="col-start-1 col-span-5 text-coffee mt-40 max-w-[115ch]">
            <div className="eyebrow">{work?.acfWorkBuilder?.acfClient?.nodes?.[0]?.name || ''}</div>
            <h1 className="hero-title"><span>{title}</span></h1>
          </div>
          <div className="col-start-8 col-span-5 change-logo">
            <div className="featured-image section-dark">
              {thumbnail && (
                <picture
                  className="ratio overflow-hidden rounded-[10px]"
                  style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '90%' }}
                >
                  <img src={thumbnail} alt={title} />
                </picture>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="work-content px-5 py-20">

      </section>
    </>
  )
}
