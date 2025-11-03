/* istanbul ignore next */
function draw() {
  createNodesHelper();

  var changeColor;
  var colorMethod = document.getElementById('layout').value;
  switch (colorMethod) {
    case 'active':
      changeColor = function (node) {
        node.color = (node.inactive || node.graduated)
          ? 'lightgrey' : 'lightblue';
        nodesDataSet.update(node);
      };
      break;
    case 'pledgeClass':
      changeColor = function (node) {
        node.color = node.pledgeclass
          ? pledgeClassColorGlobal[node.pledgeclass.toLowerCase()]
          : 'lightgrey';
        nodesDataSet.update(node);
      };
      break;
    default: // 'family'
      changeColor = function (node) {
        node.color = familyColorGlobal[node.family.toLowerCase()];
        nodesDataSet.update(node);
      };
      break;
  }
  nodesGlobal.forEach(changeColor);
  if (!network) {
    // create a network
    var container = document.getElementById('mynetwork');
    var data = {
      nodes: nodesDataSet,
      edges: edgesDataSet,
    };

    var options = {
  nodes: {
    shape: "ellipse", // makes them ovals again
    font: { size: 16, multi: true },
    margin: 12, // extra padding inside each node
  },
  edges: {
    arrows: "to",
    smooth: false
  },
 layout: {
  hierarchical: {
    direction: "UD", // up → down (normal orientation)
    sortMethod: "directed",
    nodeSpacing: 500,
    levelSeparation: 300
  }
},
  physics: {
    hierarchicalRepulsion: {
      nodeDistance: 300, // increases space between connected nodes
      springLength: 300
    },
    solver: "hierarchicalRepulsion"
  }
};

network = new vis.Network(container, data, options);
  } else {
    network.redraw();
  }
}

/* istanbul ignore next */
// This section is intended to only run in the browser, it does not run in
// nodejs.
if (typeof document !== 'undefined') {
  $(document).ready(function () {
    // Start the first draw
    draw();

    // Search feature
    var dropdown = document.getElementById('layout');
    dropdown.onchange = function () {
      draw();
    };
    function hidePrevNextButtons() {
      $('#prevsearch').css('display', 'none');
      $('#nextsearch').css('display', 'none');
    }
    function showPrevNextButtons() {
      $('#prevsearch').css('display', 'inline');
      $('#nextsearch').css('display', 'inline');
    }
    function search(direction) {
      if (direction !== DIRECTION.FORWARD && direction !== DIRECTION.BACKWARD) {
        console.warn('Unexpected direction value: ' + direction
          + ' (defaulting to FORWARD direction)');
        direction = DIRECTION.FORWARD;
      }
      direction = direction || DIRECTION.FORWARD;
      var query = $('#searchbox').val();
      var success = findBrotherHelper(query, direction);

      // Indicate if the search succeeded or not.
      if (success) {
        $('#searchbox').css('background-color', 'white');
        if (query !== '') {
          showPrevNextButtons();
        } else {
          hidePrevNextButtons();
        }
      } else {
        $('#searchbox').css('background-color', '#EEC4C6'); // red matching flag
        hidePrevNextButtons();
      }
    }
    document.getElementById('searchbox').onkeypress = function (e) {
      if (!e) e = window.event;
      var keyCode = e.keyCode || e.which;
      if (typeof keyCode === 'string') {
        keyCode = Number(keyCode);
      }
      if (keyCode === KEYCODE_ENTER && !e.shiftKey) {
        search(DIRECTION.FORWARD);
      }
      if (keyCode === KEYCODE_ENTER && e.shiftKey) {
        search(DIRECTION.BACKWARD);
      }
    };
    document.getElementById('searchbutton').onclick = search.bind(undefined, DIRECTION.FORWARD);
    document.getElementById('nextsearch').onclick = search.bind(undefined, DIRECTION.FORWARD);
    document.getElementById('prevsearch').onclick = search.bind(undefined, DIRECTION.BACKWARD);
  });
}

/* istanbul ignore else */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports.createNodes = createNodes;
  module.exports.createNodesHelper = createNodesHelper;
  module.exports.findBrother = findBrother;
  module.exports.DIRECTION = DIRECTION;
}

