import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import Seo from '../components/Seo.jsx'

export default function NotFoundPage() {
  const error = useRouteError()
  const status = isRouteErrorResponse(error) ? error.status : 404

  return (
    <>
      <Seo title="Not found" pathname="/404" robots="noindex,nofollow" />
      <section className="px-5 py-20 bg-white section-light">
        <div className="grid grid-cols-12 w-full">
          <div className="col-start-1  col-span-12 text-coffee mt-40">
              <div className="eyebrow">{status}</div>
              <h1 className="section-title mt-4">Yikes! That's not great</h1>
              <p className="body-copy my-10">
                The page may not exist, may have been moved or deleted. Let's get you back on track.
              </p>
              <div className="flex gap-4">
              <Link className="inline-flex rounded-full bg-coffee px-5 py-3 text-xl font-semibold text-white" to="/work/">
                View our work
              </Link>
              <Link className="inline-flex rounded-full bg-coffee px-5 py-3 text-xl font-semibold text-white" to="/services/">
                View our services
              </Link>
              <Link className="inline-flex rounded-full bg-coffee px-5 py-3 text-xl font-semibold text-white" to="/contact/">
                Get in touch
              </Link>
              </div>
          </div>
        </div>
      </section>
    </>
  )
}