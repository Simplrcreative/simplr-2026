const DARK_TEXT_SLUGS = new Set(['strategy', 'web-design-development'])
const LIGHT_TEXT_SLUGS = new Set(['motion', 'branding-design', 'templates'])

const CATEGORY_BG_CLASS_BY_SLUG = {
  strategy: 'bg-strategy',
  'branding-design': 'bg-branding-design',
  'web-design-development': 'bg-web-design-development',
  motion: 'bg-motion',
  templates: 'bg-templates',
  'creative-ai': 'bg-creative-ai',
}

const CATEGORY_BORDER_COLOR_BY_SLUG = {
  strategy: 'var(--color-strategy)',
  'branding-design': 'var(--color-branding-design)',
  'web-design-development': 'var(--color-web-design-development)',
  motion: 'var(--color-motion)',
  templates: 'var(--color-templates)',
  'creative-ai': 'var(--color-creative-ai)',
}

export function slugify(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function CategoryBadge({ name }) {
  const slug = slugify(name)
  const bgClass = CATEGORY_BG_CLASS_BY_SLUG[slug] ?? 'bg-white'
  const textClass = LIGHT_TEXT_SLUGS.has(slug) ? 'text-white' : 'text-coffee'
  const borderColor = CATEGORY_BORDER_COLOR_BY_SLUG[slug] ?? 'var(--color-coffee)'

  return (
    <span
      className={`category ${bgClass} ${textClass} border leading-none font-medium rounded-full mb-1 md:mb-0`}
      style={{ borderColor }}
    >
      {name}
    </span>
  )
}
