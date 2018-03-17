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

var force = d3.layout
  .force()
  .size([w, h - 160])
  .on('tick', tick)
  .gravity(0.1)
  .charge(-120)
  .linkDistance(30)

var vis = d3
  .select('body')
  .append('svg:svg')
  .attr('width', w)
  .attr('height', h)
  .append('svg:g')

function update() {
  var nodes = flatten(root)
  var links = d3.layout.tree().links(nodes)

  // Restart the force layout.
  force
    .nodes(nodes)
    .links(links)
    .start()

  // Update the links…
  link = vis.selectAll('line.link').data(links, d => d.target.id)

  // Exit any old links.
  link.exit().remove()

  // Enter any new links.
  link
    .enter()
    .insert('line', '.node')
    .attr('class', 'link')
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y)

  // Update the nodes…
  node = vis
    .selectAll('circle.node')
    .data(nodes, d => d.id)
    .style('fill', color)

  // Exit any old nodes.
  node.exit().remove()

  // Enter any new nodes.
  node
    .enter()
    .append('svg:circle')
    .attr('class', 'node')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('r', d => d.size)
    .style('fill', color)
    .on('click', click)
    .call(force.drag)

  node
    .append('svg:text')
    .attr('dy', '1em')
    .attr('font-size', d => d.size + 'px')
    .text(d => new Intl.NumberFormat().format(d.data.amount))
}

function tick() {
  link
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y)

  node.attr('cx', d => d.x).attr('cy', d => d.y)
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
