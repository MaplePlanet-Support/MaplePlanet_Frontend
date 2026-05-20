type AnalyticsEventType = 'PAGE_VIEW' | 'PRESET_SAVE' | 'PRESET_LOAD'

const VISITOR_ID_KEY = 'planet_compare_visitor_id'

function createVisitorId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function getVisitorId() {
  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY)
    if (existing) return existing
    const next = createVisitorId()
    localStorage.setItem(VISITOR_ID_KEY, next)
    return next
  } catch {
    return createVisitorId()
  }
}

export function trackEvent(eventType: AnalyticsEventType, path = window.location.pathname) {
  const body = JSON.stringify({
    visitorId: getVisitorId(),
    eventType,
    path,
  })

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon('/api/v1/analytics/events', new Blob([body], { type: 'application/json' }))
    if (sent) return
  }

  void fetch('/api/v1/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => undefined)
}
