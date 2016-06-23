var Config = require('../config/config.json')

var KubeCli = require('k8s-client')
var async = require('async')

function Scrape () {
  this.api = Config.kubernetes

  this.cli = new KubeCli(this.api)
}

Scrape.prototype.getCluster = function (cb) {
  var self = this
  var cluster = {
    'nodes': [],
    'namespaces': [],
    'services': [],
    'pods': []
  }

  async.parallel([
    self.cli.nodes.get,
    self.cli.namespaces.get
  ], function (err, res) {
    cluster.nodes = res[0][0].items
    cluster.namespaces = res[1][0].items

    var count = Object.keys(cluster.namespaces).length
    var i = 0
    for (var n in cluster.namespaces) {
      var api = self.api
      api.namespace = cluster.namespaces[n].metadata.name
      var cli = new KubeCli(api)

      async.parallel([
        cli.services.get,
        cli.pods.get
      ], function (err, res) {
        cluster.services = cluster.services.concat(res[0][0].items)
        cluster.pods = cluster.pods.concat(res[1][0].items)

        i++
        if (i >= count) {
          cb(cluster)
        }
      })
    }
  })
}

Scrape.prototype.getClusterLinks = function (cluster, cb) {
  var links = {
    'nodes': {},
    'namespaces': {},
    'labels': {}
  }

  for (var i in cluster.nodes) {
    links.nodes[cluster.nodes[i].metadata.name] = {'pods': []}
  }

  for (var i in cluster.namespaces) {
    links.namespaces[cluster.namespaces[i].metadata.name] = {'services': {}}
  }

  for (var i in cluster.services) {
    links.namespaces[cluster.services[i].metadata.namespace]
      .services[cluster.services[i].metadata.name] = {'pods': []}

    if (cluster.services[i].spec.selector) {
      links.apps[cluster.services[i].spec.selector.app] = cluster.services[i].metadata.name
    }
  }

  links.namespaces.default.services.none = {'pods': []}

  for (var i in cluster.pods) {
    links.nodes[cluster.pods[i].spec.nodeName]
      .pods.push(cluster.pods[i].metadata.name)

    if (cluster.pods[i].metadata.labels && cluster.pods[i].metadata.labels.app) {
      links.namespaces[cluster.pods[i].metadata.namespace]
        .services[links.apps[cluster.pods[i].metadata.labels.app]].pods.push(cluster.pods[i].metadata.name)
    } else {
      links.namespaces[cluster.pods[i].metadata.namespace]
        .services[links.apps['none']]
        .pods.push(cluster.pods[i].metadata.name)
    }
  }
  cb(links)
}

module.exports = new Scrape()
