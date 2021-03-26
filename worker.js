importScripts('IO.js');

async function init() {
  readData()
  .then(data => {
    let trips = data[0];
    let stops = data[1];
    let routes = data[2];
    
    postMessage([trips, stops, routes]);
  });
}

onmessage = function(e) {
    init();
}