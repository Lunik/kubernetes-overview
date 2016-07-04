;(function () {
  Graph = {}

  $.getJSON('/cluster.json', function (json) {
    var cluster = prepareD3(json.links)
    Graph.cluster = cluster

    angular.module('myapp', ['kubernetesUI'])
      .run(function ($rootScope) {
        console.log('ok')
        $rootScope.kinds = {
          Pod: '#vertex-Pod',
          Namespace: '#vertex-Namespace',
          Node: '#vertex-Node',
          Service: '#vertex-Service'
        }

        $rootScope.items = cluster.nodes

        $rootScope.relations = cluster.links
      })
  })

  function updateDiagram () {
  }

  function prepareD3 (cluster) {
    var data = {
      'nodes': {},
      'links': []
    }

    for (var n in cluster.nodes) {
      data.nodes[n] = {
        'kind': 'Node'
      }
    }

    for (var ns in cluster.namespaces) {
      data.nodes[ns] = {
        'kind': 'Namespace'
      }

      for (var svc in cluster.namespaces[ns].services) {
        data.nodes[svc] = {
          'kind': 'Service'
        }

        data.links.push({
          'source': ns,
          'target': svc
        })

        for (var p in cluster.namespaces[ns].services[svc].pods) {
          var pod = cluster.namespaces[ns].services[svc].pods[p]
          var node = getPodNode(cluster.nodes, pod)
          data.nodes[pod] = {
            'type': 'Pod'
          }

          data.links.push({
            'source': svc,
            'target': pod
          })

          data.links.push({
            'source': node,
            'target': pod
          })
        }
      }
    }
    return data
  }

  function getPodNode (nodes, pod) {
    for (var n in nodes) {
      if (nodes[n].pods.indexOf(pod) !== -1) {
        return n
      }
    }
    return -1
  }
})()
