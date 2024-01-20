/*global chrome*/

import { Component, Host, State, h } from '@stencil/core';
import logo from '../../assets/icon/CoveoLogo.svg';
import state from '../store';
import { initializeAmplitude, logErrorEvent, logEvent } from '../analytics';

@Component({
	tag: 'app-root',
	styleUrl: 'app-root.scss',
	shadow: false,
})
export class AppRoot {
	@State() version: string = '';
	@State() error = null;

	componentDidLoad() {
		initializeAmplitude();
		try {
			let manifest = chrome.runtime.getManifest();
			const version = manifest.version + '-beta';
			this.version = `v${version}`;
			logEvent('viewed home', { version });

			this.checkTab();
		} catch (e) {
			// 'chrome' is undefined in unit tests.
			logErrorEvent('error app init', e);
		}
	}

	async checkTab() {
		chrome.tabs.onUpdated.addListener(async (_tabId, _changeInfo, tab) => {
			this.validateTab(tab);
		});
		try {
			const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
			this.validateTab(tab);
		} catch (e) {
			logErrorEvent('checkTab error', e);
		}
	}

	validateTab(tab: chrome.tabs.Tab) {
		// console.log('validateTab', tab.url, tab);
		if (!/https?:\/\/.+/.test(tab.url)) {
			this.error = (
				<span>
					Please open a web page to use this helper. The tool is expecting a URL starting with <code>http://</code> or <code>https://</code>.
				</span>
			);
		} else {
			this.error = null;
		}
		// logEvent('validate tab', { url: tab.url, valid: this.error === null });
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
				{this.error && (
					<div id="tab-error">
						<h2>Invalid page?</h2>
						<ion-icon name="warning-outline" size="large"></ion-icon> &nbsp; &nbsp; {this.error}
					</div>
				)}
				{!this.error && (state.currentFile?.name ? <create-config /> : <file-explorer />)}
				{this.version && <div id="version">{this.version}</div>}
			</Host>
		);
	}
}
