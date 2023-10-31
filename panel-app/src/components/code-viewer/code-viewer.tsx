import { Component, State, h } from '@stencil/core';
import { formatState, updateState } from '../store';
import copyToClipboardIcon from '../../assets/icon/CopyToClipboard.svg';

@Component({
	tag: 'code-viewer',
	styleUrl: 'code-viewer.scss',
	shadow: true,
})
export class CodeViewer {
	@State() invalidJSON = false;

	handleTextareaInput = (event: Event) => {
		const textarea = event.target as HTMLTextAreaElement;
		this.invalidJSON = updateState(textarea.value);
	};

	copyToClipboard() {
		const json = JSON.stringify(formatState(), null, 2);
		navigator.clipboard.writeText(json);
	}

	render() {
		return (
			<div class="code-view-wrapper">
				<div style={{ display: 'flex', justifyContent: 'space-between' }}>
					<div>Code View</div>
					<div class="copy-to-clipboard" onClick={() => this.copyToClipboard()}>
						<ion-img id="coveo-logo-img" src={copyToClipboardIcon}></ion-img>
						<span></span>
						<span>Copy to clipboard</span>
					</div>
				</div>
				<div class="code-view">
					<textarea class={this.invalidJSON ? 'invalid-JSON' : ''} value={JSON.stringify(formatState(), null, 2)} onInput={(event) => this.handleTextareaInput(event)}></textarea>
				</div>
			</div>
		);
	}
}
