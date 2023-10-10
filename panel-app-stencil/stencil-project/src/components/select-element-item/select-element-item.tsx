import { Component, h, Prop } from '@stencil/core';
import { removeExcludedItem, removeMetadataItem, updateExcludedItem, updateMetadataItem } from '../store';

@Component({
  tag: 'select-element-item',
  styleUrl: 'select-element-item.css',
  shadow: false,
})
export class SelectElementItem {
  @Prop() type: string;
  @Prop() name: string;
  @Prop() selectorType: string;
  @Prop() selector: string;

  handleSelectorTypeChange = (event: CustomEvent) => {
    const newSelectorType = event.detail.value;
    if (this.type === 'excludeItem') {
      updateExcludedItem({ type: newSelectorType, path: this.selector }, { type: this.selectorType, path: this.selector });
    } else {
      updateMetadataItem({ name: this.name, type: newSelectorType, path: this.selector }, { name: this.name, type: this.selectorType, path: this.selector });
    }
  };

  handleSelectorChange = (event: CustomEvent) => {
    const newSelector = event.detail.value;
    if (this.type === 'excludeItem') {
      updateExcludedItem({ type: this.selectorType, path: newSelector }, { type: this.selectorType, path: this.selector });
    } else {
      updateMetadataItem({ name: this.name, type: this.selectorType, path: newSelector }, { name: this.name, type: this.selectorType, path: this.selector });
    }
  };

  handleNameChange = (event: CustomEvent) => {
    const newName = event.detail.value;
    updateMetadataItem({ name: newName, type: this.selectorType, path: this.selector }, { name: this.name, type: this.selectorType, path: this.selector });
  };

  removeItem = () => {
    if (this.type === 'excludeItem') {
      removeExcludedItem({ type: this.selectorType, path: this.selector });
    } else {
      removeMetadataItem({ name: this.name, type: this.selectorType, path: this.selector });
    }
  };

  render() {
    return (
      <div class="select-element-item">
        {this.type === 'metadataItem' && (
          <div>
            <ion-input class="name-input" fill="outline" value={this.name} placeholder="Name" onIonChange={this.handleNameChange}></ion-input>
          </div>
        )}
        <div>
          <ion-select
            class="never-flip"
            toggleIcon="caret-down-sharp"
            aria-label="Selector"
            interface="popover"
            fill="outline"
            value={this.selectorType}
            onIonChange={this.handleSelectorTypeChange}
          >
            <ion-select-option value="CSS">CSS</ion-select-option>
            <ion-select-option value="XPath">XPath</ion-select-option>
          </ion-select>
        </div>
        <div>
          <ion-input
            class={this.type === 'excludeItem' ? 'selector-input' : 'metadata-selector-input'}
            fill="outline"
            value={this.selector}
            placeholder="expression"
            onIonChange={this.handleSelectorChange}
          ></ion-input>
        </div>
        <div class="remove-icon" onClick={this.removeItem}>
          <ion-icon name="remove-circle-outline" size="small" color="primary"></ion-icon>
        </div>
      </div>
    );
  }
}
