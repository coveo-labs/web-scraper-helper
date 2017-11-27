/*global chrome*/

import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import Library from './Library';
import Rules from './Rules';
import Storage from './Storage';


// class Rules extends Component {
//   render() {
//     return (
//       <div>
//         RULES
//       </div>
//     );
//   }
// }


class Results extends Component {
  render() {
    let results = [], res = '';
    try {
      let encodeHtml = str => {
        return (''+str).replace(/</g,'&lt;');
      };
      let encodeValue = (value) => {
        if (value && value.length > 1) {
          return value.map(encodeHtml).join('\n');
        }
        return encodeHtml(value || '-');
      };
      results = (this.state && JSON.parse(this.state.return || null)) || [];
      res = results.map( (r,index) => (
        <tr key={index}><td>{r.title}</td><td>{encodeValue(r.value)}</td></tr>
      ));
    }
    catch(e) {
      console.log(e);
      res = '';
    }
    return (
      <div id="results">
        RESULTS
        <table id="resultTable" class="table table-condensed table-bordered">
          <tr><th>Field</th><th>Value(s)</th></tr>
          {res}
        </table>
      </div>
    );
  }
}


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

  onLoadSpec(spec) {
    console.log('ON-LOAD', this);
  }

  onMessage(msg) {
    console.log('APP:onMessage ', msg);
    if (this.results && this.results.setState) {
      this.results.setState(msg);
    }
  }

  onSpecUpdate(spec) {
    console.log('APP::onSpecUpdate', JSON.stringify(spec));
    chrome.runtime.sendMessage({ tabId: this.TAB_ID, json: JSON.stringify(spec) });
  }

  render() {
    return (
      <div className="App">
        <Library onLoad={this.onLoadSpec.bind(this)} />
        <div id="rules-and-results">
          <Rules />
          <Results ref={(res) => { this.results = res; }}/>
        </div>
      </div>
    );
  }
}

export default App;
