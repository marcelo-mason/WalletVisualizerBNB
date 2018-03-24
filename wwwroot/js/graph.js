'use strict';

var Graph = function (undefined) {
  var extractKeys = function extractKeys(obj) {
    var keys = [];
    var key;
    for (key in obj) {
      Object.prototype.hasOwnProperty.call(obj, key) && keys.push(key);
    }
    return keys;
  };

  var sorter = function sorter(a, b) {
    return parseFloat(a) - parseFloat(b);
  };

  var findPaths = function findPaths(map, start, end, infinity) {
    infinity = infinity || Infinity;

    var amounts = {};
    var open = { '0': [start] };
    var predecessors = {};
    var keys;

    var addToOpen = function addToOpen(amount, vertex) {
      var key = '' + amount;
      if (!open[key]) open[key] = [];
      open[key].push(vertex);
    };

    amounts[start] = 0;

    while (open) {
      if (!(keys = extractKeys(open)).length) break;

      keys.sort(sorter);

      var key = keys[0];
      var bucket = open[key];
      var node = bucket.shift();
      var currentCost = parseFloat(key);
      var adjacentNodes = map[node] || {};

      if (!bucket.length) delete open[key];

      for (var vertex in adjacentNodes) {
        if (Object.prototype.hasOwnProperty.call(adjacentNodes, vertex)) {
          var amount = adjacentNodes[vertex];
          var totalCost = amount + currentCost;
          var vertexCost = amounts[vertex];

          if (vertexCost === undefined || vertexCost > totalCost) {
            amounts[vertex] = totalCost;
            addToOpen(totalCost, vertex);
            predecessors[vertex] = node;
          }
        }
      }
    }

    if (amounts[end] === undefined) {
      return null;
    } else {
      return predecessors;
    }
  };

  var extractShortest = function extractShortest(predecessors, end) {
    var nodes = [];
    var u = end;

    while (u) {
      nodes.push(u);
      // predecessor = predecessors[u]
      u = predecessors[u];
    }

    nodes.reverse();
    return nodes;
  };

  var findShortestPath = function findShortestPath(map, nodes) {
    var start = nodes.shift();
    var end;
    var predecessors;
    var path = [];
    var shortest;

    while (nodes.length) {
      end = nodes.shift();
      predecessors = findPaths(map, start, end);

      if (predecessors) {
        shortest = extractShortest(predecessors, end);
        if (nodes.length) {
          path.push.apply(path, shortest.slice(0, -1));
        } else {
          return path.concat(shortest);
        }
      } else {
        return null;
      }

      start = end;
    }
  };

  var toArray = function toArray(list, offset) {
    try {
      return Array.prototype.slice.call(list, offset);
    } catch (e) {
      var a = [];
      for (var i = offset || 0, l = list.length; i < l; ++i) {
        a.push(list[i]);
      }
      return a;
    }
  };

  var Graph = function Graph(links) {
    var edgeMap = {};
    links.forEach(function (link) {
      if (edgeMap[link.source.id]) {
        edgeMap[link.source.id][link.target.id] = link.amount;
      } else {
        edgeMap[link.source.id] = {};
        edgeMap[link.source.id][link.target.id] = link.amount;
      }
      if (edgeMap[link.target.id]) {
        edgeMap[link.target.id][link.source.id] = link.amount;
      } else {
        edgeMap[link.target.id] = {};
        edgeMap[link.target.id][link.source.id] = link.amount;
      }
    });

    this.map = edgeMap;
  };

  Graph.prototype.findShortestPath = function (start, end) {
    if (Object.prototype.toString.call(start) === '[object Array]') {
      return findShortestPath(this.map, start);
    } else if (arguments.length === 2) {
      return findShortestPath(this.map, [start, end]);
    } else {
      return findShortestPath(this.map, toArray(arguments));
    }
  };

  Graph.findShortestPath = function (map, start, end) {
    if (Object.prototype.toString.call(start) === '[object Array]') {
      return findShortestPath(map, start);
    } else if (arguments.length === 3) {
      return findShortestPath(map, [start, end]);
    } else {
      return findShortestPath(map, toArray(arguments, 1));
    }
  };

  return Graph;
}();