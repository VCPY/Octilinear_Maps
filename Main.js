var ioWorker = new Worker('worker.js');

console.log("Started worker")
ioWorker.postMessage("");
ioWorker.onmessage = function(e) {
  console.log('Message received from worker');
  console.log(e.data);
}
