import React, { Component } from 'react';

class Results extends Component {

  encodeHtml(str) {
    return ('' + str).replace(/</g, '&lt;');
  }

  encodeValue(value) {
    if (value && value.length > 1) {
      return value.map(this.encodeHtml).join('\n');
    }
    return '' + (value || '-');
  }

  onValidate(validateSpec) {
    this.setState(validateSpec);
  }

  render() {
    let results = [], errors = [];
    try {
      results = (this.state && JSON.parse(this.state.return || null)) || [];
    }
    catch(e) {
      // results will stay an empty []
    }

    let globals = results.filter(r=>!r.subItemName);
    globals = this.renderGlobal(globals);

    let subItems = results.filter(r=>r.subItemName);
    subItems = this.renderSubItems(subItems);

    try {
      errors = (this.state && this.state.errors) || [];
      errors = errors.map((e, index) => (
        <div key={index}>{e}</div>
      ));
    }
    catch (e) {
      // errors will stay an empty []
    }

    return (
      <div id="results">
        <div id="error">{errors}</div>
        { globals }
        { subItems }
      </div>
    );
  }

  renderGlobal(results) {
    let res = '';
    try {
      res = results.map((r, index) => (
        <tr key={index}>
          <td>{r.title}</td>
          <td className={r.isBoolean? 'as-boolean': ''}>{this.encodeValue(r.value)}</td>
        </tr>
      ));
    }
    catch (e) {
      res = '';
    }

    return (
      <table id="resultGlobalTable" className="table table-condensed table-bordered">
        <thead><tr><th>Field</th><th>Value(s)</th></tr></thead>
        <tbody>
          {res}
        </tbody>
      </table>
    );
  }

  renderSubItems(results) {
    let res = '', empty = true;
    try {
      res = results.map((result) => {
        return result.values.map((r, index)=>{
          empty = false;
          let subItemName = '';
          if (index === 0) {
            subItemName = (
              <td rowSpan={result.values.length}>{r.subItemName}</td>
            );
          }
          return (
            <tr key={index}>
              {subItemName}
              <td>{r.title}</td>
              <td className={r.isBoolean? 'as-boolean': ''}>{this.encodeValue(r.value)}</td>
            </tr>
          );
        });
      });
    }
    catch (e) {
      res = '';
    }

    if (empty) {
      return (
        <div></div>
      );
    }

    return (
      <table className="table table-condensed table-bordered">
        <thead><tr><th>Sub Item</th><th>Field</th><th>Value(s)</th></tr></thead>
        <tbody>
          {res}
        </tbody>
      </table>
    );
  }

}

export default Results;
