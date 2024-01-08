'use strict';
// jshint -W110, -W003
/*global chrome*/

class RulePath {
  constructor(spec, title, subItemName, container) {
    this.path = spec.path;
    this.isBoolean = spec.isBoolean ? true : false;
    if (title) {
      this.title = title;
    } else if (spec.name) {
      this.title = spec.name;
    }
    this.id = spec.id;

    this.container = container || null;

    if (subItemName) {
      this.subItemName = subItemName;
    }
    return this;
  }

  getElements() {
    return null;
  }

  exludeFromPage() {
    let elements = this.getElements(true);
    (elements || []).forEach(e => {
      if (e && e.classList) {
        e.classList.add('web-scraper-helper-exclude');
      }
    });
  }

  formatError(err) {
    return `[${this.title}] Failed to parse ${this.type} "${this.path}"\n${err}`;
  }

  toJson() {
    let o = {
      type: this.type,
      path: this.path
    };
    if (this.subItemName) {
      o.subItemName = this.subItemName;
    }
    if (this.isBoolean) {
      o.isBoolean = true;
    }
    if (this.title !== undefined) {
      o.title = this.title;
    }
    let elements = this.getElements();
    if (elements) {
      o.value = elements;
    }
    if (this._error) {
      o.error = this.error;
    }
    return o;
  }

  toString() {
    return JSON.stringify(this.toJson());
  }

  isError() {
    return this._error ? true : false;
  }

  /**
   * isValid means some element in the page matches this rule.
   */
  isValid() {
    if (this._isValid === undefined) {
      this._elements = this.getElements();
      this._isValid = this._elements && this._elements.length ? true : false;
    }
    return this._isValid;
  }
}

class CssRule extends RulePath {
  constructor(spec, title, subItemKey, container) {
    super(spec, title, subItemKey, container);
    this.type = 'CSS';
    this.isValid();
  }

  getTextNodes(container) {
    let aNodes = [];
    (container.childNodes || []).forEach(c => {
      if (c.nodeType === 3) {
        aNodes.push(c);
      }
    });
    return aNodes;
  }

  getElements(asIs = false) {
    try {
      let reTextSub = /::text\b/;
      let reAttrSub = /::attr\b/;
      let shouldReturnAttr = false;
      let attrToGet = '';
      let shouldReturnText = false;

      let cssSelector = this.path || '';
      if (reTextSub.test(cssSelector)) {
        shouldReturnText = true;
        cssSelector = cssSelector.split(reTextSub)[0];
      }

      if (reAttrSub.test(cssSelector)) {
        shouldReturnAttr = true;
        attrToGet = cssSelector.split(reAttrSub)[1].slice(1, -1);
        cssSelector = cssSelector.split(reAttrSub)[0];
      }

      let container = this.container || document;
      let nodes = [],
        elements = [];

      let n = container.querySelectorAll(cssSelector);
      n.forEach(e => {
        nodes.push(e);
      });

      if (this.isBoolean) {
        return [nodes && nodes.length ? true : false];
      }

      (nodes || []).forEach(e => {
        let value = e;
        if (shouldReturnText) {
          value = this.getTextNodes(e)
            .map(n => (n.textContent || '').trim())
            .filter(t => t)
            .join('\n');
        }

        if (shouldReturnAttr) {
          value = e.getAttribute(attrToGet);
        }

        if (!asIs && (typeof value === "object") && value.outerHTML) {
          value = value.outerHTML;
        }

        elements.push(value);
      });
      return elements;
    } catch (err) {
      // console.error(err);
      this._error = this.formatError(err);
      return null;
    }
  }
}

class XPathRule extends RulePath {
  constructor(spec, title, subItemKey, container) {
    super(spec, title, subItemKey, container);
    this.type = 'XPATH';
    this.isValid();
  }

  /**
   *
   * @param {*} asIs if true, return the element as is, not as text.
   */
  getElements(asIs) {
    try {
      let path = this.path;
      if (this.container && path && path.startsWith('//')) {
        path = '.' + this.path;
      }
      let nodes = document.evaluate(path, this.container || document);
      let e,
        elements = [];

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

      if (this.isBoolean) {
        return [elements && elements.length ? true : false];
      }

      return elements;
    } catch (err) {
      // console.error(err);
      this._error = this.formatError(err);
      return null;
    }
  }
}

class ErrorRule extends RulePath {
  constructor(spec, title) {
    super(spec, title);
    this.type = 'ERROR';
    this._error = 'Unknown type: ' + JSON.stringify(spec);
  }
}

