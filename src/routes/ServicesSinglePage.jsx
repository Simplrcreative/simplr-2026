import { useLoaderData } from 'react-router-dom'
import Seo from '../components/Seo.jsx'
import { breadcrumbSchema, webPageSchema } from '../lib/seo.js'

export default function ServicesSinglePage() {
  const { slug, page } = useLoaderData() ?? {}
  const title = page?.title || slug
  const pathname = `/services/${slug}`

  return (
    <>
      <Seo
        title={title}
        description={page?.description || ''}
        pathname={pathname}
        schema={[
          webPageSchema({
            pathname,
            title,
            description: page?.description || '',
            type: 'WebPage',
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
            { name: title, path: pathname },
          ]),
        ]}
      />

      <section className="page-hero px-5 pb-40 bg-white section-light min-h-screen flex items-end">
        <div className="grid grid-cols-12">
          <div className="col-span-12 change-logo-back" />
          <div className="col-span-6 text-coffee change-logo mt-40">
            <div className="eyebrow">Services</div>
            <h1 className="hero-title">{title}</h1>
          </div>
        </div>
      </section>
    </>
  )
}
