var Config = require('../config/config.json')

var express = require('express')
var path = require('path')
var http = require('http')

var app = express()
app.use(express.static(path.join(__dirname, '/public')))

var server = http.createServer(app)
var port = process.env.PORT || Config.app.port
server.listen(port, function () {
  console.log('Server listening at port ' + port)
})
