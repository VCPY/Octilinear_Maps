/// <reference lib="webworker" />

addEventListener('message', ({data}) => {
  console.log("[algorithm-worker] started");
  postMessage(data);
});
