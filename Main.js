let trips;
let stops;
let routes;

function init() {
  readData().then(data => {
    trips = data[0];
    stops = data[1];
    routes = data[2];
  });

}
