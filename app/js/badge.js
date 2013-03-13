/**
 * Count Todos in one category
 * @param {string} status Count overdue, today, upcoming or undefined Todos
 * @param {string} input JSON string containing all assignedTodos
 */
function countTodos(input, status) {

  var todayDate = getTodayDate();
  var inputDate = "";
  var count = 0; 

  for (var i = 0; i < input.length; i++) {
      if (input[i].due_at != null && status != '4') {
      	inputDate = parseInt(input[i].due_at.replace(/-/g, ""));
        if ((status == 'overdue') && (inputDate < todayDate)) count++;
        else if ((status == 'today') && (inputDate == todayDate)) count++;
        else if ((status == 'upcoming') && (inputDate > todayDate)) count++;
      } 
      else if (input[i].due_at == null && (status == 'undefined')) count++;
  }      
  return count;		
}

/**
 * Draw the extension badge in Chrome based on the Todos counter
 * localStorage['assignedTodos'] must to be set
 */
function updateBadge() {
  try {
    var jsonTodos = JSON.parse(localStorage.getItem('assignedTodos'));
    var counter = countTodos(jsonTodos, 'overdue');
    var color;
    
    if (countTodos(jsonTodos, 'overdue')) {
      counter = countTodos(jsonTodos, 'overdue');
      color = {color: '#FF0000'};
    }      
    else if (countTodos(jsonTodos, 'today')) {
      counter = countTodos(jsonTodos, 'today');
      color = {color: '#00FF00'};
    }
    else if (countTodos(jsonTodos, 'upcoming')) {
      counter = countTodos(jsonTodos, 'upcoming');
      color = {color: '#0000FF'};
    }
    else if (countTodos(jsonTodos, 'undefined')) {
      counter = countTodos(jsonTodos, 'undefined');
      color = {color: '#000000'};
    }
    else counter = '';
    
    chrome.browserAction.setBadgeBackgroundColor(color);
    chrome.browserAction.setBadgeText({text: counter.toString()});
    console.log('LOG: updateBadge');
  } catch(e) {
    console.log('ERROR: updateBadge ' + e);
    chrome.browserAction.setBadgeText({text: ''});
    chrome.browserAction.setIcon({path : '../icon.ico'});
  }
}	

/**
 * Give the current date
 * @return {int} date in YYYYMMDD format
 */
function getTodayDate() {
  var currentDate = new Date();
  var yyyy = currentDate.getFullYear().toString();
  var mm = (currentDate.getMonth()+1).toString();
  var dd = currentDate.getDate().toString();
  return parseInt(yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]));
}