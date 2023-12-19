/*global chrome*/
import { Component, h, Prop, State } from '@stencil/core';
import { removeExcludedItem, removeMetadataItem, sendMessageToContentScript, updateExcludedItem, updateMetadataItem } from '../store';
import { Selector, SelectorType } from '../types';

@Component({
	tag: 'select-element-item',
	styleUrl: 'select-element-item.scss',
	shadow: false,
})
export class SelectElementItem {
	@Prop() uniqueId: string;
	@Prop() type: string;
	@Prop() name: string;
	@Prop() selector: Selector;
	@State() selectorValidity: 'No element found' | 'Invalid' | 'Valid';

	validateSelector(selector: Selector) {
		sendMessageToContentScript({ type: 'validate-selector', payload: selector }, (response) => {
			this.selectorValidity = response as any;
		});
	}

	handleSelectorTypeChange = () => {
		const newSelectorType: SelectorType = this.selector.type === 'CSS' ? 'XPATH' : 'CSS';
		this.validateSelector({ ...this.selector, type: newSelectorType });

		if (this.type === 'excludeItem') {
			updateExcludedItem({ ...this.selector, id: this.uniqueId, type: newSelectorType }, { ...this.selector, id: this.uniqueId });
		} else {
			updateMetadataItem({ ...this.selector, id: this.uniqueId, name: this.name, type: newSelectorType });
		}
	};

	handleSelectorChange = (event: CustomEvent) => {
		const newPath: string = event.detail.value;
		this.validateSelector({ ...this.selector, path: newPath });

		if (this.type === 'excludeItem') {
			updateExcludedItem({ ...this.selector, id: this.uniqueId, path: newPath }, { ...this.selector, id: this.uniqueId });
		} else {
			updateMetadataItem({ ...this.selector, id: this.uniqueId, name: this.name, path: newPath });
		}
	};

	handleNameChange = (event: CustomEvent) => {
		const newName = event.detail.value;
		// if name is cleared after selector value is filled, simply clear the field - TBD if to go ahead with it
		updateMetadataItem({ ...this.selector, id: this.uniqueId, name: newName, path: newName ? this.selector.path : '' });
	};

	handleCheckboxChange = (event: CustomEvent) => {
		const isChecked = event.detail.checked;
		updateMetadataItem({ ...this.selector, id: this.uniqueId, name: this.name, isBoolean: isChecked });
	};

	removeItem = () => {
		if (this.type === 'excludeItem') {
			removeExcludedItem({ ...this.selector, id: this.uniqueId });
		} else {
			removeMetadataItem(this.uniqueId);
		}
	};

	async showPopover(className) {
		const popover = document.querySelector(`.${className}`) as HTMLIonPopoverElement;
		await popover.present();
		setTimeout(() => {
			popover.dismiss();
		}, 10000);
	}

	componentWillRender() {
		this.validateSelector(this.selector);
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
					<div style={{ flex: '1' }}>
						<ion-input
							class={`name-input ${!this.name ? 'ion-invalid ion-touched' : ''}`}
							fill="outline"
							value={this.name}
							placeholder="Name"
							onIonInput={this.handleNameChange}
							errorText="Required"
						></ion-input>
					</div>
				)}
				<div>
					<ion-input id="selector-type-input" class={cssClassForValidity} fill="outline" value={this.selector.type} onClick={this.handleSelectorTypeChange}></ion-input>
				</div>
				<div style={{ flex: '2' }}>
					<ion-input
						class={this.type === 'excludeItem' ? 'selector-input' : 'metadata-selector-input'}
						fill="outline"
						value={this.selector.path}
						placeholder="expression"
						onIonInput={this.handleSelectorChange}
						disabled={this.name ? false : true}
					></ion-input>
				</div>
				{this.type === 'metadataItem' && (
					<div>
						<ion-checkbox onIonChange={this.handleCheckboxChange} checked={this.selector.isBoolean}></ion-checkbox>
						<ion-icon name="information-circle-outline" id="boolean-information-circle-outline" onClick={() => this.showPopover('boolean-information-circle-outline')}></ion-icon>
						<ion-popover
							id="info-popover"
							class="boolean-information-circle-outline"
							trigger="boolean-information-circle-outline"
							side="top"
							alignment="center"
							showBackdrop={false}
							backdropDismiss={false}
						>
							<ion-content class="ion-padding">Boolean option</ion-content>
						</ion-popover>
					</div>
				)}
				<div class="remove-icon" onClick={this.removeItem}>
					<ion-icon name="remove-circle-outline" size="small" color="primary"></ion-icon>
				</div>
			</div>
		);
	}
}
