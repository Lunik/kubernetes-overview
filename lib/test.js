console.log('ok')
var util = require('util')

var scrape = require('./scrape.js')

scrape.getCluster(function (cluster) {
  console.log(util.inspect(cluster, false, null))

  scrape.getClusterLinks(cluster, function (links) {
    console.log(util.inspect(links, false, null))
  })
})
