const angular = require('angular')

require('./lang/en.js')
require('./lang/fr.js')
require('./lang/it.js')
require('./lang/ja.js')
require('./lang/ko.js')
require('./lang/pt.js')

angular
  .module('basecampExtension', [
    require('./controllers.js').name,
    require('./directives.js').name,
    require('./filters.js').name,
    require('./services.js').name,
    require('angular-animate'),
    require('angular-sanitize')
  ])
  .config($compileProvider =>
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file):|data:image\/|filesystem:chrome-extension:|\//)
  )
  .run((State, Renderer) => {
    chrome.storage.local.get(null, data => {
      _.assign(State, data)
      Renderer.update(State)
    })
  })

// How do you use it? We want to learn how to improve it.
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-17785768-10']);
_gaq.push(['_trackPageview', '/open']);

let ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
ga.src = 'https://ssl.google-analytics.com/ga.js';
let s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
