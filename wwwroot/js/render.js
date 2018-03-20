let tokenSymbol = 'ZIL'
let emptySize = 1
// let targetAddress = '0x28d804Bf2212E220BC2B7B6252993Db8286dF07f'
// let targetAddress = '0x91e65a0e5ff0f0e8fba65f3636a7cd74f4c9f0e2'

/// ====================================

let [, controller, targetAddress] = window.location.pathname.split('/')
if (controller.toLowerCase() === 'address' && targetAddress.length) {
  console.log('* loading', targetAddress)
  $.get('/api/txs/' + targetAddress, data => {
    console.log('* loaded', data)
    parse(data)
    update()
  })
}

/// ====================================

const d3 = d3 || {}
let w = window.innerWidth
let h = window.innerHeight

let node
let link

let links = []
let nodes = {}

function parse(data) {
  data.forEach(node => {
    nodes[node.to] = node
  })
  nodes[targetAddress] = _.find(data, { tx: 'root' })

  data.forEach((d, i) => {
    d.size = Math.sqrt(d.balance) / 100 || emptySize
    if (d.tx === 'root') {
      return
    }
    links.push({
      id: `link-${i}`,
      source: nodes[d.from],
      target: nodes[d.to],
      amount: d.amount,
      label: d.data && d.amount ? `${d.amount} ZIL` : '',
      topLevel: d.from.toLowerCase() === targetAddress.toLowerCase()
    })
  })
  console.log('links', links)
  console.log('nodes', nodes)
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

d3.select(window).on('resize', resize)

var svg = d3
  .select('body')
  .append('svg:svg')
  .attr('width', w)
  .attr('height', h)
  .attr('pointer-event', 'all')
  .call(zoom)

var vis = svg.append('svg:g')

/// ============

function update() {
  // restart the force layout.
  force
    .nodes(d3.values(nodes))
    .links(links)
    .start()

  // select the links
  link = vis
    .append('svg:g')
    .selectAll('path')
    .data(force.links(), d => d.id)

  // enter links
  link
    .enter()
    .append('svg:path')
    .attr('class', d => 'link' + (d.topLevel ? ' top-level' : ''))
    .attr('marker-end', 'url(#end)')
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y)
    .attr('id', d => d.id)

  // remove exit
  link.exit().remove()

  // create node
  node = vis.selectAll('.node').data(force.nodes(), d => d.tx)

  // enter node
  node
    .enter()
    .append('g')
    .attr('class', d => 'node layer-' + d.layer)
    .on('mouseover', selectNode)
    .call(drag)

  // add circle
  node.append('circle').attr('r', d => d.size)

  // add balance rect
  node
    .append('rect')
    .attr('rx', 4)
    .attr('ry', 4)
    .attr('x', 0)
    .attr('y', -8)
    .attr('width', d => {
      if (d.balance !== undefined) {
        const str = formatTokenNumber(d.balance, tokenSymbol)
        return $.fn.textWidth(str, '10px sans-serif') + 10
      }
    })
    .attr('height', 16)
    .attr('class', 'info hid')
    .on('click', openEtherscan)

  // add balance text
  const text = node.append('text').attr('class', 'text hid')

  text
    .append('tspan')
    .attr('dy', '10px')
    .attr('x', 5)
    .attr('y', -6)
    .text(d => {
      if (d.balance !== undefined) {
        return formatTokenNumber(d.balance, tokenSymbol)
      }
    })

  // remove exit
  node.exit().remove()

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
  /*
  link.attr('d', d => {
    const dx = d.target.x - d.source.x
    const dy = d.target.y - d.source.y
    const dr = Math.sqrt(dx * dx + dy * dy)

    return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${
      d.target.y
    }`
  }) */

  link.attr(
    'd',
    d =>
      d.source.x < d.target.x
        ? `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`
        : `M${d.target.x},${d.target.y}L${d.source.x},${d.source.y}`
  )

  node.attr('transform', d => 'translate(' + d.x + ',' + d.y + ')')
}

function openEtherscan(d) {
  window.open(`https://etherscan.io/tx/${d.tx}#tokentxns`)
}

function resize() {
  var width = window.innerWidth
  var height = window.innerHeight
  svg.attr('width', width).attr('height', height)
  force.size([width, height]).resume()
  w = width
  h = height
  console.log('resized', width, height)
}

function centerOn(d) {
  d3.event.stopPropagation()
  var dcx = window.innerWidth / 2 - d.x * zoom.scale()
  var dcy = window.innerHeight / 2 - d.y * zoom.scale()
  zoom.translate([dcx, dcy])
  vis.attr(
    'transform',
    'translate(' + dcx + ',' + dcy + ')scale(' + zoom.scale() + ')'
  )
  console.log('centered', dcx, dcy)
}

function selectNode(d) {
  d3.selectAll('.node').classed('selected', false)
  d3.select(this).classed('selected', true)

  d3.selectAll('.hid').style('display', 'none')
  d3
    .select(this)
    .selectAll('.hid')
    .style('display', 'inherit')

  d3.select(this).moveToFront()
}

function formatTokenNumber(num, tokenSymbol) {
  if (!num) {
    return ''
  }
  const balance = new Intl.NumberFormat().format(num)
  return `${balance} ${tokenSymbol}`
}

/// ====================================
