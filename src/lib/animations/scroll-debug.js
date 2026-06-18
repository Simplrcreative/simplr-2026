import { ScrollTrigger } from 'gsap/ScrollTrigger'

const HISTORY_KEY = '__SIMPLR_SCROLL_DEBUG_HISTORY__'

function getHistoryStore() {
  if (typeof window === 'undefined') return []
  if (!Array.isArray(window[HISTORY_KEY])) {
    window[HISTORY_KEY] = []
  }
  return window[HISTORY_KEY]
}

function describeTriggerElement(element) {
  if (!(element instanceof Element)) return '(no element)'
  const tag = element.tagName.toLowerCase()
  const id = element.id ? `#${element.id}` : ''
  const classes = element.classList?.length
    ? `.${Array.from(element.classList).slice(0, 2).join('.')}`
    : ''
  return `${tag}${id}${classes}`
}

function summarizeTriggers(triggers) {
  return triggers.slice(0, 12).map((trigger, index) => ({
    index,
    id: trigger.vars?.id ?? '(none)',
    trigger: describeTriggerElement(trigger.trigger),
    pin: Boolean(trigger.pin),
    enabled: typeof trigger.enabled === 'function' ? trigger.enabled() : true,
    progress: Number((trigger.progress ?? 0).toFixed(3)),
  }))
}

export function isScrollTriggerDebugEnabled() {
  if (typeof window === 'undefined') return false
  if (!import.meta.env.DEV) return false
  // Set window.__SIMPLR_SCROLL_DEBUG__ = true in DevTools to re-enable
  return window.__SIMPLR_SCROLL_DEBUG__ === false
}

export function logRouteScrollTriggerState(route, phase = 'snapshot') {
  if (!isScrollTriggerDebugEnabled()) return

  const triggers = ScrollTrigger.getAll()
  const total = triggers.length
  const active = triggers.filter((trigger) => trigger.isActive).length
  const pinned = triggers.filter((trigger) => Boolean(trigger.pin)).length

  const history = getHistoryStore()
  const routeHistory = history.filter((entry) => entry.route === route)
  const firstForRoute = routeHistory[0]
  const deltaFromFirst = firstForRoute ? total - firstForRoute.total : 0

  const entry = {
    route,
    phase,
    total,
    active,
    pinned,
    deltaFromFirst,
    ts: Date.now(),
  }
  history.push(entry)

  console.info(
    `[ScrollDebug] ${phase} ${route} | total=${total} active=${active} pinned=${pinned} deltaFromFirst=${deltaFromFirst}`,
  )

  const rows = summarizeTriggers(triggers)
  if (rows.length) {
    console.table(rows)
  }

  if (firstForRoute && deltaFromFirst > 2) {
    console.warn(
      `[ScrollDebug] Trigger count grew on ${route} (first=${firstForRoute.total}, current=${total}).`,
    )
  }
}
