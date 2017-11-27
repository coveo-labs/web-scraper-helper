import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import Library from './Library';
import Rules from './Rules';
// import Storage from './Storage';


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
    return (
      <div id="results">
        RESULTS
      </div>
    );
  }
}


class App extends Component {

  onLoadSpec(spec) {
    console.log('ON-LOAD', this);
  }

  render() {
    return (
      <div className="App">
        <Library onLoad={this.onLoadSpec.bind(this)} />
        <div id="rules-and-results">
          <Rules />
          <Results />
        </div>
      </div>
    );
  }
}

export default App;
