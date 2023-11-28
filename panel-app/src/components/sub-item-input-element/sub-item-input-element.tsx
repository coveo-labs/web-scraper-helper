import { Component, Prop, h, Event, EventEmitter, State } from '@stencil/core';
import { SelectorElement, Selector, MetadataElement } from '../types';
import { sendMessageToContentScript } from '../store';

@Component({
	tag: 'sub-item-input-element',
	styleUrl: 'sub-item-input-element.scss',
	shadow: false,
})
export class SubItemInputElement {
	@Event() updateSubItem: EventEmitter<any>;
	@Prop() uniqueId: string;
	@Prop() type: 'metadataItem' | 'subItem' | 'excludeItem';
	@Prop() selector: Selector | MetadataElement;
	@State() selectorValidity;

	updateState(action: 'update' | 'remove', newProps: Partial<SelectorElement | MetadataElement>, oldItem: Selector = { type: 'CSS', path: '' }) {
		const newItem = { ...this.selector, ...newProps };
		this.validateSelector(newItem);
		this.updateSubItem.emit({ action: `${action}-${this.type}`, newItem, oldItem });
	}

	validateSelector(selector: Selector) {
		sendMessageToContentScript({ type: 'validate-selector', payload: selector }, (response) => {
			this.selectorValidity = response;
		});
	}

	componentWillLoad() {
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
			<div class="subItem-select-element">
				{(this.type === 'metadataItem' || this.type === 'subItem') && (
					<div style={{ flex: '1' }}>
						<ion-input
							class={this.type === 'metadataItem' ? 'metadata-name-input name-input' : 'name-input'}
							fill="outline"
							value={(this.selector as MetadataElement).name}
							placeholder="Name"
							onIonInput={(event) => this.updateState('update', { id: this.uniqueId, name: event.target.value as string })}
						></ion-input>
					</div>
				)}
				<div>
					<ion-input
						id="subItem-selector-type-input"
						fill="outline"
						class={cssClassForValidity}
						value={this.selector.type}
						onClick={() => this.updateState('update', { id: this.uniqueId, type: this.selector.type === 'CSS' ? 'XPATH' : 'CSS' }, this.selector)}
					></ion-input>
				</div>
				<div style={{ flex: '2' }}>
					<ion-input
						class={this.type === 'excludeItem' ? 'selector-input' : this.type === 'metadataItem' ? 'metadata-selector-input' : 'subItem-selector-input'}
						fill="outline"
						value={this.selector.path}
						placeholder="expression"
						onIonInput={(event) => this.updateState('update', { id: this.uniqueId, path: event.detail.value }, this.selector)}
					></ion-input>
				</div>
				{this.type === 'metadataItem' && (
					<div>
						<ion-checkbox checked={this.selector.isBoolean} onIonChange={(event) => this.updateState('update', { id: this.uniqueId, isBoolean: event.detail.checked }, this.selector)}></ion-checkbox>
						<ion-icon name="information-circle-outline"></ion-icon>
					</div>
				)}
				{!(this.type === 'subItem') && (
					<div style={{ cursor: 'pointer' }} onClick={() => this.updateState('remove', { id: this.uniqueId })}>
						<ion-icon name="remove-circle-outline" size="small" color="primary"></ion-icon>
					</div>
				)}
			</div>
		);
	}
}
