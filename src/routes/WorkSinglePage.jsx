import { useLoaderData } from 'react-router-dom'
import Seo from '../components/Seo.jsx'

export default function WorkSinglePage() {
  const { work } = useLoaderData() ?? {}
  const title = work?.title || 'Work'
  const pathname = work?.slug ? `/work/${work.slug}` : '/work'

  return (
    <>
      <Seo
        title={title}
        description=""
        pathname={pathname}
      />
    </>
  )
}
