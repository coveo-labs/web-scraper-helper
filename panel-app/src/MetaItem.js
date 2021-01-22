import React from 'react';
import Item from './Item';

class MetaItem extends Item {

  onNameChange(e) {
    this.onChange({ name: e.target.value }, e);
  }

  render() {
    return (
      <div data-id={this.props.id} className="rule">
        <input type="text" className="wsh-rule-name" placeholder="Name" value={this.props.name} onChange={this.onNameChange.bind(this)} />
        {this.renderType()}
        {this.renderPath(true)}
      </div>
    );
  }

}

export default MetaItem;
