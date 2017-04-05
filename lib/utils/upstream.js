const determineUpstream = (config, eventEmitter) => {
  return (req, res, next) => {
    const startTime = new Date().getTime()
    eventEmitter.emit('rulesProcessing', new Date().getTime() - startTime, 'upstream teste')
    next()
  }
}

module.exports = { determineUpstream }
