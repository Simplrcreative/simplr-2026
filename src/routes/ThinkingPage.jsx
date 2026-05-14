import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Seo from '../components/Seo.jsx'
import { breadcrumbSchema, webPageSchema } from '../lib/seo.js'
import { createSplitTextAnimation } from '../lib/animations/index.js'

gsap.registerPlugin(ScrollTrigger)

export default function ThinkingPage() {
  useEffect(() => {
    createSplitTextAnimation()
  })

  const pathname = '/thinking'
  const title = 'Thinking'
  const description = 'Thinking Page'

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

      <section className="page-hero px-5 pb-40 bg-white section-light min-h-screen flex items-end">
        <div className="grid grid-cols-12">
          <div className="col-span-12 change-logo-back" />
          <div className="col-span-9 text-coffee change-logo mt-40 max-w-[115ch]">
            <div className="eyebrow">Thinking</div>
            <h1 className="hero-title">Our latest thinking on <span>strategy, design, and building brands</span> that connect <span><i>purpose</i></span> with <span><i>performance.</i></span></h1>
          </div>
        </div>
      </section>

    </>
  )
}
