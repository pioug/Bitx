const angular = require('angular')
const fuzzysearch = require('fuzzysearch')
const badge = require('./badge.js')

const State = {
  language: localStorage.language || 'en',
  logged: !!localStorage.basecampToken,
  search: localStorage.lastSearch || 'assignee:me'
}

const getAssignee = search => {
  let assignee = search.match(/\bassignee:([\s]*[\w\.]*)\b/g)
  if (assignee) {
    assignee = assignee[0].split(':')[1].replace(/\s/g,'')
  }
  return assignee
}

const getCreator = search => {
  let creator = search.match(/\bcreator:([\s]*[\w\.]*)\b/g)
  if (creator) {
    creator = creator[0].split(':')[1].replace(/\s/g,'')
  }
  return creator
}

const getKeyword = search => {
  return search.replace(/(assignee:|creator:)[\w\.]+\s*/gi, '')
}

const Parser = () => {

  const filterTodos = (todos, keyword, creator, assignee, me, people) => {
    const myIDs =  _.map(me, 'id')
    const fuzzySeach = todo => fuzzysearch(keyword.toLowerCase(), todo.content.toLowerCase())
    const assigneeFilter = todo => {
      if (assignee === 'me') {
        return todo.assignee && _.includes(myIDs, todo.assignee.id)
      } else if (assignee) {
        return false
      }
      return true
    }
    const creatorFilter = todo => {
      if (creator === 'me') {
        return todo.creator && _.includes(myIDs, todo.creator.id)
      } else if (creator) {
        return false
      }
      return true
    }

    return _.chain(todos)
      .filter(fuzzySeach)
      .filter(creatorFilter)
      .filter(assigneeFilter)
      .value();
  }

  const groupTodosByProject = todos =>
    _.reduce(
      ['overdues', 'today', 'upcoming', 'noduedate'],
      (result, cat) => {
        result[cat] = _.groupBy(badge.getTodosByDeadline(todos, cat), 'project.name')
        return result
      }, {})

  const nextDeadline = groupedTodos =>
    _.size(groupedTodos.overdues) && 'overdues' ||
    _.size(groupedTodos.today) && 'today' ||
    _.size(groupedTodos.upcoming) && 'upcoming' ||
    _.size(groupedTodos.noduedate) && 'noduedate'

  return {
    filterTodos,
    groupTodosByProject,
    nextDeadline
  }
}

const Renderer = ($rootScope, Parser) => {
  const update = state => {
    localStorage.lastSearch = state.search

    let todos = Parser.filterTodos(state.allTodos, getKeyword(state.search), getCreator(state.search), getAssignee(state.search), state.me)
    state.todos = Parser.groupTodosByProject(todos)
    state.display = Parser.nextDeadline(state.todos)
    $rootScope.$applyAsync()
  }

  return { update }
}

module.exports = angular
  .module('basecampExtension.services', [])
  .value('State', State)
  .factory('Parser', Parser)
  .factory('Renderer', Renderer)

