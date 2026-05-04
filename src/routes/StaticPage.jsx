import { useLoaderData } from 'react-router-dom'
import PageHero from '../components/PageHero.jsx'
import RichText from '../components/RichText.jsx'
import Seo from '../components/Seo.jsx'
import { routeDefinitions } from '../config/site.js'
import {
  breadcrumbSchema,
  contactSchema,
  serviceCatalogSchema,
  webPageSchema,
} from '../lib/seo.js'

function renderSections(page) {
  if (!page.sections?.length) {
    return null
  }

  return (
    <section className="shell mt-10 md:mt-12">
      <div className="editorial-grid md:grid-cols-2 xl:grid-cols-3">
        {page.sections.map((section) => (
          <article key={section.title} className="surface-card px-6 py-6 md:px-7">
            <h2 className="font-literata text-3xl text-coffee">{section.title}</h2>
            <p className="mt-4 text-base leading-7 text-coffee">{section.body}</p>
            {section.items?.length ? (
              <ul className="mt-5 space-y-2 border-t border-black/8 pt-5 text-sm font-medium text-coffee">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

function renderMetrics(page) {
  if (!page.metrics?.length) {
    return null
  }

  return (
    <section className="shell mt-10 md:mt-12">
      <div className="surface-card grid gap-5 px-6 py-7 md:grid-cols-3 md:px-8">
        {page.metrics.map((metric) => (
          <div key={metric.label}>
            <p className="font-literata text-4xl text-coffee">{metric.value}</p>
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-coffee/70">{metric.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function renderContactMethods(page) {
  if (!page.contactMethods?.length) {
    return null
  }

  return (
    <section className="shell mt-10 md:mt-12">
      <div className="editorial-grid md:grid-cols-3">
        {page.contactMethods.map((method) => (
          <a
            key={method.label}
            className="surface-card px-6 py-6 transition-transform duration-300 hover:-translate-y-1 md:px-7"
            href={method.href}
            target={method.href.startsWith('http') ? '_blank' : undefined}
            rel={method.href.startsWith('http') ? 'noreferrer' : undefined}
          >
            <p className="eyebrow">{method.label}</p>
            <p className="mt-4 font-literata text-3xl leading-tight text-coffee">{method.value}</p>
          </a>
        ))}
      </div>
    </section>
  )
}

function renderTimeline(page) {
  if (!page.timeline?.length) {
    return null
  }

  return (
    <section className="shell mt-10 md:mt-12">
      <div className="surface-card px-6 py-6 md:px-8">
        <div className="space-y-6">
          {page.timeline.map((item) => (
            <div
              key={`${item.year}-${item.title}`}
              className="grid gap-3 border-b border-black/8 pb-6 last:border-b-0 last:pb-0 md:grid-cols-[8rem_1fr]"
            >
              <p className="font-literata text-3xl text-coffee">{item.year}</p>
              <div>
                <h2 className="font-literata text-3xl text-coffee">{item.title}</h2>
                <p className="mt-3 text-base leading-7 text-coffee">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function StaticPage({ pageKey }) {
  const { page } = useLoaderData()
  const route = routeDefinitions[pageKey]
  const description = page.intro
  const breadcrumbItems =
    pageKey === 'home'
      ? [{ name: 'Home', path: '/' }]
      : [
          { name: 'Home', path: '/' },
          { name: route.label, path: route.path },
        ]
  const schema = [
    webPageSchema({
      pathname: route.path,
      title: page.title,
      description,
      type: route.schemaType,
    }),
    breadcrumbSchema(breadcrumbItems),
  ]

  if (pageKey === 'services') {
    schema.push(serviceCatalogSchema(route.path, page.sections))
  }

  if (pageKey === 'contact') {
    schema.push(contactSchema(route.path))
  }

  return (
    <>
      <Seo
        title={route.label}
        description={description}
        pathname={route.path}
        type="website"
        schema={schema}
      />
      <PageHero
        kicker={page.kicker}
        title={page.title}
        intro={page.intro}
        badge={page.isFallback ? 'Showing scaffold copy until WordPress GraphQL content is configured.' : null}
      />
      <section className="shell mt-10 md:mt-12">
        <div className="surface-card px-6 py-6 md:px-8 md:py-8">
          <RichText html={page.content} />
        </div>
      </section>
      {renderMetrics(page)}
      {renderContactMethods(page)}
      {renderSections(page)}
      {renderTimeline(page)}
    </>
  )
}