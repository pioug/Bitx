// Background script of the Chrome extension

'use strict';

const _ = require('lodash')
const badge = require('./js/badge.js')
const oauth2 = require('./js/oauth2.js')
const bcxAPI = require('./js/bcx-api.js')

const state = {
  polling: null
}

const insertProject = (project, todos) =>
  _.map(todos, todo => _.assign({}, todo, { project: project }))

const filterMyTodos = (me, todos) =>
  _.filter(todos, { assignee: { id: me.id } })

const getAllTodos = (projects, todosByProject) =>
  _.chain(todosByProject)
    .map((todos, index) => insertProject(projects[index], todos))
    .flatten()
    .value()

const getMyTodos = (me, projects, todosByProject) =>
  _.chain(todosByProject)
    .map((todos, index) => filterMyTodos(me[index], todos))
    .map((todos, index) => insertProject(projects[index], todos))
    .flatten()
    .value()

const cache = object =>
  new Promise((resolve, reject) =>
    // Chrome Storage does not always return nested object without parse(stringify)
    chrome.storage.local.set(JSON.parse(JSON.stringify(object)), () => {
      if (chrome.runtime.lastError) return reject(chrome.runtime.lastError)
      resolve()
    })
  )

const mainTask = () =>
  bcxAPI.getAuthorization(localStorage.basecampToken)
    .catch(oauth2.authorization)
    .then(authorization => {
      let accounts = _.filter(authorization.accounts, { product: 'bcx'})
      return Promise.all([
        Promise.all(_.map(accounts, account => bcxAPI.getMe(localStorage.basecampToken, account))),
        Promise.all(_.map(accounts, account => bcxAPI.getProjects(localStorage.basecampToken, account))),
        Promise.all(_.map(accounts, account => bcxAPI.getPeople(localStorage.basecampToken, account)))
      ])
    })
    .then(([me, projects, people]) => {
      projects = _.flatten(projects)
      return Promise.all([
        me,
        projects,
        people,
        Promise.all(_.map(projects, project => bcxAPI.getRemainingTodos(localStorage.basecampToken, project)))
      ])
    })
    .then(([me, projects, people, todos]) => {
      let allTodos = getAllTodos(projects, todos)
      let myTodos = getMyTodos(me, projects, todos)

      cache({
        me: _.flatten(me),
        people:  _.flatten(people),
        projects,
        allTodos,
        myTodos
      })

      badge.update(myTodos, localStorage.counter_todos)
    })

const setEnvironment = () => {
  if (!localStorage.language) {
    let userLang = navigator.language ? navigator.language : navigator.userLanguage,
      locale = userLang.substring(0, 2);
    localStorage.language = locale;
  }

  if (!localStorage.counter_todos) {
    localStorage.counter_todos = 'default';
  }

  if (!localStorage.refresh_period) {
    localStorage.refresh_period = 30000;
  }

  if (localStorage.app_version && localStorage.app_version !== chrome.app.getDetails().version) {
    notifyUpdate()
  }

  localStorage.app_version = chrome.app.getDetails().version
}

const poll = () =>
  state.polling = setTimeout(() => mainTask().then(poll), localStorage.refresh_period)

const notifyUpdate = () => {
  let notificationId = new Date().getTime().toString();

  chrome.notifications.create(notificationId, {
    type: 'basic',
    title: 'Bitx has been updated!',
    message: 'Help us to improve it; click here to submit your feedback!',
    iconUrl: './img/icon_250x250.png'
  });

  chrome.notifications.onClicked.addListener(id => {
    if (id === notificationId) window.open('http://goo.gl/fUXs2M')
  })
}

const start = () => {
  let oauth2Process = localStorage.basecampToken ? oauth2.renew : oauth2.authorize
  setEnvironment()
  oauth2Process()
    .then(mainTask)
    .then(poll)
}

const stop = () => clearTimeout(state.polling)

window.addEventListener('online',  start)
window.addEventListener('offline', stop);

start()
