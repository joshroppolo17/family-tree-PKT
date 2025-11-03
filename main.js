/* global vis, tinycolor, brothers, $, didYouMean */

// Mock out dependencies for testing on NodeJS. These are imported in the browser.
/* eslint-disable */
/* istanbul ignore else */
if (typeof brothers === 'undefined') { brothers = require('./relations'); }
/* istanbul ignore else */
if (typeof tinycolor === 'undefined') { tinycolor = require('tinycolor2'); }
/* istanbul ignore else */
if (typeof $ === 'undefined') { $ = require('jquery'); }
/* istanbul ignore else */
if (typeof vis === 'undefined') { vis = require('vis'); }
/* istanbul ignore else */
if (typeof didYouMean === 'undefined') { didYouMean = require('didyoumean'); }
/* eslint-enable */

var network = null;
var createNodesCalled = false;
var nodesGlobal;
var edgesGlobal;
var nodesDataSet;
var edgesDataSet;
var previousSearchFind;

var DIRECTION = { FORWARD: 0, BACKWARD: 1 };
var KEYCODE_ENTER = 13;
var familyColorGlobal = {};
var pledgeClassColorGlobal = {};

function ColorSpinner(colorObj, spinAmount) {
  this.spinAmount = spinAmount;
  this.color = new tinycolor(colorObj);
}
ColorSpinner.prototype.spin = function () {
  this.color = this.color.spin(this.spinAmount);
  return this.color.toHexString();
};

var getNewFamilyColor = (function () {
  var spinner1 = new ColorSpinner({ h: 0, s: 0.6, v: 0.9 }, 77);
  return function () { return spinner1.spin(); };
}());

var getNewPledgeClassColor = (function () {
  var spinner2 = new ColorSpinner({ h: 0, s: 0.4, v: 0.9 }, 23);
  return function () { return spinner2.spin(); };
}());

function didYouMeanWrapper(invalidName) {
  var allValidNames = brothers.map(function (bro) { return bro.name; });
  return didYouMean(invalidName, allValidNames);
}

function createNodes(brothers_) {
  var oldLength = brothers_.length;
  var newIdx = oldLength;
  var nodes = [];
  var edges = [];
  var familyColor = {};
  var pledgeClassColor = {};
  var familyToNode = {};

  for (var i = 0; i < oldLength; i++) {
    var bro = brothers_[i];
    bro.id = i;
    var lowerCaseFamily = (bro.familystarted || '').toLowerCase();

    if (lowerCaseFamily && !familyColor[lowerCaseFamily]) {
      familyColor[lowerCaseFamily] = getNewFamilyColor();
      var newNode = {
        id: newIdx++,
        name: lowerCaseFamily,
        label: bro.familystarted,
        family: lowerCaseFamily,
        inactive: true,
        font: { size: 50 }
      };
      familyToNode[lowerCaseFamily] = newNode;
      nodes.push(newNode);
    }

    if (bro.big && lowerCaseFamily) {
      edges.push({ from: bro.big, to: newIdx });
      nodes.push(Object.assign({}, bro, {
        id: newIdx++,
        name: '',
        label: '[' + bro.name + ']',
        family: bro.familystarted.toLowerCase()
      }));
      var familyNode = familyToNode[lowerCaseFamily];
      edges.push({ from: familyNode.id, to: bro.id });
    } else if (!bro.big && !lowerCaseFamily) {
      throw new Error('Encountered a little bro (' + bro.name + ') without a big bro. This is a data entry error.');
    } else if (lowerCaseFamily) {
      edges.push({ from: familyToNode[lowerCaseFamily].id, to: bro.id });
    } else {
      edges.push({ from: bro.big, to: bro.id });
    }

    bro.big = bro.big || lowerCaseFamily;

    var lowerCaseClass = (bro.pledgeclass || '').toLowerCase();
    if (lowerCaseClass && !pledgeClassColor[lowerCaseClass]) {
      pledgeClassColor[lowerCaseClass] = getNewPledgeClassColor();
    }

    bro.label = bro.name;
    nodes.push(bro);
  }

  var nameToNode = {};
  nodes.forEach(function (member) {
    if (member.big) {
      if (nameToNode[member.big]) {
        member.big = nameToNode[member.big];
      } else {
        nodes.forEach(function (member2) {
          if (member.big === member2.name) {
            nameToNode[member.big] = member2;
            member.big = member2;
          }
        });
      }
    }
  });

  edges.forEach(function (edge) {
    if (typeof edge.from === 'string') {
      var node = nameToNode[edge.from];
      if (!node) {
        var correctedName = didYouMeanWrapper(edge.from);
        throw new Error('Unable to find ' + edge.from + (correctedName ? ', did you mean ' + correctedName + '?' : ''));
      }
      edge.from = node.id;
    }
  });

  function getFamily(node) {
    node.family = node.family || node.familystarted;
    if (node.family) return node.family;
    try { node.family = getFamily(node.big); } catch (e) { node.family = 'unknown'; }
    return node.family;
  }

  nodes.forEach(function (node) {
    getFamily(node);
    if (!node.inactive && !node.graduated) {
      familyToNode[node.family.toLowerCase()].inactive = false;
    }
  });

  return [nodes, edges, familyColor, pledgeClassColor];
}

