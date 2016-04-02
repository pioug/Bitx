'use strict'

const _ = require('lodash')
const moment = require('moment')

const COLOR_WARNING = '#F54E4A'
const COLOR_OK = '#5E9AC9'

/**
 * Count Todos in one category
 * @param {string} input JSON string containing all myTodos
 * @param {string} status Count overdue, today, upcoming or undefined Todos
 */
const countTodos = (todos, status) => {
  let today = moment().format('YYYY-MM-DD')
  switch (status) {
    case 'no_due_date':
      return _.filter(todos, { due_at: null }).length
    case 'today':
      return _.filter(todos, { due_at: today }).length
    case 'upcoming':
      return _.filter(todos, todo => todo.due_at > today).length
    case 'overdues':
      return _.filter(todos, todo => todo.due_at ? todo.due_at < today : false).length
  }
}

/**
 * Draw the extension badge in Chrome based on the Todos counter
 */
const update = (todos, counter) => {
  if (!todos) {
    chrome.browserAction.setIcon({ path: './img/icon-inactive.png' })
    chrome.browserAction.setBadgeText({ text: '' })
    return
  }

  let color

  if (counter === 'default') {
    color = COLOR_WARNING
    counter = countTodos(todos, 'overdues')

    if (!counter) {
      color = COLOR_OK
      counter =
        countTodos(todos, 'today') ||
        countTodos(todos, 'upcoming') ||
        countTodos(todos, 'no_due_date') ||
        ''
    }

  } else {
    color = counter === 'overdues' ? COLOR_WARNING : COLOR_OK
    counter = countTodos(todos, counter) || ''
  }

  chrome.browserAction.setBadgeBackgroundColor({ color })
  chrome.browserAction.setIcon({ path: './img/icon-active.png' })
  chrome.browserAction.setBadgeText({ text: counter.toString() })
  console.log('LOG: updateBadge')
}

module.exports = {
  update
}
