import * as React from 'react'

const LazyInfiniteCanvasScene = React.lazy(() =>
  import('./scene.jsx').then((mod) => ({ default: mod.InfiniteCanvasScene }))
)

export function InfiniteCanvas(props) {
  return (
    <React.Suspense fallback={null}>
      <LazyInfiniteCanvasScene {...props} />
    </React.Suspense>
  )
}

export { resetInfiniteCanvas } from './reset.js'
export { refreshInfiniteCanvasSize } from './resize.js'
