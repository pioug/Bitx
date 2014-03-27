/*
 * Background script of the Chrome extension
 * Loaded by background.html
 */
(function() {
  'use strict';

  window.backgroundTasks = {

    renewCache: false,
    jobDone: true,

    getBasecampAccounts: function() {
      var xhr  = new XMLHttpRequest();
      xhr.open('GET', 'https://launchpad.37signals.com/authorization.json', false);
      xhr.setRequestHeader('Authorization', 'Bearer ' + this.basecampToken);
      xhr.send();
      if (xhr.readyState === 4 && xhr.status === 200) {
        console.log('LOG: getBasecampAccounts XHR');
        var data = JSON.parse(xhr.responseText);
        this.basecampAccounts = _.where(data.accounts, { product: 'bcx' });
        this.saveCache('basecampAccounts');
        return true;
      } else if (xhr.readyState === 4) {
        // Token expired
        console.log('ERROR: getBasecampAccounts XHR - Token expired');
        if (xhr.status === 401) window.oauth2.renew();
      }
      return false;
    },

    getUserIDs: function() {
      this.userIDs = [];
      var self = this;
      _.forEach(this.basecampAccounts, function(basecampAccount) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://basecamp.com/' + basecampAccount.id + '/api/v1/people/me.json', false);
        xhr.setRequestHeader('Authorization', 'Bearer ' + self.basecampToken);
        xhr.send();
        if (xhr.readyState === 4 && xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          self.userIDs.push(data.id);
        } else if (xhr.readyState === 4) {
          if (xhr.getResponseHeader('Reason') === 'Account Inactive') {
            basecampAccount.inactive = true;
            console.log('WARNING: getUserIDs XHR - Basecamp account ' + basecampAccount.name + ' inactive')
          }
          else console.log('ERROR: getUserIDs XHR');
        }
      });
      console.log('LOG: getUserIDs XHR');
      this.saveCache('userIDs');
    },

    getPeople: function() {
      this.people = [];
      var self = this,
      metaElements = [{
        id:            this.userIDs,
        name:          'Alias',
        email_address: 'me',
        avatar_url:    '/img/icon-search.png'
      }, {
        id:            -1,
        name:          'Search by creator',
        email_address: 'from:',
        avatar_url:    '/img/icon-search.png'
      }, {
        id:            -1,
        name:          'Search by assignee',
        email_address: 'to:',
        avatar_url:    '/img/icon-search.png'
      }];

      _.forEach(this.basecampAccounts, function(basecampAccount) {
        if (basecampAccount.inactive) return;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://basecamp.com/' + basecampAccount.id + '/api/v1/people.json', false);
        xhr.setRequestHeader('Authorization', 'Bearer ' + self.basecampToken);
        xhr.send();
        if (xhr.readyState === 4 && xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          self.people = self.people.concat(data);
        } else if (xhr.readyState === 4) {
          console.log('ERROR: getUserIDs XHR');
        }
      });
      console.log('LOG: getPeople XHR');
      this.saveCache('people', self.people.concat(metaElements));
    },

    getTodoLists: function(callback) {
      if (_.isEmpty(this.basecampAccounts)) {
        backgroundTasks.stop();
        return;
      }
      this.allTodoLists = [];
      var self = this;
      var nbTodosListFetched = 0;
      _.forEach(this.basecampAccounts, function(basecampAccount) {
        if (basecampAccount.inactive) return;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://basecamp.com/' + basecampAccount.id + '/api/v1/todolists.json', false);
        xhr.setRequestHeader('Authorization', 'Bearer ' + self.basecampToken);
        xhr.send();
        if (xhr.readyState === 4 && xhr.status === 200) {
          // The answer is not "304 Not Modified", renew the cache
          if (xhr.getResponseHeader('Status') === '200 OK') self.renewCache = true;
          console.log('LOG: getTodoLists XHR, Basecamp account: ' + basecampAccount.id + ", status: " + xhr.getResponseHeader('Status'));
          var data = JSON.parse(xhr.responseText);
          self.allTodoLists = self.allTodoLists.concat(data);
          nbTodosListFetched++;
          if (nbTodosListFetched === self.basecampAccounts.length) {
            callback();
          }
        } else if (xhr.readyState === 4) {
          console.log('ERROR: getTodoLists XHR');
          backgroundTasks.stop();
          if (xhr.status === 401) window.oauth2.renew();
        }
      });
    },

    getTodos: function(callback) {
      this.allTodos = [];
      var self = this;
      var nbTodosFetched = 0;
      _.forEach(this.allTodoLists, function(todolist) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', todolist.url, true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + self.basecampToken);
        xhr.onload = function(e) {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              var data = JSON.parse(xhr.responseText);
              self.allTodos = self.allTodos.concat(data.todos.remaining);
              nbTodosFetched++;
              if (nbTodosFetched === self.allTodoLists.length) {
                console.log('LOG: finished getting all todos');
                callback();
              }
            } else {
              console.log('ERROR: getTodos XHR');
            }
          }
        };
        xhr.send();
      });
      console.log('LOG: getTodos XHR');
    },

    addTodosData: function() {
      _.map(this.allTodos, function(todo) {
        var parentTodoList = _.findWhere(this.allTodoLists, { id: todo.todolist_id });
        todo.todolist      = parentTodoList.name ;
        todo.project       = parentTodoList.bucket.name;
        todo.project_id    = parentTodoList.bucket.id;
      }, this);
      this.saveCache('allTodos');
    },

    saveCache: function(key, value) {
      var object = {};
      if (!value) value = this[key];
      object[key] = value;
      chrome.storage.local.set(object);
      console.log('LOG: save ' + key + ' in cache');
    },

    loadCache: function(key, callback) {
      var self = this;
      chrome.storage.local.get(key, function(data) {
        if (chrome.runtime.lastError) return;
        self[key] = data[key] ? data[key] : null;
        console.log('LOG: load ' + key + ' from cache');
        if (callback) callback();
      });
    },

    parseMyTodos: function() {
      var self = this,
          newMyTodos = _.filter(this.allTodos, function(todo) {
            return todo.assignee && _.contains(this.userIDs, todo.assignee.id);
          }, this);
      this.loadCache('myTodos', function() {
        if (self.myTodos !== null) {
          _.map(newMyTodos, function(todo) {
            if (_.findWhere(this.myTodos, { id: todo.id })) return;
            else this.createNotification(todo);
          }, self);
        }
        self.saveCache('myTodos', newMyTodos);
        console.log('LOG: parseMyTodos updates cache of myTodos');
        badge.updateBadge(newMyTodos);
      });
    },

    createNotification: function(todo) {
      var notification = webkitNotifications.createNotification(
        todo.creator.avatar_url, // Icon
        todo.project, // Title
        todo.content // Body
      );
      notification.onclick = function () {
        // Example of what the replace-regex do:
        // https://basecamp.com/2457428/api/v1/projects/4324139-explore-basecamp/todos/70309999-click-the-invite.json
        // https://basecamp.com/2457428/projects/4324139-explore-basecamp/todos/70309999-click-the-invite
        window.open(todo.url.replace(/[\/]api[\/]v1|[\.]json/gi, ''));
        notification.close();
      };
      notification.show();
      setTimeout(function() { notification.cancel(); }, 15000); // Hide notification after 15 seconds
    },

    pollTodolists: function(period) {
      var self = this;
      this.pollingTask = setInterval(function() {
        // Make sure that the previous job is done
        if (self.jobDone == true) {
          self.jobDone = false;
          if (self.renewCache) {
            self.getTodoLists(function() {
              self.getTodos(function() {
                self.addTodosData();
                self.parseMyTodos();
                self.getPeople();
                self.renewCache = false;
                self.jobDone = true;
              });
            });
          } else {
            self.getTodoLists(function() {
              self.jobDone = true;
            });
          }
        }
      }, period);
    },

    initConfig: function() {
      if (!localStorage.basecampToken) return false;
      if (!localStorage.language) {
        var userLang = navigator.language ? navigator.language : navigator.userLanguage,
            locale   = userLang.substring(0, 2);
        localStorage.language = locale;
      }
      if (!localStorage.counter_todos) {
        localStorage.counter_todos = 'default';
      }
      if (!localStorage.refresh_period) {
        localStorage.refresh_period = 30000;
      }
      this.basecampToken = localStorage.basecampToken;
      console.log('LOG: initConfig');
      return true;
    },

    start: function() {
      console.log('LOG: start backgroundTasks');
      var self = this;
      if (this.initConfig() && this.getBasecampAccounts()) {
        this.getUserIDs();
        this.getTodoLists(function() {
          self.getTodos(function() {
            self.addTodosData();
            self.parseMyTodos();
            self.getPeople();
            self.pollTodolists(localStorage.refresh_period);
          });
        });
      } else backgroundTasks.stop();
    },

    stop: function() {
      console.log('LOG: stop backgroundTasks');
      clearInterval(this.pollingTask);
      badge.updateBadge(null);
    },

    restart: function() {
      console.log('LOG: restart backgroundTasks');
      clearInterval(this.pollingTask);
      this.pollTodolists(localStorage.refresh_period);
    }
  };

  backgroundTasks.start();

  window.addEventListener('storage', eventStorage, false);

  function eventStorage(e) {
    console.log(e);
    console.log(e.newValue);
    if (e.key === '' && e.newValue === null) {
      backgroundTasks.stop();
    }
    else if (e.key === 'basecampToken' && e.newValue !== null) {
      backgroundTasks.stop();
      backgroundTasks.start();
    }
    else if (e.key === 'refresh_period' && !isNaN(e.newValue)) {
      backgroundTasks.restart();
    }
  }

})();
