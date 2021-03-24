const urlStops = 'https://www.wienerlinien.at/ogd_realtime/doku/ogd/gtfs/stops.txt';

function readData() {
  fetch("http://localhost:8080/" + urlStops, {'method': "GET"}).then(result => {
    return (result.text())
  }).then(result => {
    console.log(result)
  })
}
