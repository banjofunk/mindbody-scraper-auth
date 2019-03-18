const AWS = require('aws-sdk')
const lambda = new AWS.Lambda()
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const userAgent = 'Mozilla/5.0 AppleWebKit/537.36 Chrome/71.0.3578.98 Safari/537.36'

let version = 0
let token, params
exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false
  const { input, init } = event
  await getToken()
  resp = await fetchWithToken(input, init, token)
  for (const i of Array(5).fill(0)) {
    if(resp) { break } else {
      console.log('token failed')
      token = await getToken(true)
      resp = await fetchWithToken(input, init, token)
    }
  }
  return resp
}

const fetchWithToken = async (input, init, token) => {
  console.log('url', input)
  if(!init.headers) { init.headers = {} }
  init.headers['Cookie'] = token
  init.headers['User-Agent'] = userAgent
  return await fetch(input, init)
    .then(resp => resp.text())
    .then(resp => {
      const $ = cheerio.load(resp)
      const firstScript = $('body > script').eq(0).html().trim()
      if(firstScript === 'mb.sessionHelpers.resetSession();'){
        return false
      }
      return resp
    })
}

const getToken = async (getNew=false) => {
  params = {
    FunctionName: `mindbody-scraper-auth-${process.env.stage}-getToken`,
    Payload: JSON.stringify({ getNew, version })
  }
  return await lambda.invoke(params).promise()
    .then(data => {
      const tokenResp = JSON.parse(data.Payload)
      token = tokenResp.token
      version = tokenResp.version
      return Promise.resolve()
    })
}
