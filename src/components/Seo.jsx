import { Helmet } from 'react-helmet-async'
import { siteConfig } from '../config/site.js'
import {
  absoluteUrl,
  getDefaultRobots,
  normaliseDescription,
  organizationSchema,
  websiteSchema,
} from '../lib/seo.js'

function toFullTitle(title) {
  return title ? `${title} | ${siteConfig.name}` : siteConfig.name
}

export default function Seo({
  title,
  description,
  pathname = '/',
  image,
  type = 'website',
  schema = [],
  robots = getDefaultRobots(),
}) {
  const fullTitle = toFullTitle(title)
  const canonical = absoluteUrl(pathname)
  const resolvedDescription = normaliseDescription(description)
  const resolvedImage = absoluteUrl(image || siteConfig.defaultSocialImage)
  const allSchema = [organizationSchema(), websiteSchema(), ...schema]

  return (
    <Helmet prioritizeSeoTags>
      <html lang="en-GB" />
      <title>{fullTitle}</title>
      <link rel="canonical" href={canonical} />
      <meta name="description" content={resolvedDescription} />
      <meta name="robots" content={robots} />
      <meta property="og:site_name" content={siteConfig.name} />
      <meta property="og:locale" content={siteConfig.locale} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={resolvedImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={resolvedImage} />
      {allSchema.map((entry, index) => (
        <script key={`${title || 'site'}-schema-${index}`} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  )
}