let createRule = (obj, title, subItemKey, container) => {
  if (obj.type === 'CSS') {
    return new CssRule(obj, title, subItemKey, container);
  }
  if (obj.type === 'XPATH') {
    return new XPathRule(obj, title, subItemKey, container);
  }
  return new ErrorRule(obj, title);
};

let getParentsElements = (parentSelector) => {
  let parents = null;
  if (parentSelector) {
    parents = createRule(parentSelector).getElements(true);
  }
  if (!parents) {
    parents = [document];
  }
  return parents;
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'exclude-selector') {
    const { newItem, oldItem, parentSelector } = message.payload;
    applyStylesToElements(newItem, oldItem, parentSelector);
  }
  if (message.type === 'validate-selector') {
    let response = 'Invalid';
    const { type, selector } = message.payload;

    try {
      const elements = createRule(message.payload).getElements(true);
      if (elements === null) {
        response = 'Invalid';
      }
      else if (elements?.length > 0) {
        response = 'Valid';
      } else {
        response = 'No element found';
      }
    } catch (e) {
      response = 'Invalid';
    }
    // console.log('validate-selector', message, response);
    sendResponse(response);
  }
  if (message.type === 'update-excludeItem-onLoad') {
    const { exclude, subItems } = message.payload;
    exclude.length && exclude.map((element) => applyStylesToElements(element));
    subItems.map(subItem => {
      subItem.exclude.length && subItem.exclude.map((element) => applyStylesToElements(element, null, { type: subItem.type, path: subItem.path }));
    });
  }
  if (message.type === 'remove-exclude-selector') {
    const { item, parentSelector } = message.payload;
    try {
      let parents = getParentsElements(parentSelector);
      parents.forEach(parent => {
        const elements = createRule(item, null, null, parent).getElements(true);
        elements?.forEach(element => {
          element.classList?.remove('web-scraper-helper-exclude');
        });
      });
    } catch (e) {
      console.log(e);
    }
  }
  if (message.type === 'remove-excluded-on-file-close') {
    removePreviouslyExcludedStyles();
  }
  if (message.type === 'metadata-results') {
    const { metadata, parentSelector } = message.payload;
    const results = [];
    let parents = getParentsElements(parentSelector);
    parents.forEach(parent => {
      const result = [];
      for (const [, value] of Object.entries(metadata)) {
        const { name } = value;
        const rule = createRule(value, null, null, parent);
        result.push({ "name": name, "values": rule.getElements() });
      }
      results.push(result);
    });
    console.log('metadata-result-array', message, results);
    sendResponse(results);
  }
  if (message.type === 'update-parentSelector-style') {
    const { newSelector, oldSelector } = message.payload;
    if (oldSelector && oldSelector.path !== newSelector.path) {
      const oldElements = createRule(oldSelector).getElements(true);
      oldElements?.forEach(element => {
        element.classList.remove('web-scraper-subItem-parentSelector');
      });
    }

    const newElements = createRule(newSelector).getElements(true);
    newElements?.forEach(element => {
      element.classList.add('web-scraper-subItem-parentSelector');
    });
  }
  if (message.type === 'remove-parentSelector-style') {
    document.querySelectorAll('.web-scraper-subItem-parentSelector').forEach(element => {
      element.classList.remove('web-scraper-subItem-parentSelector');
    });
  }
});

function applyStylesToElements(newItem, oldItem = null, parentSelector = null) {
  try {
    let parents = getParentsElements(parentSelector);
    if (oldItem && oldItem.path !== newItem.path) {
      parents.forEach(parent => {
        const oldElements = createRule(oldItem, null, null, parent).getElements(true);
        oldElements?.forEach(element => {
          element.classList.remove('web-scraper-helper-exclude');
        });
      });
    }

    parents.forEach(parent => {
      let newElements = createRule(newItem, null, null, parent).getElements(true);;
      newElements?.forEach(element => {
        element?.classList?.add('web-scraper-helper-exclude');
      });
    });

  } catch (error) {
    console.log(error);
  }
}

function removePreviouslyExcludedStyles() {
  try {
    document.querySelectorAll('.web-scraper-helper-exclude, .web-scraper-subItem-parentSelector').forEach(e => {
      if (e && e.classList) {
        e.classList.remove('web-scraper-helper-exclude', 'web-scraper-subItem-parentSelector');
      }
    });
  } catch (e) {
    console.log(e);
  }
}

window.onload = () => {
  chrome.runtime.sendMessage({
    type: 'page-loaded',
  });
};