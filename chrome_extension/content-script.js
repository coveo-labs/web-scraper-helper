/* global chrome */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'exclude-selector') {
    const { newItem, oldItem, parentSelector } = message.payload;
    applyStylesToElements(newItem, oldItem, parentSelector);
  }
  if (message.type === 'validate-selector') {
    let response = 'Invalid';
    const { type, selector } = message.payload;

    try {
      const elements = getElements(false, type, selector);

      if (!elements) {
        response = 'Invalid';
      }
      else if (elements && elements.length > 0) {
        response = 'Valid';
      } else {
        response = 'No element found';
      }
    } catch (e) {
      response = 'Invalid';
    }
    sendResponse(response);
  }
  if (message.type === 'update-excludeItem-onLoad') {
    const { exclude } = message.payload;
    exclude.length && exclude.map((element) => {
      return applyStylesToElements(element);
    });
  }
  if (message.type === 'update-excludeSubItem-onLoad') {
    const { exclude, parentSelector } = message.payload;
    exclude.length && exclude.map((element) => {
      return applyStylesToElements(element, null, parentSelector);
    });
  }
  if (message.type === 'remove-exclude-selector') {
    const { item, parentSelector } = message.payload;
    try {
      const elements = getElements(item.type === 'XPath', item.type, item.path, parentSelector);
      elements?.forEach(element => {
        element.classList?.remove('web-scraper-helper-exclude');
      });
    } catch (e) {
      console.log(e);
    }
  }
  if (message.type === 'remove-excluded-on-file-close') {
    const { parentSelector } = message.payload;
    removePreviouslyExcludedStyles(parentSelector);
  }
  if (message.type === 'metadata-results') {
    const { metadata, parentSelector } = message.payload;
    const results = [];
    for (const [, value] of Object.entries(metadata)) {
      const { name, type, path, isBoolean } = value;

      const result = getElements(false, type, path, parentSelector);
      const modifiedResult = isBoolean ? [(!!result.length).toString()] : result && result.map((e) => typeof (e) === 'object' ? e.outerHTML : e);
      results.push({ "name": name, "values": modifiedResult });
    }
    console.log('metadata-result-array', results);
    sendResponse(results);
  }
});

function applyStylesToElements(newItem, oldItem = null, parentSelector = null) {
  try {
    if (oldItem && oldItem.path !== newItem.path) {
      const oldElements = getElements(newItem.type === 'XPath', oldItem.type, oldItem.path, parentSelector) ?? [];

      oldElements.forEach(element => {
        element.classList.remove('web-scraper-helper-exclude');
      });
    }

    let newElements = [];
    if (newItem.type === 'CSS' && newItem.path.indexOf(',') !== -1) {
      newElements = newItem.path.split(',').flatMap((i) => getElements(false, 'CSS', i, parentSelector)) ?? [];
    } else {
      newElements = getElements(newItem.type === 'XPath', newItem.type, newItem.path, parentSelector) ?? [];
    }

    newElements?.forEach(element => {
      element?.classList?.add('web-scraper-helper-exclude');
    });

  } catch (error) {
    console.log(error);
  }
}

function removePreviouslyExcludedStyles(parentSelector = null) {
  try {
    let parent = parentSelector ? document.querySelector(parentSelector) : document;
    parent.querySelectorAll('.web-scraper-helper-exclude').forEach(e => {
      if (e && e.classList) {
        e.classList.remove('web-scraper-helper-exclude');
      }
    });
  } catch (e) {
    console.log(e)
  }
}

function getElements(asIs = false, type, selector, parentSelector = null) {
  try {
    let parent = parentSelector ? document.querySelector(parentSelector) : document;
    if (type === 'CSS') {
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

      let elements = parent.querySelectorAll(selector);
      if (shouldReturnAttr) {
        let attrValues = [];
        elements.forEach(element => {
          attrValues.push(element.getAttribute(attrToGet));
        });
        return attrValues;
      }
      else if (shouldReturnText) {
        let textValues = [];
        elements.forEach(element => {
          textValues.push(element.textContent);
        });
        return textValues;
      }
      return Array.from(elements);
    }

    else if (type === 'XPath') {
      let path = selector;
      let nodes = parent.evaluate(path, document);
      let elements = [];
      let e;

      switch (nodes.resultType) {
        case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
        case XPathResult.ORDERED_NODE_ITERATOR_TYPE:
          while ((e = nodes.iterateNext())) {
            let value = e.nodeValue;
            if (asIs) {
              value = e;
            } else if (value === null) {
              value = e.outerHTML;
            }
            elements.push(value);
          }
          break;
        case XPathResult.NUMBER_TYPE:
          elements.push(nodes.numberValue);
          break;
        case XPathResult.STRING_TYPE:
          elements.push(nodes.stringValue);
          break;
        case XPathResult.BOOLEAN_TYPE:
          elements.push(nodes.booleanValue);
          break;
      }
      return elements;
    }

  } catch (error) {
    console.log(error);
  }
  return null;
}
