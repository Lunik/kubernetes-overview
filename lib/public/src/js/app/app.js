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
  var CLUSTER = {}

  function setupLegende () {
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
    DIAGRAM.vis = d3.select('.diagram')
      .append('svg:svg')
      .attr('width', w)
      .attr('height', h)

    DIAGRAM.nodeGroup = 0
    d3.json('/cluster.json', function (json) {
      CLUSTER = prepareD3(json.links)
      // console.log(cluster)

      DIAGRAM.force = d3.layout.force()
        .charge(-150)
        .linkDistance(30)
        .nodes(CLUSTER.nodes)
        .links(CLUSTER.links)
        .size([w, h])

      DIAGRAM.force.start()

      DIAGRAM.links = DIAGRAM.force.links()

      DIAGRAM.nodes = DIAGRAM.force.nodes()

      DIAGRAM.vis.style('opacity', 1e-6)
        .transition()
        .duration(5000)
        .style('opacity', 1)

      drawElements()
    })
  }

  function drawElements () {
      DIAGRAM.link = DIAGRAM.vis.selectAll('line.link').data(DIAGRAM.links)

      DIAGRAM.link.enter().insert('svg:line')
        .attr('class', 'link')
        .style('stroke-width', 1.5)
        .attr('x1', function (d) { return d.source.x; })
        .attr('y1', function (d) { return d.source.y; })
        .attr('x2', function (d) { return d.target.x; })
        .attr('y2', function (d) { return d.target.y; })

      DIAGRAM.link.exit().remove()

      DIAGRAM.node = DIAGRAM.vis.selectAll('circle.node').data(DIAGRAM.nodes)

      DIAGRAM.node.enter().insert('svg:circle')
        .attr('class', 'node')
        .attr('id', function (d) { return d.name })
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; })
        .attr('r', function (d) { return d.size; })
        .style('fill', function (d) { return fill(d.type); })
        .call(DIAGRAM.force.drag)

      if(DIAGRAM.node.selectAll('title')[0].length == 0){
        DIAGRAM.node.append('svg:title')
          .text(function (d) { return d.name; })
      }

      DIAGRAM.node.exit().remove()

      DIAGRAM.force.on('tick', function () {
        DIAGRAM.link.attr('x1', function (d) { return d.source.x; })
          .attr('y1', function (d) { return d.source.y; })
          .attr('x2', function (d) { return d.target.x; })
          .attr('y2', function (d) { return d.target.y; })

        DIAGRAM.node.attr('cx', function (d) { return d.x; })
          .attr('cy', function (d) { return d.y; })
      })

      DIAGRAM.force.start()
  }

  function prepareD3 (cluster) {
    var data = {
      'nodes': [],
      'links': []
    }

    var nodeIndex = 0
    DIAGRAM.nodeIndex = DIAGRAM.nodeIndex ? DIAGRAM.nodeIndex : {}
    DIAGRAM.nodeId = DIAGRAM.nodeId ? DIAGRAM.nodeId : 0

    for (var n in cluster.nodes) {
      DIAGRAM.nodeGroup++

      DIAGRAM.nodeIndex[n] = DIAGRAM.nodeIndex[n] ? DIAGRAM.nodeIndex[n] : DIAGRAM.nodeId++
      data.nodes[DIAGRAM.nodeIndex[n]] = {
        'name': n,
        'group': DIAGRAM.nodeGroup,
        'type': 'node',
        'size': config.node.size
      }

      cluster.nodes[n].index = DIAGRAM.nodeIndex[n]
    }

    for (var ns in cluster.namespaces) {
      DIAGRAM.nodeGroup++
      DIAGRAM.nodeIndex[ns] = DIAGRAM.nodeIndex[ns] ? DIAGRAM.nodeIndex[ns] : DIAGRAM.nodeId++
      data.nodes[DIAGRAM.nodeIndex[ns]] = {
        'name': ns,
        'group': DIAGRAM.nodeGroup,
        'type': 'namespace',
        'size': config.namespace.size
      }

      cluster.namespaces[ns].index = DIAGRAM.nodeIndex[ns]

      for (var svc in cluster.namespaces[ns].services) {
        DIAGRAM.nodeGroup++
        DIAGRAM.nodeIndex[ns+'-'+svc] = DIAGRAM.nodeIndex[ns+'-'+svc] ? DIAGRAM.nodeIndex[ns+'-'+svc] : DIAGRAM.nodeId++
        data.nodes[DIAGRAM.nodeIndex[ns+'-'+svc]] = {
          'name': svc,
          'group': DIAGRAM.nodeGroup,
          'type': 'service',
          'size': config.service.size
        }

        cluster.namespaces[ns].services[svc].index = DIAGRAM.nodeIndex[ns+'-'+svc]

        data.links.push({
          'source': cluster.namespaces[ns].index,
          'target': cluster.namespaces[ns].services[svc].index
        })

        DIAGRAM.nodeGroup++
        for (var p in cluster.namespaces[ns].services[svc].pods) {
          DIAGRAM.nodeIndex[ns+'-'+svc+'-'+p] = DIAGRAM.nodeIndex[ns+'-'+svc+'-'+p] ? DIAGRAM.nodeIndex[ns+'-'+svc+'-'+p] : DIAGRAM.nodeId++
          data.nodes[DIAGRAM.nodeIndex[ns+'-'+svc+'-'+p]] = {
            'name': cluster.namespaces[ns].services[svc].pods[p],
            'group': DIAGRAM.nodeGroup,
            'type': 'pod',
            'size': config.pod.size
          }

          data.links.push({
            'source': cluster.namespaces[ns].services[svc].index,
            'target': DIAGRAM.nodeIndex[ns+'-'+svc+'-'+p]
          })

          data.links.push({
            'source': cluster.nodes[getPodNode(cluster.nodes, cluster.namespaces[ns].services[svc].pods[p])].index,
            'target': DIAGRAM.nodeIndex[ns+'-'+svc+'-'+p]
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

  function indexOfObj (array, obj) {
    for (var key in array) {
      if (array[key].name === obj.name ||
        ((array[key].source && (array[key].source === obj.source || array[key].source.index === obj.source)) &&
        ((array[key].target && (array[key].target === obj.target || array[key].target.index === obj.target))))) {
        return key
      }
    }
    return -1
  }

  function arrayDiff (a1, a2) {
    a1 = a1.slice(0)
    a2 = a2.slice(0)
    var diff = {
      'add': [],
      'remove': []
    }
    for (var key in a2) {

      var index = indexOfObj(a1, a2[key])
      if (index === -1) {
        diff.add.push(a2[key])
      } else {
        a1.splice(index, 1)
      }
    }
    diff.remove = a1

    return diff
  }

  setupLegende()
  drawDiagram()

  setInterval(function(){
    window.location.reload()
  }, 30000)
})()
