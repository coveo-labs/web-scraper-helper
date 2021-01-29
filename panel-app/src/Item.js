import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Item extends Component {

  static getId(e) {
    let id = null;
    if (e && e.getAttribute) {
      id = e.getAttribute('data-id');
      if (!id && e.parentNode) {
        return this.getId(e.parentNode);
      }
    }
    return id;
  }

  // Pass along the change to the listener.
  onChange(state, e) {
    state.id = Item.getId(e.target);
    this.props.onChange(state);
  }

  onChangeBool(e) {
    this.onChange({ isBoolean: e.target.checked }, e);
  }

  onChangePath(e) {
    this.onChange({ path: e.target.value }, e);
  }

  onChangeType(e) {
    this.onChange({ type: e.target.checked ? 'CSS' : 'XPATH' }, e);
  }

  renderPath(withBool) {
    let retval = [
      <input key={this.props.id + '-text'} type="text" className="wsh-rule-path" placeholder="Selector (XPath or CSS)" value={this.props.path} onChange={this.onChangePath.bind(this)} />
    ];
    if (withBool) {
      let isBoolean = (this.props.isBoolean === true);
      let labelCss = isBoolean ? 'checked' : '';
      retval.push(
        <label key={this.props.id + '-as-bool'} className={labelCss}><input type="checkbox" checked={isBoolean} onChange={this.onChangeBool.bind(this)} /> bool</label>
      );
    }
    if (this.props.onRemove) {
      retval.push(
        <div key={this.props.id + '-remove'} className="button-icon button-icon-delete" onClick={this.props.onRemove}></div>
      );
    }
    return retval;
  }

  renderType() {
    let isCss = this.props.type === 'CSS';
    let cssName = 'wsh-rule-type';
    if (this.props.validationState) {
      cssName += ' ' + this.props.validationState;
    }
    return <input type="checkbox" className={cssName} checked={isCss} onChange={this.onChangeType.bind(this)} />;
  }

  render() {
    return (
      <div data-id={this.props.id} className="rule">
        {this.renderType()}
        {this.renderPath()}
      </div>
    );
  }
}

Item.propTypes = {
  id: PropTypes.string,
  isBoolean: PropTypes.bool,
  onChange: PropTypes.func,
  onRemove: PropTypes.func,
  path: PropTypes.string,
  type: PropTypes.oneOf(['CSS', 'XPATH']),
  validationState: PropTypes.string,
};

export default Item;
