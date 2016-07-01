var Config = require('../config/config.json')

var KubeCli = require('node-kubernetes-client')
var async = require('async')

function Scrape () {
  this.api = {
    'host': process.env.KUBE_HOST || Config.kubernetes.host,
    'protocol': process.env.KUBE_PROTOCOL || Config.kubernetes.protocol,
    'version': process.env.KUBE_API_VERSION || Config.kubernetes.version,
    'token': process.env.KUBE_TOKEN || Config.kubernetes.token
  }
  console.log('Using this api: ')
  console.log(this.api)

  this.cli = new KubeCli(this.api)
}

Array.prototype.unique = [].unique || function () {var o = {},i,l = this.length,r = []
  for (i = 0;i < l;i++)o[this[i]] = this[i]; for (i in o)r.push(o[i]);return r}

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
    if (err) {
      console.log(err)
      return 1
    }
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
        if (err) {
          console.log(err)
          return 1
        }
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

  for (var n in cluster.nodes) {
    links.nodes[cluster.nodes[n].metadata.name] = {'pods': []}
  }

  for (var ns in cluster.namespaces) {
    links.namespaces[cluster.namespaces[ns].metadata.name] = {'services': {}}
  }

  for (var svc in cluster.services) {
    links.namespaces[cluster.services[svc].metadata.namespace]
      .services[cluster.services[svc].metadata.name] = {'pods': []}

    if (cluster.services[svc].spec.selector || cluster.services[svc].metadata.labels) {
      for (var s in cluster.services[svc].spec.selector) {
        links.labels[s + ':' + cluster.services[svc].spec.selector[s]] = cluster.services[svc].metadata.name
      }

      for (var l in cluster.services[i].metadata.labels) {
        links.labels[l + ':' + cluster.services[svc].metadata.labels[l]] = cluster.services[svc].metadata.name
      }
    }
  }

  for (var p in cluster.pods) {
    links.nodes[cluster.pods[i].spec.nodeName]
      .pods.push(cluster.pods[i].metadata.name)

    if (cluster.pods[p].metadata.labels) {
      for (var l in cluster.pods[p].metadata.labels) {
        if (links.labels[l + ':' + cluster.pods[p].metadata.labels[l]]) {
          links.namespaces[cluster.pods[p].metadata.namespace]
            .services[links.labels[l + ':' + cluster.pods[p].metadata.labels[l]]]
            .pods.push(cluster.pods[p].metadata.name)

          links.namespaces[cluster.pods[p].metadata.namespace]
            .services[links.labels[l + ':' + cluster.pods[p].metadata.labels[l]]]
            .pods = links.namespaces[cluster.pods[p].metadata.namespace]
            .services[links.labels[l + ':' + cluster.pods[p].metadata.labels[l]]]
            .pods.unique()
        }
      }
    }
  }
  cb(links)
}

module.exports = new Scrape()
