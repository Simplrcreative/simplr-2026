import { Link, useLoaderData } from 'react-router-dom'
import RichText from '../components/RichText.jsx'
import Seo from '../components/Seo.jsx'
import { routeDefinitions } from '../config/site.js'
import { absoluteUrl, articleSchema, breadcrumbSchema, webPageSchema } from '../lib/seo.js'

function formatDate(date) {
  if (!date) {
    return null
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export default function EntryPage({ collectionKey }) {
  const { entry } = useLoaderData()
  const route = routeDefinitions[collectionKey]
  const description = entry.excerpt
  const pathname = `${route.path}/${entry.slug}`

  return (
    <>
      <Seo
        title={entry.title}
        description={description}
        pathname={pathname}
        image={entry.image?.sourceUrl}
        type="article"
        schema={[
          webPageSchema({
            pathname,
            title: entry.title,
            description,
            type: 'Article',
          }),
          articleSchema({
            pathname,
            title: entry.title,
            description,
            image: entry.image?.sourceUrl,
            datePublished: entry.date,
            author: entry.author,
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: route.label, path: route.path },
            { name: entry.title, path: pathname },
          ]),
        ]}
      />

      <section className="shell pt-16 md:pt-24">
        <div className="surface-card overflow-hidden px-6 py-10 md:px-10 md:py-14">
          <Link className="eyebrow" to={route.path}>
            Back to {route.label}
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-coffee/75">
            <span>{collectionKey === 'work' ? 'Case study' : 'Article'}</span>
            {entry.date ? <span>{formatDate(entry.date)}</span> : null}
            {entry.author ? <span>{entry.author}</span> : null}
          </div>
          <h1 className="section-title mt-5 max-w-4xl">{entry.title}</h1>
          <p className="body-copy mt-6 max-w-3xl">{description}</p>
          {entry.isFallback ? (
            <div className="mt-8 rounded-[1.5rem] border border-black/8 bg-sand-50 px-5 py-4 text-sm leading-6 text-coffee">
              Rendering scaffold content because the matching WordPress entry was not available. Connect the GraphQL endpoint and use the expected URI structure to hydrate this route.
            </div>
          ) : null}
          {entry.image?.sourceUrl ? (
            <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-black/8 bg-sand-100">
              <img alt={entry.image.altText || entry.title} src={absoluteUrl(entry.image.sourceUrl)} />
            </div>
          ) : null}
        </div>
      </section>

      <section className="shell mt-10 md:mt-12">
        <div className="surface-card px-6 py-6 md:px-8 md:py-8">
          <RichText html={entry.content} />
        </div>
      </section>
    </>
  )
}