import { Component, Prop, State, h } from '@stencil/core';
import { getMetadataResults } from '../store';
import { Selector } from '../types';
import { logErrorEvent } from '../analytics';
@Component({
	tag: 'metadata-results',
	styleUrl: 'metadata-results.scss',
	shadow: false,
})
export class MetadataResults {
	@Prop() metadata: any;
	@Prop() type = 'global';
	@Prop() parentSelector: Selector;
	@State() results: any;

	async componentWillRender() {
		try {
			this.results = await getMetadataResults(this.type, this.metadata, this.parentSelector);
			console.log('results', this.results);
		} catch (e) {
			logErrorEvent('error meta render', e);
			this.results = [];
		}
	}

	render() {
		let rows = [];
		this.results.forEach((groupedItems, index: number) => {
			if (!(groupedItems instanceof Array)) {
				groupedItems = [groupedItems];
			}

			groupedItems.forEach((item) => {
				rows.push(
					<tr class={index % 2 ? 'even' : 'odd'}>
						<td class="metadata-name-section">{item.name}</td>
						<td class="values-section">
							{item.values?.length ? (
								item.values.map((val, idx) => {
									return (
										<div class={'valueItem'} key={idx}>
											{val}
										</div>
									);
								})
							) : (
								<div></div>
							)}
						</td>
					</tr>
				);
			});
		});

		return (
			<div class="result-container">
				<table id="resultGlobalTable">
					<thead>
						<tr class="table-header">
							<th>Metadata name</th>
							<th style={{ textAlign: 'left' }}>Value(s)</th>
						</tr>
					</thead>
					<tbody>{rows}</tbody>
				</table>
			</div>
		);
	}
}
