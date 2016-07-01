;(function () {
  var Graph = {}

  function drawDiagram () {
    Graph.svg = d3.select('.diagram')
      .append('svg:svg')
      .attr('width', w)
      .attr('height', h)

    Graph.force = d3.layout.force()
      .charge(-200)
      .linkDistance(40)
      .size([w, h])

    d3.json('/cluster.json', function (json) {
      var cluster = prepareD3(json.links)
      Graph.cluster = cluster

      prepareLink(cluster)

      Graph.force
        .nodes(cluster.nodes)
        .links(cluster.links)

      redrawDiagram(cluster)
    })
  }

  function redrawDiagram (cluster) {
    Graph.link = Graph.svg.selectAll('.link')
      .data(cluster.links)

    Graph.link.enter().insert('svg:line')
      .attr('class', 'link')

    Graph.link.exit().remove()


    Graph.node = Graph.svg.selectAll('.node')
      .data(cluster.nodes)

    Graph.node.enter().insert('svg:circle')
      .attr('class', 'node')
      .attr('r', function (d) { return d.size })
      .style('fill', function (d) { return fill(d.type); })
      .call(Graph.force.drag)

    Graph.node.exit().remove()

    if (Graph.node.selectAll('title')[0].length == 0) {
      Graph.node.append('svg:title')
        .text(function (d) { return d.id; })
    }


    Graph.force.on('tick', function () {
      Graph.link.attr('x1', function (d) { return d.source.x; })
        .attr('y1', function (d) { return d.source.y; })
        .attr('x2', function (d) { return d.target.x; })
        .attr('y2', function (d) { return d.target.y; })

      Graph.node.attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; })
    })

    Graph.force.start()
  }

  function prepareLink(cluster){
    var nodeById = d3.map()

    cluster.nodes.forEach(function (node) {
      nodeById.set(node.id, node)
    })

    cluster.links.forEach(function (link) {
      link.source = nodeById.get(link.source)
      link.target = nodeById.get(link.target)
    })
  }

  function prepareD3 (cluster) {
    var data = {
      'nodes': [],
      'links': []
    }

    for (var n in cluster.nodes) {
      data.nodes.push({
        'id': n,
        'type': 'node',
        'size': config.node.size
      })
    }

    for (var ns in cluster.namespaces) {
      data.nodes.push({
        'id': ns,
        'type': 'namespace',
        'size': config.namespace.size
      })

      for (var svc in cluster.namespaces[ns].services) {
        data.nodes.push({
          'id': svc,
          'type': 'service',
          'size': config.service.size
        })

        data.links.push({
          'source': ns,
          'target': svc
        })

        for (var p in cluster.namespaces[ns].services[svc].pods) {
          var pod = cluster.namespaces[ns].services[svc].pods[p]
          var node = getPodNode(cluster.nodes, pod)
          data.nodes.push({
            'id': pod,
            'type': 'pod',
            'size': config.pod.size
          })

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

  setupLegende()
  drawDiagram()
})()
