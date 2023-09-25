import { Component, h } from '@stencil/core';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.css',
  shadow: true,
})
export class AppHome {
  render() {
    return (
      <div class="app-home">
        <div>New component below</div>
        <file-explorer></file-explorer>
        {/* 
        <stencil-route-link url="/profile/stencil">
          <button>Profile page</button>
        </stencil-route-link> */}
      </div>
    );
  }
}
