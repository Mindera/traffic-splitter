const buildCookieString = (name, cookie) => name + '=' + cookie.value +
  ';domain=' + (cookie.domain || '') +
  ';path=' + (cookie.path || '') +
  ';expires=' + (new Date(new Date().getTime() + (cookie.maxAge * 1000)).toGMTString()) +
  ';max-age=' + (cookie.maxAge || '')

const buildCookieObject = options => ({
  domain: options.domain || '',
  path: options.path || '',
  expires: new Date(new Date().getTime() + (options.maxAge * 1000)),
  maxAge: options.maxAge
})

module.exports = {
  buildCookieString,
  buildCookieObject
}
