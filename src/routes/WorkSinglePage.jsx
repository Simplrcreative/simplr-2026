import { Fragment } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import Seo from '../components/Seo.jsx'
import RichText from '../components/RichText.jsx'
import CategoryBadge from '../components/CategoryBadge.jsx'

export default function WorkSinglePage() {
  const { work } = useLoaderData() ?? {}
  const title = work?.title || 'Work'
  const pathname = work?.slug ? `/work/${work.slug}` : '/work'
  const categories = work?.acfWorkBuilder?.acfCategory?.nodes ?? []
  const thumbnail = work?.thumbnail || ''
  const types = work?.acfWorkBuilder?.acfType?.nodes ?? []
  const sections = work?.acfWorkBuilder?.acfSections || []

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
          <div className="col-start-1 col-span-5 text-coffee mt-40 max-w-[115ch] flex flex-col justify-between">
            <div>
              <div className="eyebrow">{work?.acfWorkBuilder?.acfClient?.nodes?.[0]?.name || ''}</div>
              <h1 className="hero-title"><span>{title}</span></h1>
            </div>
            {categories.length > 0 && (
              <div className="categories mt-3 flex flex-wrap gap-0">
                {categories.map(({ name }) => <CategoryBadge key={name} name={name} />)}
              </div>
            )}
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

      <section className="work-intro px-5 py-20">
        <div className="grid grid-cols-12">
          <div className="work-types col-start-1 col-span-6">
             {types.map(({ name }, index) => {
              const insertBreak = (index + 1) % 3 === 0 && index < types.length - 1
              return (
                <Fragment key={name}>
                  <span className={`work-type${insertBreak ? ' work-type--line-end' : ''}`}>
                    {name}
                  </span>
                  {insertBreak && <br />}
                </Fragment>
              )
             })}
          </div>
          <div className="col-start-7 col-span-6">
            
          </div>
        </div>
      </section>
      
      {Array.isArray(sections) && sections.map((section, index) => {
        const layout = section?.acfLayout || ''
        const alignment = section?.acfAlignment || ''
        let txtOrder, imgOrder
        if (alignment === 'right') {
          txtOrder = 'order-1'
          imgOrder = 'order-2'
        } else {
          txtOrder = 'order-2'
          imgOrder = 'order-1'
        }
        const content = section?.acfContent || ''
        const getSizeUrl = (field) =>
          field?.node?.mediaDetails?.sizes?.find((s) => s.name === 'large')?.sourceUrl
          || field?.node?.mediaDetails?.sizes?.[0]?.sourceUrl
          || ''
        const image1 = getSizeUrl(section?.acfImage1)
        const image2 = getSizeUrl(section?.acfImage2)

        return (
          <section key={`section-${index}`} className="work-content px-5 py-20">
            <div className="grid grid-cols-12">
              {layout === 'Text Only' && (
                <div className="col-span-12">
                  <RichText html={content} />
                </div>
              )}
              {layout === 'Image & Text' && (
                <>
                  <div className={`col-start-1 col-span-6 ${txtOrder}`}>
                    <RichText html={content} />
                  </div>
                  <div className={`col-start-7 col-span-6 ${imgOrder}`}>
                    {image1 && <img src={image1} alt="" />}
                  </div>
                </>
              )}
              {layout === 'Two Images' && (
                <>
                  <div className="col-start-1 col-span-6">
                    {image1 && <img src={image1} alt="" />}
                  </div>
                  <div className="col-start-7 col-span-6">
                    {image2 && <img src={image2} alt="" />}
                  </div>
                </>
              )}
              {layout === 'Full Image' && (
                <div className="col-span-12">
                  {image1 && <img src={image1} alt="" />}
                </div>
              )}
            </div>
          </section>
        )
      })}
    </>
  )
}
