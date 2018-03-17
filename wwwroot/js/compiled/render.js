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

var force = d3.layout.force().size([w, h - 160]).on('tick', tick).gravity(0.1).charge(-120).linkDistance(30);

var vis = d3.select('body').append('svg:svg').attr('width', w).attr('height', h).attr('pointer-events', 'all').call(d3.behavior.zoom().on('zoom', update)).append('svg:g');

function update() {
  if (d3.event) {
    console.log('here', d3.event.translate, d3.event.scale);
    vis.attr('transform', 'translate(' + d3.event.translate + ')' + ' scale(' + d3.event.scale + ')');
  }

  var nodes = flatten(root);
  var links = d3.layout.tree().links(nodes);

  // Restart the force layout.
  force.nodes(nodes).links(links).start();

  // Update the links…
  link = vis.selectAll('line.link').data(links, function (d) {
    return d.target.id;
  });

  // Exit any old links.
  link.exit().remove();

  // Enter any new links.
  link.enter().insert('line', '.node').attr('class', 'link').attr('x1', function (d) {
    return d.source.x;
  }).attr('y1', function (d) {
    return d.source.y;
  }).attr('x2', function (d) {
    return d.target.x;
  }).attr('y2', function (d) {
    return d.target.y;
  });

  // Update the nodes…
  node = vis.selectAll('circle.node').data(nodes, function (d) {
    return d.id;
  }).style('fill', color);

  // Exit any old nodes.
  node.exit().remove();

  // Enter any new nodes.
  node.enter().append('svg:circle').attr('class', 'node').attr('cx', function (d) {
    return d.x;
  }).attr('cy', function (d) {
    return d.y;
  }).attr('r', function (d) {
    return d.size;
  }).style('fill', color).on('click', click).call(force.drag);

  node.append('svg:text').attr('dy', '1em').attr('font-size', function (d) {
    return d.size + 'px';
  }).text(function (d) {
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

  node.attr('cx', function (d) {
    return d.x;
  }).attr('cy', function (d) {
    return d.y;
  }).attr('transform', function (d) {
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