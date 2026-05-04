import { Link } from 'react-router-dom'
import { buildEntryPath } from '../lib/wp-api.js'

function formatDate(date) {
  if (!date) {
    return null
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export default function PostGrid({ collectionKey, items = [] }) {
  return (
    <div className="editorial-grid md:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => (
        <article
          key={item.id || item.slug}
          className="surface-card group flex h-full flex-col overflow-hidden px-6 py-6 md:px-7"
        >
          <div className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.22em] text-coffee/65">
            <span>{collectionKey === 'work' ? 'Case study' : 'Article'}</span>
            <span>{String(index + 1).padStart(2, '0')}</span>
          </div>
          <h2 className="mt-5 font-literata text-3xl leading-tight text-coffee transition-transform duration-500 group-hover:translate-x-1">
            <Link to={buildEntryPath(collectionKey, item.slug)}>{item.title}</Link>
          </h2>
          <p className="mt-4 flex-1 text-base leading-7 text-coffee">{item.excerpt}</p>
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-black/8 pt-5 text-sm text-coffee">
            <span>{formatDate(item.date) || 'Editorial entry'}</span>
            <Link
              className="font-semibold text-coffee transition-transform duration-300 group-hover:translate-x-1"
              to={buildEntryPath(collectionKey, item.slug)}
            >
              Read more
            </Link>
          </div>
        </article>
      ))}
    </div>
  )
}