import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackEvent } from '@/api/analytics'

export default function InternalAnalytics() {
  const location = useLocation()

  useEffect(() => {
    trackEvent('PAGE_VIEW', `${location.pathname}${location.search}${location.hash}`)
  }, [location])

  return null
}
