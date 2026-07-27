import { useLoaderData, useLocation } from 'react-router-dom'
import Seo from '../components/Seo.jsx'
import RichText from '../components/RichText.jsx'

export default function DefaultPage() {
  const { page } = useLoaderData() ?? {}
  const { pathname } = useLocation()
  const title = page?.title || 'Untitled'
  const content = page?.content || ''

  return (
    <>
      <Seo
        title={title || 'Thinking'}
        description=""
        pathname={pathname}
      />

      <section className="post-hero px-5 py-20 bg-white section-light lg:min-h-[75vh] flex flex-col md:items-end">
        <div className="grid grid-cols-12 w-full grid-rows-[30px_auto]">
          <div className="col-span-12 change-logo-back" aria-hidden="true" />
          <div className="col-start-3 col-span-8 text-coffee mt-30 md:mt-20 change-logo flex flex-col items-center">
              <div className="eyebrow"></div>
              <h1 className="hero-title text-center"><span>{title}</span></h1>
          </div>
        </div>
      </section>

      <section className="post-content text-body px-3 md:px-5 pb-20 bg-white section-light">
        <div className="grid grid-cols-12 w-full">
          <div className="col-start-1 col-span-12 md:col-start-4 md:col-span-6">
            
            {content && (
            <RichText html={content} />
            )}
          </div>
        </div>
      </section>
    </>
  )
}
