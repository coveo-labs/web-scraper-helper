//Create the tab in the dev tools (Control+Shift+I)
/*global chrome*/
chrome.devtools.panels.create(
  "Web Scraping",
  "icons/16.png",
  "www/index.html"
);

const port = chrome.runtime.connect({ name: "web-scraper-helper-v2" });
port.postMessage({ type: "devtools-opened" });