function createNodesHelper() {
  if (createNodesCalled) return;
  createNodesCalled = true;
  var output = createNodes(brothers);
  nodesGlobal = output[0];
  edgesGlobal = output[1];
  familyColorGlobal = output[2];
  pledgeClassColorGlobal = output[3];
  nodesDataSet = new vis.DataSet(nodesGlobal);
  edgesDataSet = new vis.DataSet(edgesGlobal);
}

function findBrother(name, nodes, prevElem, direction) {
  var lowerCaseName = name.toLowerCase();
  var matches = nodes.filter(function (element) {
    return element.name.toLowerCase().includes(lowerCaseName);
  });
  if (matches.length === 0) return undefined;
  var increment = direction === DIRECTION.FORWARD ? 1 : -1;
  var idx = 0;
  if (prevElem) {
    idx = matches.indexOf(prevElem);
    idx = (idx + increment) % matches.length;
    if (idx < 0) idx = matches.length + idx;
  }
  return matches[idx];
}

function findBrotherHelper(name, direction) {
  if (!name) return true;
  if (!network) return false;
  var found = findBrother(name, nodesGlobal, previousSearchFind, direction);
  previousSearchFind = found;
  if (found) {
    network.focus(found.id, { scale: 0.9, animation: true });
    network.selectNodes([found.id]);
    return true;
  }
  return false;
}

function draw() {
  createNodesHelper();

  var changeColor;
  var colorMethod = document.getElementById('layout').value;
  switch (colorMethod) {
    case 'active':
      changeColor = function (node) {
        node.color = (node.inactive || node.graduated) ? 'lightgrey' : 'lightblue';
        nodesDataSet.update(node);
      };
      break;
    case 'pledgeClass':
      changeColor = function (node) {
        node.color = node.pledgeclass ? pledgeClassColorGlobal[node.pledgeclass.toLowerCase()] : 'lightgrey';
        nodesDataSet.update(node);
      };
      break;
    default:
      changeColor = function (node) {
        node.color = familyColorGlobal[node.family.toLowerCase()];
        nodesDataSet.update(node);
      };
      break;
  }
  nodesGlobal.forEach(changeColor);

  if (!network) {
    var container = document.getElementById('mynetwork');
    var data = { nodes: nodesDataSet, edges: edgesDataSet };

    var options = {
      nodes: {
        shape: "ellipse",
        font: { size: 16, multi: true },
        margin: 12
      },
      edges: {
        arrows: "to",
        smooth: false
      },
      layout: {
        hierarchical: {
          direction: "UD",
          sortMethod: "directed",
          nodeSpacing: 350,
          levelSeparation: 300
        }
      },
      physics: { hierarchicalRepulsion: { nodeDistance: 300, springLength: 300 }, solver: "hierarchicalRepulsion" }
    };

    network = new vis.Network(container, data, options);
  } else {
    network.redraw();
  }
}

if (typeof document !== 'undefined') {
  $(document).ready(function () {
    draw();
    var dropdown = document.getElementById('layout');
    dropdown.onchange = function () { draw(); };

    function hidePrevNextButtons() { $('#prevsearch').hide(); $('#nextsearch').hide(); }
    function showPrevNextButtons() { $('#prevsearch').show(); $('#nextsearch').show(); }

    function search(direction) {
      if (direction !== DIRECTION.FORWARD && direction !== DIRECTION.BACKWARD) { direction = DIRECTION.FORWARD; }
      var query = $('#searchbox').val();
      var success = findBrotherHelper(query, direction);
      if (success) {
        $('#searchbox').css('background-color', 'white');
        if (query !== '') showPrevNextButtons(); else hidePrevNextButtons();
      } else {
        $('#searchbox').css('background-color', '#EEC4C6');
        hidePrevNextButtons();
      }
    }

    $('#searchbox').keypress(function (e) {
      var keyCode = e.keyCode || e.which;
      if (keyCode === KEYCODE_ENTER && !e.shiftKey) search(DIRECTION.FORWARD);
      if (keyCode === KEYCODE_ENTER && e.shiftKey) search(DIRECTION.BACKWARD);
    });

    $('#searchbutton').click(search.bind(undefined, DIRECTION.FORWARD));
    $('#nextsearch').click(search.bind(undefined, DIRECTION.FORWARD));
    $('#prevsearch').click(search.bind(undefined, DIRECTION.BACKWARD));
  });
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports.createNodes = createNodes;
  module.exports.createNodesHelper = createNodesHelper;
  module.exports.findBrother = findBrother;
  module.exports.DIRECTION = DIRECTION;
}
