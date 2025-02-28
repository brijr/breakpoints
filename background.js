// Service worker initialization
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

chrome.action.onClicked.addListener((tab) => {
  // Ensure we can access the tab
  if (!tab?.url?.startsWith('http')) {
    console.warn('Extension only works on web pages');
    return;
  }
  
  // Prevent running in special Chrome pages
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    console.warn('Extension cannot run on Chrome system pages');
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.onMessage
  }).then((results) => {
    const isInjected = results[0]?.result;
    
    if (!isInjected) {
      return Promise.all([
        chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content.css']
        }),
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        })
      ]).then(() => {
        return chrome.tabs.sendMessage(tab.id, { action: 'toggleBreakpointViewer' });
      });
    } else {
      return chrome.tabs.sendMessage(tab.id, { action: 'toggleBreakpointViewer' });
    }
  }).catch((error) => {
    console.error('Failed to execute script:', error);
  });
});