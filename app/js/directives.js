const angular = require('angular')

const toggleContent = ($filter, State) => ({
  replace:  true,
  restrict: 'E',
  scope: true,
  templateUrl: 'views/templates/toggle-content.html',
  link: (scope, element, attrs) => {
    let i18n = $filter('i18n')
    scope.header = i18n("header-" + attrs.category)
    scope.tooltip = i18n("count-" + attrs.category)
    scope.category = attrs.category

    scope.toggle = category =>
      State.display = State.display === category ? null : category

    scope.$watch('state.todos.' + attrs.category, val =>
      scope.counter = scope.getNumberTodos(attrs.category)
    )
  }
})

const todos = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: 'views/templates/todos.html',
  link: (scope, element, attrs) => scope.category = attrs.category
})

const todo = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: 'views/templates/todo.html',
  controller: 'TodoCtrl'
})

const searchSuggestions = ($filter, Renderer, State) => ({
  restrict: 'E',
  replace:  true,
  templateUrl: 'views/templates/search-suggestions.html',
  link: (scope, element, attrs) => {
    scope.navPosition = -1

    scope.$watch('state.search', () => {
      // State.searchKeyword = State.search.replace(/(from:|to:)\w+\s+/gi, '')
      Renderer.update(State)
      scope.navPosition = -1
    })

    scope.completeSearch = $event => {
      if (scope.navPosition === -1) {
        scope.setSearch(scope.filteredData[0])
      } else {
        scope.setSearch(scope.filteredData[scope.navPosition])
      }
      $event.preventDefault()
    }

    scope.navigateUp = $event => {
      var frameOffset = element.find('ul').scrollTop
      if (scope.navPosition > -1) {
        scope.navPosition--
        var framePosition = (scope.navPosition + 1) - (frameOffset-50)/50
        var objDiv = document.getElementById(scope.navPosition)
        if (Math.round(framePosition) === 1) {
          objDiv.scrollIntoView(true)
        }
      }
      $event.preventDefault()
    }

    scope.navigateDown = $event => {
      var frameOffset = element.find('ul').scrollTop
      if (scope.navPosition < scope.filteredData.length - 1) {
        scope.navPosition += 1
        var framePosition = (scope.navPosition+1) - (frameOffset+50)/50
        var objDiv = document.getElementById(scope.navPosition)
        if (Math.round(framePosition) === 4) {
          objDiv.scrollIntoView(false)
        }
      }
      $event.preventDefault()
    }

    scope.setNavPosition = $index => scope.navPosition = $index

    /**
     * When press ENTER or click on a suggestion, set the new value to the search input
     * We use the email address to extract a username
     * @param  {object}  person  Person selected among the suggestions.
     */
    scope.setSearch = person => {
      if (person) {
        scope.search = scope.search.replace(/(\w+)$/gi, '')
        scope.search += $filter('removeDomain')(person.email_address)
      }
    }
  }
})

module.exports = angular
  .module('basecampExtension.directives', [])
  .directive('toggleContent', toggleContent)
  .directive('todos', todos)
  .directive('todo', todo)
  .directive('searchSuggestions', searchSuggestions)
