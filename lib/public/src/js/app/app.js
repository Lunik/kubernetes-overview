;(function () {
  var w = $(window).width()
  var h = $(window).height()
  var fill = d3.scale.category20()

  $('.legende .node').attr('fill', fill('node'))
  $('.legende .namespace').attr('fill', fill('namespace'))
  $('.legende .service').attr('fill', fill('service'))
  $('.legende .pod').attr('fill', fill('pod'))

  var vis = d3.select('.diagram')
    .append('svg:svg')
    .attr('width', w)
    .attr('height', h)

  d3.json('/cluster.json', function (json) {
    var cluster = prepareD3(json.links)
    console.log(cluster)
    var force = d3.layout.force()
      .charge(-120)
      .linkDistance(30)
      .nodes(cluster.nodes)
      .links(cluster.links)
      .size([w, h])
      .start()

    var link = vis.selectAll('line.link')
      .data(cluster.links)
      .enter().append('svg:line')
      .attr('class', 'link')
      .style('stroke-width', 1.5)
      .attr('x1', function (d) { return d.source.x; })
      .attr('y1', function (d) { return d.source.y; })
      .attr('x2', function (d) { return d.target.x; })
      .attr('y2', function (d) { return d.target.y; })

    var node = vis.selectAll('circle.node')
      .data(cluster.nodes)
      .enter().append('svg:circle')
      .attr('class', 'node')
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; })
      .attr('r', function (d) { return d.size; })
      .style('fill', function (d) { return fill(d.type); })
      .call(force.drag)

    node.append('svg:title')
      .text(function (d) { return d.name; })

    vis.style('opacity', 1e-6)
      .transition()
      .duration(500)
      .style('opacity', 1)

    force.on('tick', function () {
      link.attr('x1', function (d) { return d.source.x; })
        .attr('y1', function (d) { return d.source.y; })
        .attr('x2', function (d) { return d.target.x; })
        .attr('y2', function (d) { return d.target.y; })

      node.attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; })
    })
  })

  function prepareD3 (cluster) {
    var data = {
      'nodes': [],
      'links': []
    }

    var nodeGroup = 0
    for (var n in cluster.nodes) {
      nodeGroup++
      data.nodes.push({
        'name': n,
        'group': nodeGroup,
        'type': 'node',
        'size': 15
      })

      cluster.nodes[n].index = data.nodes.length - 1
    }

    for (var ns in cluster.namespaces) {
      nodeGroup++
      data.nodes.push({
        'name': ns,
        'group': nodeGroup,
        'type': 'namespace',
        'size': 7
      })

      cluster.namespaces[ns].index = data.nodes.length - 1

      for (var svc in cluster.namespaces[ns].services) {
        nodeGroup++
        data.nodes.push({
          'name': svc,
          'group': nodeGroup,
          'type': 'service',
          'size': 5
        })

        cluster.namespaces[ns].services[svc].index = data.nodes.length - 1

        data.links.push({
          'source': cluster.namespaces[ns].index,
          'target': cluster.namespaces[ns].services[svc].index,
        })

        nodeGroup++
        for (var p in cluster.namespaces[ns].services[svc].pods) {
          data.nodes.push({
            'name': cluster.namespaces[ns].services[svc].pods[p],
            'group': nodeGroup,
            'type': 'pod',
            'size': 3
          })

          data.links.push({
            'source': cluster.namespaces[ns].services[svc].index,
            'target': data.nodes.length - 1,
          })

          data.links.push({
            'source': cluster.nodes[getPodNode(cluster.nodes, cluster.namespaces[ns].services[svc].pods[p])].index,
            'target': data.nodes.length - 1,
          })
        }
      }
    }

    return data
  }

  function getPodNode(nodes, pod){
    for(var n in nodes){
      if(nodes[n].pods.indexOf(pod) !== -1){
        return n
      }
    }
    return -1
  }
})()
