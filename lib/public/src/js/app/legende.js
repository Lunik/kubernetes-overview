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
