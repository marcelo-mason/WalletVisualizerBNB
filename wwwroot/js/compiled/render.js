'use strict';

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
    node.size = node.data.size || 10;
    nodes.push(node);
    return node.size;
  }

  root.size = recurse(root);
  return nodes;
}

$.get('api/txs/0x28d804Bf2212E220BC2B7B6252993Db8286dF07f', function (data) {
  root = stratify(data);
  root.fixed = true;
  root.x = w / 2;
  root.y = h / 2 - 80;

  update();
});

// --------------------------

var force = d3.layout.force().size([w, h - 160]).on('tick', tick).gravity(0.1).charge(-200).linkDistance(50);

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

// ----------------------------

function update() {
  var nodes = flatten(root);
  var links = d3.layout.tree().links(nodes);

  // Restart the force layout.
  force.nodes(nodes).links(links).start();

  link = vis.selectAll('.link').data(links, function (d) {
    return d.target.id;
  });

  link.exit().remove();

  link.enter().insert('line').attr('class', 'link').attr('x1', function (d) {
    return d.source.x;
  }).attr('y1', function (d) {
    return d.source.y;
  }).attr('x2', function (d) {
    return d.target.x;
  }).attr('y2', function (d) {
    return d.target.y;
  });

  node = vis.selectAll('.node').data(nodes, function (d) {
    return d.id;
  });

  node.exit().remove();

  node.enter().append('g').attr('class', 'node').call(drag);

  node.append('circle').attr('class', 'node-circle').attr('r', function (d) {
    return d.size;
  }).style('fill', color);

  node.append('text').attr('x', 12).attr('y', '.35em').text(function (d) {
    return new Intl.NumberFormat().format(d.data.amount);
  });
}

function tick() {
  link.attr('x1', function (d) {
    return d.source.x;
  }).attr('y1', function (d) {
    return d.source.y;
  }).attr('x2', function (d) {
    return d.target.x;
  }).attr('y2', function (d) {
    return d.target.y;
  });

  node.attr('transform', function (d) {
    return 'translate(' + d.x + ',' + d.y + ')';
  });
}

// Toggle children on click.
function click(d) {
  if (!d.parent) {
    return;
  }
  if (!('_children' in d || 'children' in d)) {
    return;
  }
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update();
}

// Color leaf nodes orange, and packages white or blue.
function color(d) {
  if (d._children) {
    return '#3182bd';
  }
  if (d.data.layer === 3) {
    return '#ffffff';
  }
  return '#ffffff';
}