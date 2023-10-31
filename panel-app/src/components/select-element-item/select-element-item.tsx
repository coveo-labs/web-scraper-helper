/*global chrome*/
import { Component, h, Prop, State } from '@stencil/core';
import { removeExcludedItem, removeMetadataItem, updateExcludedItem, updateMetadataItem } from '../store';

@Component({
	tag: 'select-element-item',
	styleUrl: 'select-element-item.scss',
	shadow: false,
})
export class SelectElementItem {
	@Prop() uniqueId: string;
	@Prop() type: string;
	@Prop() name: string;
	@Prop() selectorType: string;
	@Prop() selector: string;
	@Prop() isBoolean?: boolean;
	@State() selectorValidity;

	async validateSelector(selector: string, selectorType: string) {
		const response = await new Promise((resolve) => {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				chrome.tabs.sendMessage(tabs[0].id, { type: 'validate-selector', payload: { type: selectorType, selector: selector } }, null, (response) => {
					resolve(response);
				});
			});
		});
		this.selectorValidity = response;
	}

	handleSelectorTypeChange = () => {
		const newSelectorType = this.selectorType === 'CSS' ? 'XPath' : 'CSS';
		this.validateSelector(this.selector, newSelectorType);

		if (this.type === 'excludeItem') {
			updateExcludedItem({ id: this.uniqueId, type: newSelectorType, path: this.selector }, { id: this.uniqueId, type: this.selectorType, path: this.selector });
		} else {
			updateMetadataItem({ id: this.uniqueId, name: this.name, type: newSelectorType, path: this.selector });
		}
	};

	handleSelectorChange = (event: CustomEvent) => {
		console.log('handleSelectorChange: ', event);
		const newSelector = event.detail.value;
		this.validateSelector(newSelector, this.selectorType);

		if (this.type === 'excludeItem') {
			updateExcludedItem({ id: this.uniqueId, type: this.selectorType, path: newSelector }, { id: this.uniqueId, type: this.selectorType, path: this.selector });
		} else {
			updateMetadataItem({ id: this.uniqueId, name: this.name, type: this.selectorType, path: newSelector });
		}
	};

	handleNameChange = (event: CustomEvent) => {
		const newName = event.detail.value;
		updateMetadataItem({ id: this.uniqueId, name: newName, type: this.selectorType, path: this.selector });
	};

	handleCheckboxChange = (event: CustomEvent) => {
		const isChecked = event.detail.checked;
		updateMetadataItem({ id: this.uniqueId, name: this.name, type: this.selectorType, path: this.selector, isBoolean: isChecked });
	};

	removeItem = () => {
		if (this.type === 'excludeItem') {
			removeExcludedItem({ id: this.uniqueId, type: this.selectorType, path: this.selector });
		} else {
			removeMetadataItem(this.uniqueId);
		}
	};

	componentWillRender() {
		this.validateSelector(this.selector, this.selectorType);
	}

	render() {
		const cssClassForValidity =
			{
				'No element found': 'no-element-found-selector',
				Invalid: 'invalid-selector',
				Valid: 'valid-selector',
			}[this.selectorValidity] || 'never-flip';

		return (
			<div class="select-element-item">
				{this.type === 'metadataItem' && (
					<div>
						<ion-input class="name-input" fill="outline" value={this.name} placeholder="Name" onIonInput={this.handleNameChange}></ion-input>
					</div>
				)}
				<div>
					<ion-input id="selector-type-input" class={cssClassForValidity} fill="outline" value={this.selectorType} onClick={this.handleSelectorTypeChange}></ion-input>
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
				{this.type === 'metadataItem' && (
					<div>
						<ion-checkbox onIonChange={this.handleCheckboxChange} checked={this.isBoolean}></ion-checkbox>
						<ion-icon name="information-circle-outline"></ion-icon>
					</div>
				)}
				<div class="remove-icon" onClick={this.removeItem}>
					<ion-icon name="remove-circle-outline" size="small" color="primary"></ion-icon>
				</div>
			</div>
		);
	}
}
