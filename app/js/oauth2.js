'use strict'

const queryString = require('query-string')
const moment = require('moment')

const oAuth2 = {
  baseAccessTokenUrl: 'https://launchpad.37signals.com/authorization/token',
  baseAuthorizationUrl: 'https://launchpad.37signals.com/authorization/new',
  clientId: '78b9eec90729d6f30abc4b53b858e940aed9b2d1',
  clientSecret: '200907860c882cc271004b8542a5c82c5eeacf8a',
  redirectUri: 'https://pbdnaokipicebiobfmkeaenibfjkocnb.chromiumapp.org/provider_cb'
}

const chromeAuthorize = authorizationUrl =>
  new Promise((resolve, reject) =>
    chrome.identity.launchWebAuthFlow({
      url: authorizationUrl,
      interactive: true
    }, url => {
      if (!url) return reject()
      let a = document.createElement('a'),
        params
      a.href = url
      params = queryString.parse(a.hash)
      resolve(params)
    })
  )

const authorize = () =>
  chromeAuthorize(`${oAuth2.baseAuthorizationUrl}?type=user_agent&client_id=${oAuth2.clientId}&redirect_uri=${oAuth2.redirectUri}`)
    .then((params) => {
      localStorage.basecampToken = params.access_token
      localStorage.basecampRefreshToken = params.refresh_token
      localStorage.expiresAt = moment().add(params.expires_in, 'seconds').format()
      chrome.tabs.create({ url:'./views/auth-success.html' })
    })

const renew = () => {
  let form = new FormData()
  form.append('client_id', oAuth2.clientId)
  form.append('client_secret', oAuth2.clientSecret)
  form.append('redirect_uri', oAuth2.redirectUri)
  form.append('refresh_token', localStorage.basecampRefreshToken)

  return fetch(`${oAuth2.baseAccessTokenUrl}?type=refresh`, {
      method: 'post',
      body: form
    })
    .then(response => response.json())
    .then(json => {
      localStorage.basecampToken = json.access_token
      localStorage.expiresAt = moment().add(json.expires_in, 'seconds').format()
    })
}

module.exports = {
  authorize,
  renew
}
