const names = {
  origin: 'Access-Control-Allow-Origin',
  headers: 'Access-Control-Allow-Headers',
  credentials: 'Access-Control-Allow-Credentials',
  methods: 'Access-Control-Allow-Methods',
  maxAge: 'Access-Control-Max-Age'
}

const findIndexOfOrigin = (origin, domains) => {
  if (!origin || !domains) { return -1 }
  return domains.findIndex(domain => origin.slice(-domain.length) === domain)
}

module.exports = {
  getIndexOfOrigin: ({origin}, {domains}) => findIndexOfOrigin(origin, domains),

  getHeadersNames: () => Object.keys(names).map(key => names[key]),

  getHeaders: ({origin}, {domains, CORS}) => {
    if (findIndexOfOrigin(origin, domains) < 0) { return {} }
    const headers = {}
    headers[names.origin] = origin
    if (CORS.headers) { headers[names.headers] = CORS.headers.join(', ') }
    if (CORS.credentials) { headers[names.credentials] = CORS.credentials }
    if (CORS.methods) { headers[names.methods] = CORS.methods.join(', ') }
    if (CORS['max-age']) { headers[names.maxAge] = CORS['max-age'] }
    return headers
  }
}
