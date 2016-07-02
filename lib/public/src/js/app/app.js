;(function () {
  Graph = {}

  $.getJSON('/cluster.json', function (err, json) {
    console.log('ok')
    var cluster = prepareD3(json.links)
    Graph.cluster = cluster

    prepareLink(cluster)

    console.log(cluster)
  })

  function prepareLink (cluster) {
    var nodeById = d3.map()

    cluster.nodes.forEach(function (node) {
      nodeById.set(node.id, node)
    })

    cluster.links.forEach(function (link) {
      link.source = nodeById.get(link.source)
      link.target = nodeById.get(link.target)
    })
  }

  function updateDiagram () {
  }

})()
