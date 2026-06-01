const LIGHT_TEXT_SLUGS = new Set(['strategy', 'web-design-development'])

const CATEGORY_BG_CLASS_BY_SLUG = {
  strategy: 'bg-strategy',
  'branding-design': 'bg-branding-design',
  'web-design-development': 'bg-web-design-development',
  motion: 'bg-motion',
  templates: 'bg-templates',
  'creative-ai': 'bg-creative-ai',
}

export function slugify(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function CategoryBadge({ name }) {
  const slug = slugify(name)
  const bgClass = CATEGORY_BG_CLASS_BY_SLUG[slug] ?? 'bg-coffee'
  const textClass = LIGHT_TEXT_SLUGS.has(slug) ? 'text-coffee' : 'text-white'

  return (
    <span className={`category ${bgClass} ${textClass} leading-none font-medium rounded-full mb-1 md:mb-0`}>
      {name}
    </span>
  )
}
