'use strict';

var tokenSymbol = 'ZIL';
var targetAddress = '0x28d804Bf2212E220BC2B7B6252993Db8286dF07f';
// let targetAddress = '0x91e65a05ff0F0E8fBA65F3636a7cd74f4c9f0E2'

/// ====================================

$.get('api/txs/' + targetAddress, function (data) {
  root = stratify(data);
  root.fixed = true;
  root.x = w / 2;
  root.y = h / 2 - 80;
  update();
});

/// ====================================

var d3 = d3 || {};
var w = $(document).width();
var h = $(document).height();
var node = void 0;
var link = void 0;
var root = void 0;

var stratify = d3.stratify().id(function (d) {
  return d.tx;
}).parentId(function (d) {
  return d.parent;
});

// Returns a list of all nodes under the root.
function flatten(root) {
  var nodes = [];

  function recurse(node) {
    if (node.children) {
      node.children.forEach(recurse);
    }
    node.size = Math.sqrt(node.data.balance) / 100 || 10;
    nodes.push(node);
  }

  recurse(root);
  root.size = 30;
  return nodes;
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

var vis = d3.select('body').append('svg:svg').attr('width', w).attr('height', h).attr('pointer-event', 'all').call(zoom).append('svg:g');

/// ============

function update() {
  var nodes = flatten(root);
  var links = d3.layout.tree().links(nodes);

  links.forEach(function (link, i) {
    link.id = 'link-' + i;
    if (link.source.data.amount) {
      link.label = link.source.data.amount + ' ZIL';
    } else {
      link.label = '';
    }
  });

  // Restart the force layout.
  force.nodes(nodes).links(links).start();

  link = vis.selectAll('.link').data(links, function (d) {
    return d.target.id;
  });

  link.exit().remove();

  link.enter().insert('svg:path').attr('class', 'link').attr('x1', function (d) {
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

  node = vis.selectAll('.node').data(nodes, function (d) {
    return d.id;
  });

  node.exit().remove();

  node.enter().append('g').attr('class', 'node').on('click', click).on('mouseover', function (d) {
    d3.select(this).moveToFront().selectAll('.hid').style('display', 'inherit');
  }).on('mouseout', function (d) {
    d3.select(this).selectAll('.hid').style('display', 'none');
  }).call(drag);

  vis.selectAll('circle').remove();

  node.append('circle').attr('r', function (d) {
    return d.size;
  });

  vis.selectAll('text').remove();

  node.append('rect').attr('rx', 6).attr('ry', 6).attr('x', 20).attr('y', -10).attr('width', 80).attr('height', 20).attr('class', 'info hid');

  node.append('text').attr('class', 'text hid').attr('y', '.35em').attr('x', 25).text(function (d) {
    if (d.data.balance !== undefined) {
      var balance = new Intl.NumberFormat().format(d.data.balance);
      return balance + ' ' + tokenSymbol;
    }
  });
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
  link.attr('d', function (d) {
    return d.source.x < d.target.x ? 'M' + d.source.x + ',' + d.source.y + 'L' + d.target.x + ',' + d.target.y : 'M' + d.target.x + ',' + d.target.y + 'L' + d.source.x + ',' + d.source.y;
  });

  node.attr('transform', function (d) {
    return 'translate(' + d.x + ',' + d.y + ')';
  });
}

function click(d) {
  window.open('https://etherscan.io/tx/' + d.data.tx);
}

/// ====================================