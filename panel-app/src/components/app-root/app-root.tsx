/*global chrome*/

import { Component, h } from '@stencil/core';
import logo from '../../assets/icon/CoveoLogo.svg';

@Component({
	tag: 'app-root',
	styleUrl: 'app-root.scss',
	shadow: false,
})
export class AppRoot {
	render() {
		return (
			<div>
				<header id="top-bar">
					<div class="header-container">
						<ion-img id="coveo-logo-img" src={logo}></ion-img>
						<div id="header-separator"></div>
						<div class="top-bar-text">Web Scrapper</div>
					</div>
				</header>

				<main>
					<file-explorer></file-explorer>
				</main>
			</div>
		);
	}
}
