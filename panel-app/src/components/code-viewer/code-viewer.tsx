import { Component, State, h } from '@stencil/core';
import { formatState, updateState } from '../store';
import copyToClipboardIcon from '../../assets/icon/CopyToClipboard.svg';
import { logEvent } from '../analytics';

@Component({
	tag: 'code-viewer',
	styleUrl: 'code-viewer.scss',
	shadow: false,
})
export class CodeViewer {
	@State() invalidJSON = false;

	handleTextareaInput = (event: Event) => {
		const textarea = event.target as HTMLTextAreaElement;
		this.invalidJSON = updateState(textarea.value);
	};

	copyToClipboard() {
		const textarea = document.querySelector('.code-view textarea');
		if (textarea) {
			(textarea as HTMLTextAreaElement).select();
			document.execCommand('copy');
			logEvent('clicked json copy to clipboard');
		}
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
