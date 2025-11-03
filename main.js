<!doctype html>
<html>
<head>
  <title>Phi Kappa Tau</title>
  <link rel="icon" type="image/ico" href="favicon.ico"/>
  <!-- Responsive design on mobile -->
  <meta content="width=device-width" name="viewport"/>

  <script type="text/javascript" src="lib/didYouMean-1.2.1.min.js"></script>
  <script type="text/javascript" src="lib/vis.min.js"></script>
  <script type="text/javascript" src="lib/tinycolor.js"></script>
  <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>
  <script type="text/javascript" src="relations.js?v=2"></script>
  <script type="text/javascript" src="main.js"></script>
  <link href="lib/vis.min.css" rel="stylesheet" type="text/css" />
  <link href="css/main.css" rel="stylesheet" type="text/css" />
</head>

<body>
<h1>Phi Kappa Tau</h1>
<p>Color-coding:
<select id="layout">
  <option value="family">family</option>
  <option value="pledgeClass">pledge class</option>
  <option value="active">active vs. inactive</option>
</select></p>
<div>
  <input type="text" id="searchbox" placeholder="Brother's name...">
  <button id="searchbutton">Search</button>
  <button id="prevsearch" style='display: none'><i class="arrow up"></i></button>
  <button id="nextsearch" style='display: none'><i class="arrow down"></i></button>
</div>
<br/>

<div class="stretchy-wrapper">
  <div id="network-container">
    <div id="mynetwork"></div>
  </div>
</div>
<p id="selection"></p>
</body>
</html>
✅ main.js (your original / local version)
js
Copy code
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
        shape: "ellipse",
        font: { size: 16, multi: true },
        margin: 12,
      },
      edges: {
        arrows: "to",
        smooth: false
      },
      layout: {
        hierarchical: {
          direction: "UD",
          sortMethod: "directed",
          nodeSpacing: 500,
          levelSeparation: 300
        }
      },
      physics: {
        hierarchicalRepulsion: {
          nodeDistance: 300,
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
if (typeof document !== 'undefined') {
  $(document).ready(function () {
    draw();

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
        console.warn('Unexpected direction value: ' + direction + ' (defaulting to FORWARD direction)');
        direction = DIRECTION.FORWARD;
      }
      direction = direction || DIRECTION.FORWARD;
      var query = $('#searchbox').val();
      var success = findBrotherHelper(query, direction);

      if (success) {
        $('#searchbox').css('background-color', 'white');
        if (query !== '') {
          showPrevNextButtons();
        } else {
          hidePrevNextButtons();
        }
      } else {
        $('#searchbox').css('background-color', '#EEC4C6');
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