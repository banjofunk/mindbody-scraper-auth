const fetch = require('node-fetch')
exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false
  return await fetch('https://api.ipify.org?format=json')
    .then(resp => resp.json())
}
