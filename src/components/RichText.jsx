export default function RichText({ html, className = '' }) {
  if (!html) {
    return null
  }

  return (
    <div
      className={`prose prose-stone max-w-none prose-headings:font-literata prose-headings:text-coffee prose-p:text-coffee prose-a:text-coffee prose-strong:text-coffee ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}