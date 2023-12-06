/*global chrome*/

import { Component, Host, State, h } from '@stencil/core';
import logo from '../../assets/icon/CoveoLogo.svg';
import state from '../store';
import { initializeAmplitude } from '../analytics';

@Component({
	tag: 'app-root',
	styleUrl: 'app-root.scss',
	shadow: false,
})
export class AppRoot {
	@State() version: string = '';

	componentDidLoad() {
		initializeAmplitude();
		try {
			let manifest = chrome.runtime.getManifest();
			this.version = 'v' + manifest.version;
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
