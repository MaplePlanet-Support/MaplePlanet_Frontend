type PageMeta = {
  title: string
  description: string
  path?: string
  type?: 'website' | 'article'
}

const SITE_URL = 'https://planet-compare.com'

function setAttr(selector: string, attr: 'content' | 'href', value: string) {
  document.querySelector(selector)?.setAttribute(attr, value)
}

export function setPageMeta({
  title,
  description,
  path = '/',
  type = 'website',
}: PageMeta) {
  const url = `${SITE_URL}${path}`

  document.title = title
  setAttr('meta[name="description"]', 'content', description)
  setAttr('link[rel="canonical"]', 'href', url)
  setAttr('meta[property="og:type"]', 'content', type)
  setAttr('meta[property="og:title"]', 'content', title)
  setAttr('meta[property="og:description"]', 'content', description)
  setAttr('meta[property="og:url"]', 'content', url)
  setAttr('meta[name="twitter:title"]', 'content', title)
  setAttr('meta[name="twitter:description"]', 'content', description)
}
