/*global chrome*/

import { Component, Host, State, h } from '@stencil/core';
import logo from '../../assets/icon/CoveoLogo.svg';
import state from '../store';
import { initializeAmplitude, logEvent } from '../analytics';

// This function is run in the context of the inspected page, to set the tabID used in the event handlers.
function injectedFunction(tabId: number) {
	(window as any).__WSH_tabid = tabId;
	// console.log('set tabID: ', (window as any).__WSH_tabid);
}

@Component({
	tag: 'app-root',
	styleUrl: 'app-root.scss',
	shadow: false,
})
export class AppRoot {
	@State() version: string = '';

	componentDidLoad() {
		const tabId = chrome.devtools?.inspectedWindow?.tabId;
		// chrome.scripting.executeScript({ target: { tabId }, files: ['content-script.js'] });
		// chrome.scripting.insertCSS({ target: { tabId }, files: ['css/inject.css'] });
		chrome.scripting.executeScript({ target: { tabId }, func: injectedFunction, args: [tabId] });

		initializeAmplitude();
		try {
			let manifest = chrome.runtime.getManifest();
			this.version = 'v' + manifest.version;

			logEvent('viewed home', { version: manifest.version });
		} catch (e) {
			// 'chrome' is undefined in unit tests.
		}
	}

	render() {
		return (
			<Host>
				<header id="top-bar">
					<div class="header-container">
						<ion-img id="coveo-logo-img" src={logo}></ion-img>
						<div id="header-separator"></div>
						<div class="top-bar-text">Web Scraper</div>
					</div>
				</header>

				{state.currentFile?.name ? <create-config /> : <file-explorer />}
				{this.version && <div id="version">{this.version}</div>}
			</Host>
		);
	}
}
