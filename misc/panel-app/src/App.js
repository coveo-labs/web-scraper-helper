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
      this.conn = chrome.tabs.connect(this.TAB_ID, {
        name: 'wshpanel'
      });

      this.conn.onMessage.addListener( this.onMessage.bind(this) );
      chrome.runtime.onConnect.addListener(port => {
        this.conn = port;
        port.onMessage.addListener(this.onMessage.bind(this));
      });
    }
    catch(e) {
      // console.log('NO chrome.runtime.connect()', e);
    }
    this._backgroundPageConnection = conn;
    this._firstRender = true;

    try {
      let manifest = chrome.runtime.getManifest();
      document.getElementById('version').innerText = 'v' + manifest.version;
    }
    catch(e) {
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
    if (msg.reload) {
      document.location.replace('?config=' + Storage._sCurrentName);
    }
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

  onSpecUpdate(spec) {
    let sSpec = JSON.stringify(spec);
    if (sSpec !== this._lastSpec) {
      this._lastSpec = sSpec;
      try {
        this.postMessage({ tabId: this.TAB_ID, validate: sSpec });
        this.postMessage({ tabId: this.TAB_ID, json: sSpec });
      }
      catch(e) {
        // console.log(e);
      }
    }
  }

  postMessage(msg) {
    this.conn.postMessage(msg);
  }

  /**
   * checks if an config is on the URL, and loads it.
   */
  preloadSpec() {
    let url = new URL(window.location.href),
      configName = url.searchParams.get('config');

    if (configName) {
      this.refs.library.loadSpec({
        target:{
          value:configName
        }
      });
    }
  }

  render() {
    if (this._firstRender) {
      this._firstRender = false;
      setTimeout(this.preloadSpec.bind(this), 200);
    }
    return (
      <div className="App">
        <Library ref="library"/>
        <div id="rules-and-results">
          <Rules ref={(rules) => { this.rules = rules; }}/>
          <Results ref={(res) => { this.results = res; }}/>
        </div>
      </div>
    );
  }
}

export default App;
