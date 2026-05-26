const LIGHT_TEXT_SLUGS = new Set(['strategy', 'web-design-development'])

export function slugify(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function CategoryBadge({ name }) {
  const slug = slugify(name)
  const textClass = LIGHT_TEXT_SLUGS.has(slug) ? 'text-coffee' : 'text-white'
  return (
    <span className={`category bg-${slug} ${textClass} leading-none font-medium rounded-full mb-1 md:mb-0`}>
      {name}
    </span>
  )
}
