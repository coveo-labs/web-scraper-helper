import React, { Component } from 'react';

class Results extends Component {

  onValidate(validateSpec) {
    this.setState(validateSpec);
  }

  render() {
    let results = [], res = '', errors = [];
    try {
      let encodeHtml = str => {
        return ('' + str).replace(/</g, '&lt;');
      };
      let encodeValue = (value) => {
        if (value && value.length > 1) {
          return value.map(encodeHtml).join('\n');
        }
        return '' + (value || '-');
      };
      results = (this.state && JSON.parse(this.state.return || null)) || [];
      res = results.map((r, index) => (
        <tr key={index}><td>{r.title}</td><td>{encodeValue(r.value)}</td></tr>
      ));
    }
    catch (e) {
      console.log(e);
      res = '';
    }

    try {
      errors = (this.state && this.state.errors) || [];
      errors = errors.map((e, index) => (
        <div key={index}>{e}</div>
      ));
    }
    catch (e) {
      console.log(e);
      errors = '';
    }
    return (
      <div id="results">
        <div id="error">{errors}</div>
        <table id="resultTable" class="table table-condensed table-bordered">
          <tr><th>Field</th><th>Value(s)</th></tr>
          {res}
        </table>
      </div>
    );
  }
}

export default Results;
