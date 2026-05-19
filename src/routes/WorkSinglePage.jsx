import { useLoaderData } from 'react-router-dom'
import Seo from '../components/Seo.jsx'

export default function WorkSinglePage() {
  const { work } = useLoaderData() ?? {}
  const title = work?.title || 'Work'
  const pathname = work?.slug ? `/work/${work.slug}` : '/work'

  return (
    <>
      <Seo
        title={title}
        description=""
        pathname={pathname}
      />
    
      <section className="page-hero px-5 pb-40 bg-white section-light min-h-screen flex items-end">
        <div className="grid grid-cols-12">
          <div className="col-span-12 change-logo-back" />
          <div className="col-start-1 col-span-5 text-coffee change-logo mt-40 max-w-[115ch]">
            <div className="eyebrow">Client name</div>
            <h1 className="hero-title"><span>Evolving visual language for an AI-powered brand</span></h1>
          </div>
          <div className="col-start-8 col-span-5">
            <div className="featured-image">
              client-work-img rests here
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
