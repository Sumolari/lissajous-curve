const ghpages = require('gh-pages')

ghpages.publish('dist', {
  message: ':memo: Auto-generated demo'
})
