import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import Seo from '../components/Seo.jsx'

export default function NotFoundPage() {
  const error = useRouteError()
  const status = isRouteErrorResponse(error) ? error.status : 404

  return (
    <section className="shell pt-20">
      <Seo title="Not found" pathname="/404" robots="noindex,nofollow" />
      <div className="surface-card px-6 py-10 md:px-10 md:py-14">
        <p className="eyebrow">{status}</p>
        <h1 className="section-title mt-4">This content is not available.</h1>
        <p className="body-copy mt-6 max-w-2xl">
          The page may not exist yet in WordPress, or the route definition does not match the expected URI structure.
        </p>
        <Link className="mt-8 inline-flex rounded-full bg-ink-900 px-5 py-3 text-sm font-semibold text-sand-50" to="/work">
          Go to Work
        </Link>
      </div>
    </section>
  )
}