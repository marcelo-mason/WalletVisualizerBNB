let tokenSymbol = 'ZIL'
let targetAddress = '0x28d804Bf2212E220BC2B7B6252993Db8286dF07f'
// let targetAddress = '0x91e65a05ff0F0E8fBA65F3636a7cd74f4c9f0E2'

/// ====================================

$.get('api/txs/' + targetAddress, data => {
  root = stratify(data)
  root.fixed = true
  root.x = w / 2
  root.y = h / 2 - 80
  update()
})

/// ====================================

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
    node.size = Math.sqrt(node.data.balance) / 100 || 10
    nodes.push(node)
  }

  recurse(root)
  root.size = 30
  return nodes
}

var force = d3.layout
  .force()
  .size([w, h - 160])
  .on('tick', tick)
  .gravity(0.1)
  .charge(-200)
  .charge(d => -d.size * 50)
  .linkDistance(d => 25 + d.target.size / 2 + d.source.size / 2)

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

/// ============

function update() {
  var nodes = flatten(root)
  var links = d3.layout.tree().links(nodes)

  links.forEach((link, i) => {
    link.id = `link-${i}`
    if (link.source.data.amount) {
      link.label = `${link.source.data.amount} ZIL`
    } else {
      link.label = ''
    }
  })

  // Restart the force layout.
  force
    .nodes(nodes)
    .links(links)
    .start()

  link = vis.selectAll('.link').data(links, d => d.target.id)

  link.exit().remove()

  link
    .enter()
    .insert('svg:path')
    .attr('class', 'link')
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y)
    .attr('id', d => d.id)
    .on('mouseover', function(d) {
      d3.select(this).style('display', 'inherit')
    })

  node = vis.selectAll('.node').data(nodes, d => d.id)

  node.exit().remove()

  node
    .enter()
    .append('g')
    .attr('class', 'node')
    .on('click', click)
    .on('mouseover', function(d) {
      d3
        .select(this)
        .moveToFront()
        .selectAll('.hid')
        .style('display', 'inherit')
    })
    .on('mouseout', function(d) {
      d3
        .select(this)
        .selectAll('.hid')
        .style('display', 'none')
    })
    .call(drag)

  vis.selectAll('circle').remove()

  node.append('circle').attr('r', d => d.size)

  vis.selectAll('text').remove()

  node
    .append('rect')
    .attr('rx', 6)
    .attr('ry', 6)
    .attr('x', 20)
    .attr('y', -10)
    .attr('width', 80)
    .attr('height', 20)
    .attr('class', 'info hid')

  node
    .append('text')
    .attr('class', 'text hid')
    .attr('y', '.35em')
    .attr('x', 25)
    .text(d => {
      if (d.data.balance !== undefined) {
        const balance = new Intl.NumberFormat().format(d.data.balance)
        return `${balance} ${tokenSymbol}`
      }
    })
  /*
  linkLabel = vis.selectAll('.link-label').data(links, d => d.target.id)

  linkLabel
    .enter()
    .append('svg:text')
    .attr('text-anchor', 'middle')
    .attr('class', 'link-label')
    .append('svg:textPath')
    .attr('startOffset', '50%')
    .attr('xlink:href', d => '#' + d.id)
    .text(d => d.label) */
}

/// ====================================

function tick() {
  link.attr(
    'd',
    d =>
      d.source.x < d.target.x
        ? `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`
        : `M${d.target.x},${d.target.y}L${d.source.x},${d.source.y}`
  )

  node.attr('transform', d => 'translate(' + d.x + ',' + d.y + ')')
}

function click(d) {
  window.open(`https://etherscan.io/tx/${d.data.tx}`)
}

/// ====================================
