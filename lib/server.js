var Config = require('../config/config.json')
var Scrape = require('./scrape.js')

var express = require('express')
var path = require('path')
var http = require('http')
var fs = require('fs')

var app = express()
app.use(express.static(path.join(__dirname, '/public')))

var server = http.createServer(app)
var port = process.env.PORT || Config.app.port
server.listen(port, function () {
  console.log('Server listening at port ' + port)
})

app.get('/cluster.json', function(req, res){
  Scrape.getCluster(function(cluster){
    Scrape.getClusterLinks(cluster, function(links){
      res.end(JSON.stringify({
        'cluster': cluster,
        'links': links
      }))
    })
  })
})
