function decodeHtmlEntities(value = '') {
  if (!value || typeof window === 'undefined' || typeof document === 'undefined') {
    return value
  }

  // Some ACF fields return escaped HTML (&lt;p&gt;...); decode it before injection.
  if (!/&lt;\/?[a-z][\s\S]*&gt;/i.test(value)) {
    return value
  }

  const textarea = document.createElement('textarea')
  textarea.innerHTML = value
  return textarea.value
}

export default function RichText({ html, className = '' }) {
  if (!html) {
    return null
  }

  const content = decodeHtmlEntities(String(html))

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}