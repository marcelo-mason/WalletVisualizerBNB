'use strict';

var tokenSymbol = 'ZIL';
var targetAddress = '0x28d804Bf2212E220BC2B7B6252993Db8286dF07f';
// let targetAddress = '0x91e65a0e5ff0f0e8fba65f3636a7cd74f4c9f0e2'
var emptySize = 1;

/// ====================================

$.get('/api/txs/' + targetAddress, function (data) {
  console.log(data);
  parse(data);
  update();
});

/// ====================================

var d3 = d3 || {};
var w = window.innerWidth;
var h = window.innerHeight;

var node = void 0;
var link = void 0;

var links = [];
var nodes = {};

function parse(data) {
  data.forEach(function (node) {
    nodes[node.to] = node;
  });
  nodes[targetAddress] = _.find(data, { tx: 'root' });

  data.forEach(function (d, i) {
    d.size = Math.sqrt(d.balance) / 100 || emptySize;
    if (d.tx === 'root') {
      return;
    }
    links.push({
      id: 'link-' + i,
      source: nodes[d.from],
      target: nodes[d.to],
      amount: d.amount,
      label: d.data && d.amount ? d.amount + ' ZIL' : ''
    });
  });
  console.log('links', links);
  console.log('nodes', nodes);
}

var force = d3.layout.force().size([w, h - 160]).on('tick', tick).gravity(0.1).charge(-200).charge(function (d) {
  return -d.size * 50;
}).linkDistance(function (d) {
  return 25 + d.target.size / 2 + d.source.size / 2;
});

var drag = force.drag().origin(function (d) {
  return d;
}).on('dragstart', function () {
  d3.event.sourceEvent.stopPropagation();
}).on('drag', function (d) {
  d3.select(undefined).attr('x', d.x = d3.event.x).attr('y', d.y = d3.event.y);
});

var zoom = d3.behavior.zoom().translate([0, 0]).scale(1).scaleExtent([-8, 8]).on('zoom', function () {
  console.log('here', d3.event.translate.toString(), d3.event.scale);
  vis.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
});

d3.select(window).on('resize', resize);

var svg = d3.select('body').append('svg:svg').attr('width', w).attr('height', h).attr('pointer-event', 'all').call(zoom);

var vis = svg.append('svg:g');

/// ============

function update() {
  // restart the force layout.
  force.nodes(d3.values(nodes)).links(links).start();

  // select the links
  link = vis.append('svg:g').selectAll('path').data(force.links(), function (d) {
    return d.id;
  });

  // enter links
  link.enter().append('svg:path').attr('class', function (d) {
    return 'link ' + (d.isRoot ? 'top-level' : '');
  }).attr('marker-end', 'url(#end)').attr('x1', function (d) {
    return d.source.x;
  }).attr('y1', function (d) {
    return d.source.y;
  }).attr('x2', function (d) {
    return d.target.x;
  }).attr('y2', function (d) {
    return d.target.y;
  }).attr('id', function (d) {
    return d.id;
  }).on('mouseover', function (d) {
    d3.select(this).style('display', 'inherit');
  });

  // remove exit
  link.exit().remove();

  // create node
  node = vis.selectAll('.node').data(force.nodes(), function (d) {
    return d.tx;
  });

  // enter node
  node.enter().append('g').attr('class', function (d) {
    return 'node layer-' + d.layer;
  }).on('click', centerOn).on('mouseover', function (d) {
    d3.select(this).selectAll('.hid').style('display', 'inherit');
  }).on('mouseout', function (d) {
    d3.select(this).selectAll('.hid').style('display', 'none');
  });

  // add circle
  node.append('circle').attr('r', function (d) {
    return d.size;
  });

  // add info rect
  node.append('rect').attr('rx', 6).attr('ry', 6).attr('x', 20).attr('y', -10).attr('width', 80).attr('height', 20).attr('class', 'info hid');

  // add balance text
  node.append('text').attr('class', 'text hid').attr('y', '.35em').attr('x', 25).text(function (d) {
    if (d.balance !== undefined) {
      var balance = new Intl.NumberFormat().format(d.balance);
      return balance + ' ' + tokenSymbol;
    }
  });

  // remove exit
  node.exit().remove();

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

  link.attr('d', function (d) {
    return d.source.x < d.target.x ? 'M' + d.source.x + ',' + d.source.y + 'L' + d.target.x + ',' + d.target.y : 'M' + d.target.x + ',' + d.target.y + 'L' + d.source.x + ',' + d.source.y;
  });

  node.attr('transform', function (d) {
    return 'translate(' + d.x + ',' + d.y + ')';
  });
}

function click(d) {
  window.open('https://etherscan.io/tx/' + d.tx + '#tokentxns');
}

function centerOn(d) {
  d3.event.stopPropagation();
  var dcx = window.innerWidth / 2 - d.x * zoom.scale();
  var dcy = window.innerHeight / 2 - d.y * zoom.scale();
  zoom.translate([dcx, dcy]);
  vis.attr('transform', 'translate(' + dcx + ',' + dcy + ')scale(' + zoom.scale() + ')');
  console.log('centered', dcx, dcy);
}

function resize() {
  var width = window.innerWidth;
  var height = window.innerHeight;
  svg.attr('width', width).attr('height', height);
  force.size([width, height]).resume();
  w = width;
  h = height;
  console.log('resized', width, height);
}

/// ====================================