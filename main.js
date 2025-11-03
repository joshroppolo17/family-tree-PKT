var nodesGlobal = [];
var nodesDataSet = new vis.DataSet();
var edgesDataSet = new vis.DataSet();
var network;

// Convert brothers data into nodes and edges
brothers.forEach(function(brother, index) {
  var node = {
    id: index + 1,
    label: brother.name,
    family: brother.familystarted || "",
    pledgeclass: brother.pledgeclass || "",
    graduated: brother.graduated || false,
    inactive: false,
    color: 'lightgrey'
  };

  nodesGlobal.push(node);
  nodesDataSet.add(node);

  if (brother.big) {
    var bigIndex = brothers.findIndex(b => b.name === brother.big);
    if (bigIndex !== -1) {
      edgesDataSet.add({ from: bigIndex + 1, to: index + 1 });
    }
  }
});

// Draw network
function draw() {
  var container = document.getElementById('mynetwork');
  var data = { nodes: nodesDataSet, edges: edgesDataSet };
  var options = {
    nodes: { shape: 'ellipse', font: { size: 16, multi: true }, margin: 12 },
    edges: { arrows: 'to', smooth: false },
    layout: {
      hierarchical: {
        direction: 'UD',
        sortMethod: 'directed',
        nodeSpacing: 200,
        levelSeparation: 150
      }
    },
    physics: {
      hierarchicalRepulsion: {
        nodeDistance: 150,
        springLength: 100
      },
      solver: 'hierarchicalRepulsion'
    }
  };

  if (!network) {
    network = new vis.Network(container, data, options);
  } else {
    network.setData(data);
  }

  applyColorCoding();
}

// Apply color coding based on dropdown
function applyColorCoding() {
  var colorMethod = document.getElementById('layout').value;
  nodesGlobal.forEach(function(node) {
    if (colorMethod === 'active') {
      node.color = node.inactive || node.graduated ? 'lightgrey' : 'lightblue';
    } else if (colorMethod === 'pledgeClass') {
      node.color = node.pledgeclass
        ? pledgeClassColorGlobal[node.pledgeclass.toLowerCase()]
        : 'lightgrey';
    } else { // family
      node.color = familyColorGlobal[node.family.toLowerCase()] || 'lightgrey';
    }
    nodesDataSet.update(node);
  });
}

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
  draw();
  document.getElementById('layout').addEventListener('change', draw);
});