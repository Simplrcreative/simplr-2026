export const INFINITE_CANVAS_RESIZE_EVENT = 'infinite-canvas:resize'

export function refreshInfiniteCanvasSize() {
  window.dispatchEvent(new Event(INFINITE_CANVAS_RESIZE_EVENT))
}

export function scheduleInfiniteCanvasResize(onComplete) {
  requestAnimationFrame(() => {
    refreshInfiniteCanvasSize()
    requestAnimationFrame(() => {
      refreshInfiniteCanvasSize()
      requestAnimationFrame(() => {
        refreshInfiniteCanvasSize()
        onComplete?.()
      })
    })
  })
}
