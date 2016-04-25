'use strict'

const angular = require('angular')
const bcxAPI = require('./bcx-api.js')

const MainController = ($animate, $element, $scope, State) => {

  const setHeight = element => {
    let inner = element[0].querySelector('.content')
    if (inner) element[0].style.height = Math.min(inner.clientHeight, 306) + 'px'
  }

  $scope.state = State

  /**
   * Open options page in a new tab
   */
  $scope.openOptions = () => {
    chrome.tabs.create({ url: 'options.html' })
    console.log('LOG: openOptions')
  }

  /**
   * Return the number of todos of one category
   * @param  {string}  category  Name of the category.
   */
  $scope.getNumberTodos = category =>
    _.chain(State.todos[category])
      .values()
      .flatten()
      .size()
      .value()

  $scope.getHeight = category => {
    let todos = State.todos[category]
    if (category !== State.display) return 0
    return Math.min((_.size(todos) + _.chain(todos).values().flatten().size().value()) * 51, 306) + 'px'
  }

  $animate.enabled(false)
  setTimeout(() => $animate.enabled(true), 100)
}

const TodoCtrl = ($scope, $filter, $timeout, State) => {
  $scope.congratulation = $filter('i18n')('achievement' + Math.floor((Math.random() * 3) + 1))

  /**
   * Open tab to view todo on basecamp.com
   * @param  {object}  todo
   */
  $scope.openTodo = todo => {
    chrome.tabs.create({ url: todo.url.replace(/[\/]api[\/]v1|[\.]json/gi, '') })
    console.log('LOG: openTodo ID ' + todo.id)
  }

  /**
   * Check a todo
   * @param {object} todo
   */
  $scope.completeTodo = todo => {

    bcxAPI.completeTodo(localStorage.basecampToken, todo)
      .then((data, status, headers, config) => {
        console.log('LOG: completeTodo ID ' + todo.id)
        // chrome.storage.local.set({ 'allTodos': angular.fromJson(angular.toJson(allTodos)) })
      })
      .catch((data, status, headers, config) => {
        console.log('ERROR: completeTodo request failed')
      })

    $scope.achieved = true
    $timeout(() => _.remove(State.todos[$scope.category][$scope.key], todo), 500)
  }

  /**
   * Return true if keyword 'from:' is used
   * Allow to add tooltip 'Assigned to someone' in todos.html view
   */
  $scope.isFiltered = () => new RegExp('from:', 'gi').test($scope.search)
}

module.exports = angular
  .module('basecampExtension.controllers', [])
  .controller('MainController', MainController)
  .controller('TodoCtrl', TodoCtrl)
