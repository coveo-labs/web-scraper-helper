if (typeof __wsh_reload === 'undefined') {
  function __wsh_reload() {
    chrome.runtime.sendMessage({ type: 'page-loaded' }, (response) => {
      if (!window.__WSH_tabid && response?.tabId) {
        window.__WSH_tabid = response.tabId;
      }
    });
  }

  // window.addEventListener('hashchange', __wsh_reload);
  // window.addEventListener('popstate', __wsh_reload);

  let __wsh_lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== __wsh_lastUrl) {
      __wsh_lastUrl = url;
      setTimeout(__wsh_reload, 500);
    }
  }).observe(document, { subtree: true, childList: true });
}

__wsh_reload();
