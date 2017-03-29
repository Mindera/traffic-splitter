const generateBid = length => {
  let s = ''
  for (let i = 0; i < length; i++) {
    s += (Math.random() * 16 | 0).toString(16)
  }
  return s
}

module.exports = {
  extractBrowserId: browserId => {
    const bidKey = browserId.cookie || 'bid'
    return (req, res, next) => {
      if (req.cookies && req.cookies[bidKey]) {
        req.bid = req.cookies[bidKey]
      } else {
        req.bid = generateBid(browserId.length || 12)
        req.emitBid = true
      }
      next()
    }
  }
}
