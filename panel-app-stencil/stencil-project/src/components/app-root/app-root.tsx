import { Component, h } from '@stencil/core';
import logo from '../../assets/icon/CoveoLogo.svg';

@Component({
  tag: 'app-root',
  styleUrl: 'app-root.css',
  shadow: true,
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
          <stencil-router>
            {/* <stencil-route-switch scrollTopOffset={0}> */}
            <stencil-route url="/" component="file-explorer" exact={true} />
            <stencil-route url="/createConfig" component="create-config" />
            {/* </stencil-route-switch> */}
          </stencil-router>
        </main>
      </div>
    );
  }
}
