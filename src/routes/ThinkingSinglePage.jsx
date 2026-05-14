import { useLoaderData } from 'react-router-dom'
import Seo from '../components/Seo.jsx'

export default function ThinkingSinglePage() {
  const { slug, page } = useLoaderData() ?? {}
  const title = page?.title || slug
  const pathname = slug ? `/thinking/${slug}` : '/thinking'

  return (
    <>
      <Seo
        title={title || 'Thinking'}
        description=""
        pathname={pathname}
      />
    </>
  )
}
