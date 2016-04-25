'use strict';

const _ = require('lodash')

const getOptions = token => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})

const getAuthorization = token =>
  fetch('https://launchpad.37signals.com/authorization.json', getOptions(token))
    .then(res => res.json())

const getProjects = (token, account) =>
  fetch(`https://basecamp.com/${account.id}/api/v1/projects.json`, getOptions(token))
    .then(res => res.json())

const getMe = (token, account) =>
  fetch(`https://basecamp.com/${account.id}/api/v1/people/me.json`, getOptions(token))
    .then(res => res.json())

const getRemainingTodos = (token, project) =>
  fetch(`${project.url.replace('.json', '')}/todos/remaining.json`, getOptions(token))
    .then(res => res.json())

const getPeople = (token, account) =>
  fetch(`https://basecamp.com/${account.id}/api/v1/people.json`, getOptions(token))
    .then(res => res.json())

const completeTodo = (token, todo) =>
  fetch(todo.url, _.merge({
    method: 'put',
    body: JSON.stringify({ completed: true })
  }, getOptions(token)))
    .then(res => res.json())

module.exports = {
  getAuthorization,
  getMe,
  getPeople,
  getProjects,
  getRemainingTodos,
  completeTodo
}
