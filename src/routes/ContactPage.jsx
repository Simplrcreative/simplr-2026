import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Seo from '../components/Seo.jsx'
import { breadcrumbSchema, webPageSchema } from '../lib/seo.js'
import { createSplitTextAnimation } from '../lib/animations/index.js'

gsap.registerPlugin(ScrollTrigger)

export default function ContactPage() {
  useEffect(() => {
    createSplitTextAnimation()
  })

  const pathname = '/contact'
  const title = 'Contact'
  const description = 'Contact Page'

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
        <div className="grid grid-cols-12 w-full">
          <div className="col-span-12 change-logo-back" />
          <div className="col-span-9 text-white change-logo">
            <h1 className="hero-title large my-10">Let’s make it simplr.<br/><span>Come say <i>hello.</i></span></h1>
            <div className="eyebrow">Our Office</div>
          </div>
        </div>
      </section>

    </>
  )
}
