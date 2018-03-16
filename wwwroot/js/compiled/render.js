'use strict';

var w = $(document).width();
var h = $(document).height();
var node;
var link;
var root;

var stratify = d3.stratify().id(function (d) {
  return d.tx;
}).parentId(function (d) {
  return d.parent;
});

$.get('api/txs/0x28d804Bf2212E220BC2B7B6252993Db8286dF07f', function (data) {
  root = stratify(data);
  root.fixed = true;
  root.x = w / 2;
  root.y = h / 2 - 80;
  root.size = 100;
  update();
});

var force = d3.layout.force().on('tick', tick).gravity(0.1).charge(-120).linkDistance(30).size([w, h - 160]);

var vis = d3.select('body').append('svg:svg').attr('width', w).attr('height', h);

function update() {
  var nodes = flatten(root);
  var links = d3.layout.tree().links(nodes);

  console.log('root', root);
  console.log('nodes', nodes);
  console.log('links', links);

  // Restart the force layout.
  force.nodes(nodes).links(links).start();

  // Update the links…
  link = vis.selectAll('line.link').data(links, function (d) {
    return d.target.id;
  });

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

  // Exit any old links.
  link.exit().remove();

  // Update the nodes…
  node = vis.selectAll('circle.node').data(nodes, function (d) {
    return d.id;
  }).style('fill', color);

  node.transition().attr('r', function (d) {
    return d.size;
  });

  // Enter any new nodes.
  node.enter().append('svg:circle').attr('class', 'node').attr('cx', function (d) {
    return d.x;
  }).attr('cy', function (d) {
    return d.y;
  }).attr('r', function (d) {
    return d.size;
  })
  // .attr('r', d => (d.children ? 4.5 : d.size))
  .style('fill', color).on('click', click).call(force.drag);

  // Exit any old nodes.
  node.exit().remove();
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
  });
}

// Color leaf nodes orange, and packages white or blue.
function color(d) {
  if (d._children) {
    return '#3182bd';
  }
  if (d.data.layer === 1) {
    return '#2d2d2d';
  }
  if (d.data.layer === 2) {
    return '#aaaaaa';
  }
  if (d.data.layer === 3) {
    return '#ffffff';
  }
  return '#ffffff';
}

// Toggle children on click.
function click(d) {
  if (!d.parent) {
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

// Returns a list of all nodes under the root.
function flatten(root) {
  var nodes = [];

  function recurse(node) {
    if (node.children) {
      node.children.forEach(recurse);
    }
    node.size = node.data.size || 1;
    nodes.push(node);
    return node.size;
  }

  root.size = recurse(root);
  return nodes;
}