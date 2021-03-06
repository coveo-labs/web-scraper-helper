/*global chrome*/

import React, { Component } from 'react';
import Library from './Library';
import Results from './Results';
import Rules from './Rules';
import Storage from './Storage';


class App extends Component {

  constructor(props) {
    super(props);
    this._listenerId = null;
    this.TAB_ID = typeof chrome !== 'undefined' && chrome.devtools && chrome.devtools.inspectedWindow.tabId;

    let conn = null;
    try {
      this.conn = chrome.runtime.connect({
        name: 'wshpanel'
      });

      this.conn.onMessage.addListener(this.onMessage.bind(this));

      // Create a connection to the background page
      this.conn.postMessage({
        name: 'init',
        tabId: this.TAB_ID
      });
    }
    catch (e) {
      // console.log('NO chrome.runtime.connect()', e);
      // console.error(e);
    }
    this._backgroundPageConnection = conn;
    this._firstRender = true;

    try {
      let manifest = chrome.runtime.getManifest();
      document.getElementById('version').innerText = 'v' + manifest.version;
    }
    catch (e) {
      // 'chrome' is undefined in unit tests.
    }
  }

  componentDidMount() {
    this._listenerId = Storage.addChangeListener(this.onSpecUpdate.bind(this));
  }

  componentWillUnmount() {
    Storage.removeChangeListener(this._listenerId);
    this._backgroundPageConnection = null;
  }

  onMessage(msg) {
    if (msg && msg.newPage) {
      this.postSpecToTab(this._lastSpec);
    }
    if (msg && msg.reload) {
      if (Storage._sCurrentName) {
        document.location.replace('?config=' + Storage._sCurrentName);
      }
    }

    if (msg) {
      if (this.results && this.results.setState && (msg.return || msg.errors)) {
        this.results.setState(msg);
      }
      if (this.results && this.results.onValidate && msg.validate) {
        this.results.onValidate(msg.validate);
      }
      if (this.rules && this.rules.onValidate && msg.validate) {
        this.rules.onValidate(msg.validate);
      }
    }
  }

  onSpecUpdate(spec) {
    let sSpec = JSON.stringify(spec);
    if (sSpec !== this._lastSpec) {
      this._lastSpec = sSpec;
      this.postSpecToTab(sSpec);
    }
  }

  postSpecToTab(sSpec) {
    try {
      this.postMessage({ tabId: this.TAB_ID, validate: sSpec });
      this.postMessage({ tabId: this.TAB_ID, json: sSpec });
    }
    catch (e) {
      // console.log(e);
    }
  }

  postMessage(msg) {
    chrome.tabs.sendMessage(this.TAB_ID, msg, null, (response) => {
      this.onMessage(response);
    });
  }

  /**
   * checks if an config is on the URL, and loads it.
   */
  preloadSpec() {
    let url = new URL(window.location.href),
      configName = url.searchParams.get('config');

    if (configName) {
      this.libraryRef.loadSpec({
        target: {
          value: configName
        }
      });
    }
  }

  setLibraryRef = element => {
    this.libraryRef = element;
  };

  render() {
    if (this._firstRender) {
      this._firstRender = false;
      setTimeout(this.preloadSpec.bind(this), 200);
    }
    return (
      <div className="App">
        <Library ref={this.setLibraryRef} />
        <div id="rules-and-results">
          <Rules ref={(rules) => { this.rules = rules; }} />
          <Results ref={(res) => { this.results = res; }} />
        </div>
      </div>
    );
  }
}

export default App;
