var Config = require('../config/config.json')

var KubeCli = require('k8s-client')
var async = require('async')

function Scrape(){
  this.api = Config.kubernetes

  this.cli = new KubeCli(this.api)
}

Scrape.prototype.getCluster = function(cb){
  var self = this
  var cluster = {}

  async.parallel([
    self.cli.nodes.get,
    self.cli.namespaces.get,
    self.cli.services.get,
    self.cli.pods.get
  ], function(err, results){
    if(err) console.log(err)

    cb({
      'nodes': results[0][0].items,
      'namespaces': results[1][0].items,
      'services': results[2][0].items,
      'pods': results[3][0].items
    })
  })
}

Scrape.prototype.getClusterLinks = function(cluster, cb){
  var links = {
    'nodes': {},
    'namespaces': {},
    'apps': {
      'none': 'none'
    }
  }

  for(var i in cluster.nodes){
    links.nodes[
      cluster.nodes[i].metadata.name
    ] = {
      'pods': []
    }
  }

  for(var i in cluster.namespaces){
    links.namespaces[
      cluster.namespaces[i].metadata.name
    ] = {
      'services': {}
    }
  }

  for(var i in cluster.services){
    links.namespaces[
      cluster.services[i].metadata.namespace
    ].services[
      cluster.services[i].metadata.name
    ] = {
      'pods': []
    }

    links.apps[
      cluster.services[i].spec.selector ? cluster.services[i].spec.selector.app : 'none'
    ] = cluster.services[i].metadata.name
  }

  for(var i in cluster.pods){
    links.nodes[
      cluster.pods[i].spec.nodeName
    ].pods.push(cluster.pods[i].metadata.name)

    links.namespaces[
      cluster.pods[i].metadata.namespace
    ].services[
      links.apps[
        cluster.pods[i].metadata.labels ? cluster.pods[i].metadata.labels.app : 'none'
      ]
    ].pods.push(cluster.pods[i].metadata.name)
  }
  cb(links)
}

module.exports = new Scrape()
