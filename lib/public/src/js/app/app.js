;(function () {
  var w = $(window).width()
  var h = $(window).height()
  var fill = d3.scale.category10()

  var config = {
    'node': {
      'color': fill('node'),
      'size': 15
    },
    'namespace': {
      'color': fill('namespace'),
      'size': 7
    },
    'service': {
      'color': fill('service'),
      'size': 5
    },
    'pod': {
      'color': fill('pod'),
      'size': 3
    }
  }

  var DIAGRAM = {}

  function setupLegende(){
    $('.legende circle.node').attr('fill', config.node.color)
      .attr('cx', config.node.size)
      .attr('cy', config.node.size)
      .attr('r', config.node.size)
    $('.legende svg.node')
      .css('width', config.node.size * 2)
      .css('height', config.node.size * 2)

    $('.legende circle.namespace').attr('fill', config.namespace.color)
      .attr('cx', config.namespace.size)
      .attr('cy', config.namespace.size)
      .attr('r', config.namespace.size)
    $('.legende svg.namespace')
      .css('width', config.namespace.size * 2)
      .css('height', config.namespace.size * 2)
      .css('margin-left', config.node.size - config.namespace.size)

    $('.legende circle.service').attr('fill', config.service.color)
      .attr('cx', config.service.size)
      .attr('cy', config.service.size)
      .attr('r', config.service.size)
    $('.legende svg.service')
      .css('width', config.service.size * 2)
      .css('height', config.service.size * 2)
      .css('margin-left', config.node.size - config.service.size)

    $('.legende circle.pod').attr('fill', config.pod.color)
      .attr('cx', config.pod.size)
      .attr('cy', config.pod.size)
      .attr('r', config.pod.size)
    $('.legende svg.pod')
      .css('width', config.pod.size * 2)
      .css('height', config.pod.size * 2)
      .css('margin-left', config.node.size - config.pod.size)
  }

  function drawDiagram () {
    $('.diagram svg').attr('id', 'remove')
    var redraw = false

    if(DIAGRAM.vis){
      var redraw = true
    }

    if(!redraw){
      DIAGRAM.vis = d3.select('.diagram')
        .append('svg:svg')
        .attr('width', w)
        .attr('height', h)
    }

    d3.json('/cluster.json', function (json) {
      var cluster = prepareD3(json.links)
      //console.log(cluster)

      if(!redraw){
        DIAGRAM.force = d3.layout.force()
          .charge(-150)
          .linkDistance(30)
          .nodes(cluster.nodes)
          .links(cluster.links)
          .size([w, h])
      } else {
        DIAGRAM.force.nodes(cluster.nodes).links(cluster.links)
      }

      DIAGRAM.force.start()

      DIAGRAM.links = DIAGRAM.force.links()
      DIAGRAM.link = DIAGRAM.vis.selectAll('line.link').data(DIAGRAM.links)

      DIAGRAM.link.enter().append('svg:line')
        .attr('class', 'link')
        .style('stroke-width', 1.5)
        .attr('x1', function (d) { return d.source.x; })
        .attr('y1', function (d) { return d.source.y; })
        .attr('x2', function (d) { return d.target.x; })
        .attr('y2', function (d) { return d.target.y; })

      DIAGRAM.nodes = DIAGRAM.force.nodes()
      DIAGRAM.node = DIAGRAM.vis.selectAll('circle.node').data(DIAGRAM.nodes)

      DIAGRAM.node.enter().append('svg:circle')
        .attr('class', 'node')
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; })
        .attr('r', function (d) { return d.size; })
        .style('fill', function (d) { return fill(d.type); })
        .call(DIAGRAM.force.drag)

      DIAGRAM.node.append('svg:title')
        .text(function (d) { return d.name; })

      if(!redraw){
        DIAGRAM.vis.style('opacity', 1e-6)
          .transition()
          .duration(500)
          .style('opacity', 1)
      }

      DIAGRAM.force.on('tick', function () {
        DIAGRAM.link.attr('x1', function (d) { return d.source.x; })
          .attr('y1', function (d) { return d.source.y; })
          .attr('x2', function (d) { return d.target.x; })
          .attr('y2', function (d) { return d.target.y; })

        DIAGRAM.node.attr('cx', function (d) { return d.x; })
          .attr('cy', function (d) { return d.y; })
      })
    })

  }

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
        'size': config.node.size
      })

      cluster.nodes[n].index = data.nodes.length - 1
    }

    for (var ns in cluster.namespaces) {
      nodeGroup++
      data.nodes.push({
        'name': ns,
        'group': nodeGroup,
        'type': 'namespace',
        'size': config.namespace.size
      })

      cluster.namespaces[ns].index = data.nodes.length - 1

      for (var svc in cluster.namespaces[ns].services) {
        nodeGroup++
        data.nodes.push({
          'name': svc,
          'group': nodeGroup,
          'type': 'service',
          'size': config.service.size
        })

        cluster.namespaces[ns].services[svc].index = data.nodes.length - 1

        data.links.push({
          'source': cluster.namespaces[ns].index,
          'target': cluster.namespaces[ns].services[svc].index
        })

        nodeGroup++
        for (var p in cluster.namespaces[ns].services[svc].pods) {
          data.nodes.push({
            'name': cluster.namespaces[ns].services[svc].pods[p],
            'group': nodeGroup,
            'type': 'pod',
            'size': config.pod.size
          })

          data.links.push({
            'source': cluster.namespaces[ns].services[svc].index,
            'target': data.nodes.length - 1
          })

          data.links.push({
            'source': cluster.nodes[getPodNode(cluster.nodes, cluster.namespaces[ns].services[svc].pods[p])].index,
            'target': data.nodes.length - 1
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

  $(window).click(drawDiagram)
})()
