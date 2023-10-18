/*global chrome*/

import { Component, h, Prop, State } from '@stencil/core';
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
	@State() selectorValidity;

	async validateSelector(selector: string, selectorType: string) {
		// this.selectorValidity = 'Valid';
		// try {
		//   switch (selectorType) {
		//     case 'Xpath':
		//       this.selectorValidity = this.checkForElement(selectorType, selector);
		//       break;
		//     case 'CSS':
		//       if (!this.isValidCssSelector(selector)) {
		//         this.selectorValidity = 'Invalid';
		//       }
		//       console.log('before', this.selectorValidity);
		//       this.selectorValidity = await this.checkForElement(selectorType, selector);
		//       console.log('after', this.selectorValidity);
		//       break;
		//   }
		// } catch (error) {
		//   this.selectorValidity = 'Invalid';
		// }

		const response = await new Promise((resolve) => {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				chrome.tabs.sendMessage(tabs[0].id, { type: 'validate-selector', payload: { type: selectorType, selector: selector } }, null, (response) => {
					resolve(response);
				});
			});
		});
		this.selectorValidity = response;
	}

	handleSelectorTypeChange = (event: CustomEvent) => {
		const newSelectorType = event.detail.value;
		this.validateSelector(this.selector, newSelectorType);

		if (this.selectorValidity !== 'Invalid') {
			if (this.type === 'excludeItem') {
				updateExcludedItem({ type: newSelectorType, path: this.selector }, { type: this.selectorType, path: this.selector });
			} else {
				updateMetadataItem({ name: this.name, type: newSelectorType, path: this.selector }, { name: this.name, type: this.selectorType, path: this.selector });
			}
		}
	};

	handleSelectorChange = (event: CustomEvent) => {
		const newSelector = event.detail.value;
		this.validateSelector(newSelector, this.selectorType);

		// if (this.selectorValidity !== 'Invalid') {
		if (this.type === 'excludeItem') {
			updateExcludedItem({ type: this.selectorType, path: newSelector }, { type: this.selectorType, path: this.selector });
		} else {
			updateMetadataItem({ name: this.name, type: this.selectorType, path: newSelector }, { name: this.name, type: this.selectorType, path: this.selector });
			// }
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
						class={
							this.selectorValidity === 'No element found'
								? 'no-element-found-selector'
								: this.selectorValidity === 'Invalid'
								? 'invalid-selector'
								: this.selectorValidity === 'Valid'
								? 'valid-selector'
								: 'never-flip'
						}
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
						onIonInput={this.handleSelectorChange}
					></ion-input>
				</div>
				<div class="remove-icon" onClick={this.removeItem}>
					<ion-icon name="remove-circle-outline" size="small" color="primary"></ion-icon>
				</div>
			</div>
		);
	}
}
