const WP_GRAPHQL_URL = 'https://stg-simplragency-dashboard.kinsta.cloud/graphql'

function getRequestBody(req) {
  if (typeof req.body === 'string') {
    return req.body
  }

  if (req.body && typeof req.body === 'object') {
    return JSON.stringify(req.body)
  }

  return '{}'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const upstreamResponse = await fetch(WP_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: getRequestBody(req),
    })

    const responseText = await upstreamResponse.text()

    // Intentionally do not forward Set-Cookie from upstream.
    res.setHeader('Content-Type', upstreamResponse.headers.get('content-type') || 'application/json; charset=utf-8')
    return res.status(upstreamResponse.status).send(responseText)
  } catch (error) {
    return res.status(502).json({
      error: 'GraphQL upstream request failed',
      detail: error instanceof Error ? error.message : String(error),
    })
  }
}
