chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'exclude-selector') {
    const { newSelector, oldSelector } = message.payload;
    const newElement = document.querySelector(newSelector);
    const oldElement = document.querySelector(oldSelector);
    newElement.classList.add('web-scraper-helper-exclude');
    oldElement.classList.remove('web-scraper-helper-exclude');
  }
  if (message.type === 'validate-selector') {
    let response = 'Invalid';
    const { type, selector } = message.payload;

    switch (type) {
      case 'XPath':
        try {
          const result = document.evaluate(selector, document, null, XPathResult.ANY_TYPE, null);
          const node = result.iterateNext();
          response = node === null ? 'No element found' : 'Valid';
        } catch (error) {
          response = 'Invalid';
        }
        break;
      case 'CSS':
        try {
          const node = document.querySelector(selector);
          response = node === null ? 'No element found' : 'Valid';
        } catch {
          response = 'Invalid';
        }
        break;
    }
    sendResponse(response);
  }
});