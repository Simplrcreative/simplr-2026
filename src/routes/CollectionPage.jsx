import { useLoaderData } from 'react-router-dom'
import PageHero from '../components/PageHero.jsx'
import PostGrid from '../components/PostGrid.jsx'
import RichText from '../components/RichText.jsx'
import Seo from '../components/Seo.jsx'
import { routeDefinitions } from '../config/site.js'
import { breadcrumbSchema, collectionSchema, webPageSchema } from '../lib/seo.js'

export default function CollectionPage({ collectionKey }) {
  const { page, items } = useLoaderData()
  const route = routeDefinitions[collectionKey]
  const description = page.intro

  return (
    <>
      <Seo
        title={route.label}
        description={description}
        pathname={route.path}
        schema={[
          webPageSchema({
            pathname: route.path,
            title: page.title,
            description,
            type: route.schemaType,
          }),
          collectionSchema({
            pathname: route.path,
            title: page.title,
            description,
            items,
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: route.label, path: route.path },
          ]),
        ]}
      />
      <PageHero
        kicker={page.kicker}
        title={page.title}
        intro={page.intro}
        badge={`${items.length} ${collectionKey === 'work' ? 'entries ready for case studies' : 'entries ready for editorial content'}`}
      />
      <section className="shell mt-10 md:mt-12">
        <div className="surface-card px-6 py-6 md:px-8 md:py-8">
          <RichText html={page.content} />
        </div>
      </section>
      <section className="shell mt-10 md:mt-12">
        <PostGrid collectionKey={collectionKey} items={items} />
      </section>
    </>
  )
}