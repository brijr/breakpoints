// Service worker initialization
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

/**
 * Toggle the breakpoint viewer in the active tab
 * @param {chrome.tabs.Tab} tab - The active tab
 * @returns {Promise<void>}
 */
async function toggleBreakpointViewer(tab) {
  try {
    // Ensure we can access the tab
    if (!tab?.url?.startsWith("http")) {
      console.warn("Extension only works on web pages");
      return;
    }

    // Prevent running in special Chrome pages
    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://")
    ) {
      console.warn("Extension cannot run on Chrome system pages");
      return;
    }

    // Check if content script is already injected
    const [{ result: isInjected }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () =>
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        !!chrome.runtime.onMessage,
    });

    // Inject content script if not already injected
    if (!isInjected) {
      await Promise.all([
        chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ["content.css"],
        }),
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        }),
      ]);
    }

    // Toggle the breakpoint viewer
    await chrome.tabs.sendMessage(tab.id, { action: "toggleBreakpointViewer" });
  } catch (error) {
    console.error("Failed to execute script:", error);
  }
}

// Listen for extension icon clicks
chrome.action.onClicked.addListener(toggleBreakpointViewer);
