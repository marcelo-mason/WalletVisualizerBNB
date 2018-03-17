const d3 = d3 || {}
const w = $(document).width()
const h = $(document).height()
let node
let link
let root

const stratify = d3
  .stratify()
  .id(d => d.tx)
  .parentId(d => d.parent)

// Returns a list of all nodes under the root.
function flatten(root) {
  const nodes = []

  function recurse(node) {
    if (node.children) {
      node.children.forEach(recurse)
    }
    node.size = node.data.size || 10
    nodes.push(node)
    return node.size
  }

  root.size = recurse(root)
  return nodes
}

$.get('api/txs/0x28d804Bf2212E220BC2B7B6252993Db8286dF07f', data => {
  root = stratify(data)
  root.fixed = true
  root.x = w / 2
  root.y = h / 2 - 80

  update()
})

// --------------------------

var force = d3.layout
  .force()
  .size([w, h - 160])
  .on('tick', tick)
  .gravity(0.1)
  .charge(-200)
  .linkDistance(50)

var drag = force
  .drag()
  .origin(d => d)
  .on('dragstart', () => {
    d3.event.sourceEvent.stopPropagation()
  })
  .on('drag', d => {
    d3
      .select(this)
      .attr('x', (d.x = d3.event.x))
      .attr('y', (d.y = d3.event.y))
  })

var zoom = d3.behavior
  .zoom()
  .translate([0, 0])
  .scale(1)
  .scaleExtent([-8, 8])
  .on('zoom', () => {
    console.log('here', d3.event.translate.toString(), d3.event.scale)
    vis.attr(
      'transform',
      'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')'
    )
  })

var vis = d3
  .select('body')
  .append('svg:svg')
  .attr('width', w)
  .attr('height', h)
  .attr('pointer-event', 'all')
  .call(zoom)
  .append('svg:g')

// ----------------------------

function update() {
  var nodes = flatten(root)
  var links = d3.layout.tree().links(nodes)

  // Restart the force layout.
  force
    .nodes(nodes)
    .links(links)
    .start()

  link = vis.selectAll('.link').data(links, d => d.target.id)

  link.exit().remove()

  link
    .enter()
    .insert('line')
    .attr('class', 'link')
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y)

  node = vis.selectAll('.node').data(nodes, d => d.id)

  node.exit().remove()

  node
    .enter()
    .append('g')
    .attr('class', 'node')
    .call(drag)

  node
    .append('circle')
    .attr('class', 'node-circle')
    .attr('r', d => d.size)
    .style('fill', color)

  node
    .append('text')
    .attr('x', 12)
    .attr('y', '.35em')
    .text(d => new Intl.NumberFormat().format(d.data.amount))
}

function tick() {
  link
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y)

  node.attr('transform', d => 'translate(' + d.x + ',' + d.y + ')')
}

// Toggle children on click.
function click(d) {
  if (!d.parent) {
    return
  }
  if (!('_children' in d || 'children' in d)) {
    return
  }
  if (d.children) {
    d._children = d.children
    d.children = null
  } else {
    d.children = d._children
    d._children = null
  }
  update()
}

// Color leaf nodes orange, and packages white or blue.
function color(d) {
  if (d._children) {
    return '#3182bd'
  }
  if (d.data.layer === 3) {
    return '#ffffff'
  }
  return '#ffffff'
}
