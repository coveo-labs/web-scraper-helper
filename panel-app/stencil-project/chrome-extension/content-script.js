chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'exclude-selector') {
    const { newSelector, oldSelector } = message.payload;
    applyStylesToItems(newSelector, oldSelector)
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
  if (message.type === 'update-excludeItem-onLoad') {
    const { exclude } = message.payload;
    exclude.length && exclude.map((element) => {
      return applyStylesToItems(element.path, '')
    })
  }
  if (message.type === 'metadata-results') {
    const { metadata } = message.payload;
    const results = [];
    for (const [key, value] of Object.entries(metadata)) {
      const { type, path } = value;

      const result = getMetadataFieldValue(key, type, path);
      console.log('result', result)
      results.push(result);
    }
    sendResponse(results);
  }
});

function applyStylesToItems(newSelector, oldSelector = '') {
  const newElement = document.querySelector(newSelector);
  newElement.classList.add('web-scraper-helper-exclude');

  if (oldSelector && oldSelector !== newSelector) {
    const oldElement = document.querySelector(oldSelector);
    oldElement.classList.remove('web-scraper-helper-exclude');
  }
}

function getMetadataFieldValue(key, type, path) {
  let resObject;
  switch (type) {
    case 'CSS':
      let elements = getElements(type, path)
      resObject = { name: key, value: elements }
      break;
    case 'XPath':
      break;
  }
  return resObject;
}

function getElements(type, selector) {

  switch (type) {
    case 'CSS':
      let reTextSub = /::text\b/;
      let reAttrSub = /::attr\b/;
      let shouldReturnAttr = false;
      let attrToGet = '';
      let shouldReturnText = false;

      if (reAttrSub.test(selector)) {
        shouldReturnAttr = true;
        attrToGet = selector.match(/::attr\((.*?)\)/)[1];
        selector = selector.replace(reAttrSub, '');
      }

      if (reTextSub.test(selector)) {
        shouldReturnText = true;
        selector = selector.replace(reTextSub, '');
      }

      console.log('selector', selector)
      let elements = document.querySelectorAll(selector);
      if (shouldReturnAttr) {
        let attrValues = [];
        elements.forEach(element => {
          attrValues.push(element.getAttribute(attrToGet));
        });
        return attrValues;
      } else if (shouldReturnText) {
        let textValues = [];
        elements.forEach(element => {
          textValues.push(element.textContent);
        });
        return textValues;
      } else {
        console.log('list', Array.from(elements))
        return Array.from(elements);
      }
      break;
    case 'XPath':
      // xpath validation
      break;
  }
}