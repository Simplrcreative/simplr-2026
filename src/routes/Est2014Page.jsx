import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Seo from '../components/Seo.jsx'
import { breadcrumbSchema, webPageSchema } from '../lib/seo.js'
import { createSplitTextAnimation } from '../lib/animations/index.js'

gsap.registerPlugin(ScrollTrigger)

export default function Est2014Page() {
  useEffect(() => createSplitTextAnimation(), [])

  const pathname = '/est-2014'
  const title = 'Est 2014'
  const description = 'Est 2014 Page'

  return (
    <>
      <Seo
        title={title}
        description={description}
        pathname={pathname}
        schema={[
          webPageSchema({ pathname, title, description, type: 'WorkPage' }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: title, path: pathname },
          ]),
        ]}
      />

      <section className="page-hero px-5 pb-40 bg-coffee section-dark min-h-screen flex items-end">
        <div className="grid grid-cols-12">
          <div className="col-span-12 change-logo-back" />
          <div className="col-span-9 text-white change-logo mt-40 max-w-[115ch]">
            <div className="eyebrow">Est 2014</div>
            <h1 className="hero-title">Epic page coming soon!</h1>
            
          </div>
        </div>
      </section>

    </>
  )
}
