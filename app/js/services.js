angular
  .module('basecampExtension.services', [])
  .value('Language', localStorage.language ? localStorage.language : 'en')
  .factory('Cache', function () {
    // Load data from cache
    return {
      load: function(scope) {
        scope.search = localStorage.lastSearch ? localStorage.lastSearch : "";
        chrome.storage.local.get(null, function(data) {
          _.each(data, function(value, key) {
            scope[key] = value;
          });
          scope.groupByProject();
        });
      }
    };
  });