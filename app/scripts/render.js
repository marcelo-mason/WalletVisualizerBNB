;(function($, _, d3, socket, Graph) {
  let emptySize = 3
  let tokenSymbol = ''
  // let rootAddress = '0x28d804Bf2212E220BC2B7B6252993Db8286dF07f'
  // let rootAddress = '0x91e65a0e5ff0f0e8fba65f3636a7cd74f4c9f0e2'

  /// ====================================

  console.log('* rendering')

  let [
    ,
    controller,
    rootAddress,
    maxLayers,
    symbol,
    tokenAddress,
    decimals
  ] = window.location.pathname.split('/')

  console.log(window.location.pathname.split('/'))

  if (controller.toLowerCase() === 'start') {
    console.log('* loading', rootAddress)

    tokenSymbol = symbol

    socket.on('layer', o => {
      console.log('* received layer', o)
      parse(o.txs, o.layer)
    })

    socket.emit('start', {
      address: rootAddress,
      maxLayers,
      tokenAddress,
      decimals
    })

    /*
    $.get(`/api/txs/${rootAddress}/${layers || 2}`, data => {
      console.log('* loaded', data)
      parse(data)
      update()
    }) */
  }

  /// ====================================

  let w = window.innerWidth
  let h = window.innerHeight

  let node
  let link
  let labelText

  let links = []
  let nodes = {}

  let graph

  function parse(layer = [], layerNum) {
    layer.forEach(node => {
      if (!nodes[node.to.toLowerCase()]) {
        nodes[node.to.toLowerCase()] = node
      }
    })

    layer.forEach((node, i) => {
      node.size = Math.sqrt(node.balance) / 100 || emptySize
      if (node.id === 'root') {
        return
      }
      const source = nodes[node.from.toLowerCase()]
      const target = nodes[node.to.toLowerCase()]
      const exist = _.find(links, { source, target })
      if (!exist)
        links.push({
          id: `link-${layerNum}-${i}`,
          source,
          target,
          backwards: node.backwards,
          same: node.same,
          layer: layerNum
        })
    })

    console.log('links', links)
    console.log('nodes', nodes)

    // set up pathfinding

    graph = new Graph(links)

    update()
  }

  var force = d3.layout
    .force()
    .size([w, h - 160])
    .on('tick', tick)
    .gravity(0.1)
    .charge(d => -d.size * 60)
    .linkDistance(d => 20 + d.target.size + d.source.size)

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
  var $links = vis.append('g.links')
  var $nodes = vis.append('g.nodes')

  /// ============

  function update() {
    // restart the force layout.
    force
      .nodes(d3.values(nodes))
      .links(links)
      .start()

    // select the links
    link = $links.selectAll('path').data(force.links(), d => d.id)

    // enter links
    link
      .enter()
      .append('svg:path')
      .attr(
        'class',
        d =>
          `link layer-${d.layer} same-${d.same || 0} ${
            d.target.user ? 'user' : ''
          }`
      )
      .attr('marker-end', 'url(#end)')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
      .attr('id', d => d.id)

    // remove exit
    link.exit().remove()

    // create node
    node = $nodes.selectAll('.node').data(force.nodes(), d => d.id)

    // enter node
    node
      .enter()
      .append('g')
      .attr('class', d => `node layer-${d.layer} ${d.user ? 'user' : ''}`)
      .on('mouseover', selectNode)
      .on('contextmenu', openEtherscan)
      .call(drag)

    node.selectAll('*').remove()

    // add circle
    node.append('circle').attr('r', d => d.size)

    // add balance text
    node
      .append('text')
      .attr('class', 'text hid')
      .attr('x', 0)
      .attr('y', 3)
      .text(d => formatTokenNumber(d.balance, tokenSymbol))

    node
      .append('text')
      .attr('class', 'text-small hid')
      .attr('x', 0)
      .attr('y', 14)
      .text(d => d.user)

    // remove exit
    node.exit().remove()
    /*
    // select the links
    labelText = vis
      .append('svg:g')
      .selectAll('.link-label')
      .data(force.links(), d => d.id)

    labelText
      .enter()
      .append('text')
      .attr('class', 'link-label')
      .append('textPath')
      .attr('xlink:href', (d, i) => '#link-' + i)
      .attr('startOffset', (d, i) => 3 / 20)
      .text(d => formatTokenNumber(d.amount, tokenSymbol))

    labelText.exit().remove()
    */
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
  }) 
  */
    if (link) {
      link.attr(
        'd',
        d =>
          d.source.x < d.target.x
            ? `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`
            : `M${d.target.x},${d.target.y}L${d.source.x},${d.source.y}`
      )
    }

    if (node) {
      node.attr('transform', d => 'translate(' + d.x + ',' + d.y + ')')
    }
  }

  function openEtherscan(d) {
    d3.event.preventDefault()
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
    d3.selectAll('.link').classed('selected', false)
    // d3.selectAll('.link-label').style('display', 'none')
    d3.select(this).classed('selected', true)
    d3.selectAll('.hid').style('display', 'none')
    d3
      .select('.info-panel')
      .selectAll('div')
      .remove()

    d3.select(this).moveToFront()

    // highlight descendants

    var pathData = graph.findShortestPath('root', d.id)
    // console.log('pathData', pathData)

    if (pathData) {
      const txs = d3
        .selectAll('.link')
        .filter(
          d =>
            pathData.indexOf(d.source.id) > -1 &&
            pathData.indexOf(d.target.id) > -1
        )

      txs
        .classed('selected', true)
        .moveToFront()
        .transition()
        .duration(400)

      const descendants = d3
        .selectAll('.node')
        .filter(d => pathData.indexOf(d.id) > -1)

      descendants
        .classed('selected', true)
        .moveToFront()
        .transition()
        .duration(400)

      // unhide balances
      descendants.selectAll('.hid').style('display', 'inherit')
      txs.selectAll('.link-label').style('display', 'inherit')
    } else {
      console.log('!! no path data')
    }
  }

  function formatTokenNumber(num, tokenSymbol) {
    if (!num) {
      return ''
    }
    const balance = new Intl.NumberFormat().format(num)
    return `${balance} ${tokenSymbol}`
  }
})($, _, d3, socket, Graph)
