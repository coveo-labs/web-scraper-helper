import { Component, Prop, State, h } from '@stencil/core';
import { getMetadataResults } from '../store';
@Component({
	tag: 'metadata-results',
	styleUrl: 'metadata-results.scss',
	shadow: false,
})
export class MetadataResults {
	@Prop() metadata: any;
	@Prop() type = 'global';
	@Prop() parentSelector;
	@State() results: any;

	async componentWillRender() {
		try {
			this.results = await getMetadataResults(this.type, this.metadata, this.parentSelector);
			console.log('results', this.results);
		} catch (e) {
			console.log(e);
			this.results = [];
		}
	}

	render() {
		return (
			<div class="result-container">
				<table id="resultGlobalTable">
					<thead>
						<tr class="table-header">
							<th>Metadata name</th>
							<th style={{ textAlign: 'left' }}>Value(s)</th>
						</tr>
					</thead>
					<tbody>
						{this.results?.length ? (
							this.results.map((item) => {
								return (
									<tr>
										<td class="metadata-name-section">{item.name}</td>
										<td class="values-section" colSpan={item.values?.length}>
											{item.values?.length ? (
												item.values.map((val, idx) => {
													return <div key={idx}>{val}</div>;
												})
											) : (
												<div></div>
											)}
										</td>
									</tr>
								);
							})
						) : (
							<div></div>
						)}
					</tbody>
				</table>
			</div>
		);
	}
}
