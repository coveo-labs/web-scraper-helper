/*global chrome*/

import { Component, Host, h } from '@stencil/core';
import logo from '../../assets/icon/CoveoLogo.svg';
import state from '../store';

@Component({
	tag: 'app-root',
	styleUrl: 'app-root.scss',
	shadow: false,
})
export class AppRoot {
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
			</Host>
		);
	}
}
