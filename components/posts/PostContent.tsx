'use client'

import { useEffect, useState } from 'react'
// DOMPurify sanitizes HTML before rendering — XSS is mitigated intentionally here
import DOMPurify from 'dompurify'

export default function PostContent({ html }: { html: string }) {
  const [clean, setClean] = useState('')

  useEffect(() => {
    setClean(
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'p','br','strong','em','s','u','h1','h2','h3','h4','h5','h6',
          'ul','ol','li','blockquote','pre','code','hr',
        ],
        ALLOWED_ATTR: [],
      })
    )
  }, [html])

  // Safe: content is DOMPurify-sanitized before assignment
  // eslint-disable-next-line react/no-danger
  return (
    <div
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
