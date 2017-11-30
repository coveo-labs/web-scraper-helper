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
    this.TAB_ID = chrome.devtools && chrome.devtools.inspectedWindow.tabId;

    let conn = chrome.runtime.connect({
      name: 'panel'
    });

    conn.onMessage.addListener( this.onMessage.bind(this) );

    // Send a message to background page so that the background page can associate panel to the current host page
    conn.postMessage({
      name: 'panel-init',
      tabId: this.TAB_ID
    });
    this._backgroundPageConnection = conn;
  }

  componentDidMount() {
    this._listenerId = Storage.addChangeListener(this.onSpecUpdate.bind(this));
  }

  componentWillUnmount() {
    Storage.removeChangeListener(this._listenerId);
    this._backgroundPageConnection = null;
  }

  onMessage(msg) {
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
      chrome.runtime.sendMessage({ tabId: this.TAB_ID, validate: sSpec });
      chrome.runtime.sendMessage({ tabId: this.TAB_ID, json: sSpec });
    }
  }

  render() {
    return (
      <div className="App">
        <Library />
        <div id="rules-and-results">
          <Rules ref={(rules) => { this.rules = rules; }}/>
          <Results ref={(res) => { this.results = res; }}/>
        </div>
      </div>
    );
  }
}

export default App;
