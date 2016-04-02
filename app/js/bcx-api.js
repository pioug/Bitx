'use strict';

const getOptions = token => ({ headers: { Authorization: `Bearer ${token}` } })

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

module.exports = {
  getAuthorization,
  getMe,
  getPeople,
  getProjects,
  getRemainingTodos
}
