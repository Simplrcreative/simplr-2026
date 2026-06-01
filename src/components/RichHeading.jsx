function decodeHtmlEntities(value = '') {
  if (!value || typeof window === 'undefined' || typeof document === 'undefined') {
    return value
  }

  if (!/&lt;\/?[a-z][\s\S]*&gt;/i.test(value)) {
    return value
  }

  const textarea = document.createElement('textarea')
  textarea.innerHTML = value
  return textarea.value
}

function toInlineHeadingHtml(value = '') {
  return decodeHtmlEntities(String(value || ''))
    .replace(/<\/p>\s*<p[^>]*>/gi, '<br />')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '')
    .replace(/<h[1-6][^>]*>/gi, '')
    .replace(/<\/h[1-6]>/gi, '')
    .trim()
}

export default function RichHeading({ as: Tag = 'h2', html, className = '' }) {
  if (!html) {
    return null
  }

  const content = toInlineHeadingHtml(html)

  if (!content) {
    return null
  }

  return <Tag className={className} dangerouslySetInnerHTML={{ __html: content }} />
}
