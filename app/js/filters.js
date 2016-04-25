const angular = require('angular')
const badge = require('./badge.js')

const i18n = State => input => window[State.language][input] || window.en[input]

const elapsedTime = State => {
  let today = new Date()
  return input => {
    let diff = today - new Date(input)
    if (diff/(1000*60*60*24) < 1) // If last update is less than one day ago
      if (diff/(1000*60*60) < 1) // If last update is less than one hour ago
        return Math.round(diff/(1000*60)) + ' ' + (window[State.language].minutesAgo || window.en.minutesAgo)
      else return Math.round(diff/(1000*60*60)) + ' ' + (window[State.language].hoursAgo || window.en.hoursAgo)
    else return Math.round(diff/(1000*60*60*24)) + ' ' + (window[State.language].daysAgo || window.en.hoursAgo)
  }
}

const daysDifference = () => input => Math.round(Math.abs(new Date(input) - new Date())/(1000*60*60*24))

const filterOn = State => {
  return (input, isFilter) => {
    if (!isFilter) return ''
    return window[State.language].assignedTo ?
      window[State.language].assignedTo.replace(/\{x\}/g, input) :
      window.en.assignedTo.replace(/\{x\}/g, input)
  }
}

const removeDomain = () => input => input.split('@')[0]

const keywordSearch = $filter => {
  return (input, search, userIDs, people) => {
    if (search) {
      var out = input
      var user
      var fromUser = search.match(/\bfrom:([\s]*[\w\.]*)\b/g) // Look for the keyword
      if (fromUser) fromUser = fromUser[0].split(':')[1].replace(/\s/g,'') // Extract the parameter, remove space if any

      var toUser = search.match(/\bto:([\s]*[\w\.]*)\b/g)
      if (toUser) toUser = toUser[0].split(':')[1].replace(/\s/g,'')

      // If the keyword 'from:' has been typed
      if (fromUser !== null) {
        // Bind 'me' with the logged user identity
        if (fromUser === 'me') {
          user = userIDs
        } else {
          // Look for the FIRST user () that match the name
          // NOTE: If different users have the same name and are in different Basecamp accounts,
          // you will get only one of their user account, the first that is found below
          user = _.find(people, user => $filter('removeDomain')(user.email_address) === fromUser)
        }
        // If 'someone' has been found, look for his todos'
        if (user) {
          out = _.filter(out, item => item.creator && (item.creator.id === user.id || _.includes(user, item.creator.id)))
        } else return []
      }

      // If 'to:' has been type
      if (toUser !== null) {
        // Bind 'me' with the logged user identity
        if (toUser === 'me') {
          user = userIDs
        } else {
          //Look for the user among employees of the company
          user = _.find(people, user => $filter('removeDomain')(user.email_address) === toUser)
        }
        // If 'someone has been found, look for his todos'
        if (user) {
          out = _.filter(out, item => item.assignee && (item.assignee.id === user.id || _.includes(user, item.assignee.id)))
        } else return []
      }

      if (new RegExp('from:|to:', 'gi').test(search)) {
        // If something follows 'from:someone or to:someone'
        // Look in the todo description or in the project name or in the todolist title
        var realSearch = search.replace(/(from:|to:)[\w\.]+\s*/gi, '')
        if (realSearch.length > 0) {
          out = _.filter(out, item =>
            item.content.match(new RegExp(realSearch, 'gi')) ||
            item.project.match(new RegExp(realSearch, 'gi')) ||
            item.todolist.match(new RegExp(realSearch, 'gi'))
          )
        }
        return out
      }
      // If no keyword has been typed, load the regular search filter
      out = _.filter(input, todo => todo.assignee && _.includes(userIDs, todo.assignee.id))
      return $filter('filter')(out, search)

    // If search input is empty, show your own todos
    } else {
      return _.filter(input, todo => todo.assignee && _.includes(userIDs, todo.assignee.id))
    }
  }
}

const suggestionSearch = $filter => {
  var out = []
  return (input, search) => {
    if (search) {
      var realSearch = search.match(/[^ |^:]*$/)[0]

      // User suggestions
      // Check if you are typing a name (after 'from:' or 'to:')
      if (new RegExp(/\b:([\s]*[\w]*)$\b/g).test(search) || new RegExp(/:$/).test(search)) {
        out = _.filter(input, item =>
          item.id != -1 && (item.name.match(new RegExp('^' + realSearch, 'gi')) ||
          item.email_address.match(new RegExp('^' + realSearch, 'gi')))
        )
        if (_.isEmpty(out)) {
          out = _.filter(input, item =>
            item.id != -1 && (item.name.match(new RegExp(realSearch, 'gi')) ||
            item.email_address.match(new RegExp(realSearch, 'gi')))
          )
        }
        if (realSearch === $filter('removeDomain')(out[0].email_address)) {
          return []
        }
      }

      // Keyword suggestions
      // If you are not typing a name, suggest keyword
      else {
        out = _.filter(input, item => item.id == -1 && item.email_address.match(new RegExp('^' + realSearch), 'gi'))
      }
      return out
    }
  }
}

const highlight = ($sce, $filter) => {
  return (text, search) => {
    search = search.replace(/(assignee:|creator:)[\w\.]+\s*/gi, '')
    if (search) {
      text = text.replace(new RegExp('(' + search + ')', 'gi'), '<mark>$1</mark>')
    }

    return $sce.trustAsHtml(text)
  }
}

module.exports = angular
  .module('basecampExtension.filters', [])
  .filter('daysDifference', daysDifference)
  .filter('elapsedTime', elapsedTime)
  .filter('filterOn', filterOn)  // Print tooltip if filter 'createdby:' is on
  .filter('highlight', highlight)
  .filter('i18n', i18n)
  .filter('keywordSearch', keywordSearch) // Advanced search that look through todos
  .filter('removeDomain', removeDomain)
  .filter('suggestionSearch', suggestionSearch) // Advanced search that look through people of Basecamp account
