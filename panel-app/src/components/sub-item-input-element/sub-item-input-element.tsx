import { Component, Prop, h, Event, EventEmitter, State } from '@stencil/core';
import { SelectorElement, Selector, MetadataElement } from '../store';

@Component({
	tag: 'sub-item-input-element',
	styleUrl: 'sub-item-input-element.scss',
	shadow: false,
})
export class SubItemInputElement {
	@Event() updateSubItem: EventEmitter<any>;
	@Prop() uniqueId: string;
	@Prop() type: 'metadataItem' | 'subItem' | 'excludeItem';
	@Prop() name: string;
	@Prop() selector: Selector;
	@State() selectorValidity;

	updateState(action: 'update' | 'remove', newItem: SelectorElement | MetadataElement, oldItem: Selector = { type: 'CSS', path: '' }) {
		this.validateSelector(newItem);
		this.updateSubItem.emit({ action: `${action}-${this.type}`, newItem, oldItem });
	}

	async validateSelector(selector: Selector) {
		const response = await new Promise((resolve) => {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				chrome.tabs.sendMessage(tabs[0].id, { type: 'validate-selector', payload: selector }, null, (response) => {
					resolve(response);
				});
			});
		});
		this.selectorValidity = response;
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
							value={this.name}
							placeholder="Name"
							onIonInput={(event) =>
								this.updateState('update', {
									...this.selector,
									id: this.uniqueId,
									name: event.target.value as string,
								})
							}
						></ion-input>
					</div>
				)}
				<div>
					<ion-input
						id="subItem-selector-type-input"
						fill="outline"
						class={cssClassForValidity}
						value={this.selector.type}
						onClick={() => this.updateState('update', { ...this.selector, id: this.uniqueId, name: this.name, type: this.selector.type === 'CSS' ? 'XPath' : 'CSS' }, this.selector)}
					></ion-input>
				</div>
				<div style={{ flex: '2' }}>
					<ion-input
						class={this.type === 'excludeItem' ? 'selector-input' : this.type === 'metadataItem' ? 'metadata-selector-input' : 'subItem-selector-input'}
						fill="outline"
						value={this.selector.path}
						placeholder="expression"
						onIonInput={(event) => this.updateState('update', { ...this.selector, id: this.uniqueId, name: this.name, path: event.detail.value }, this.selector)}
					></ion-input>
				</div>
				{this.type === 'metadataItem' && (
					<div>
						<ion-checkbox
							checked={this.selector.isBoolean}
							onIonChange={(event) =>
								this.updateState(
									'update',
									{
										...this.selector,
										id: this.uniqueId,
										name: this.name,
										isBoolean: event.detail.checked,
									},
									this.selector
								)
							}
						></ion-checkbox>
						<ion-icon name="information-circle-outline"></ion-icon>
					</div>
				)}
				{!(this.type === 'subItem') && (
					<div
						style={{ cursor: 'pointer' }}
						onClick={() =>
							this.updateState('remove', {
								...this.selector,
								id: this.uniqueId,
								name: this.name,
							})
						}
					>
						<ion-icon name="remove-circle-outline" size="small" color="primary"></ion-icon>
					</div>
				)}
			</div>
		);
	}
}
