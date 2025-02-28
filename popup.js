/**
 * Initialize the popup UI and attach event listeners
 */
const initPopup = () => {
  document.querySelectorAll(".breakpoint-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const width = parseInt(button.dataset.width);
        const prefix = button.querySelector(".prefix").textContent;
        const device = button.dataset.device;

        // Get the active tab
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab) {
          console.error("No active tab found");
          return;
        }

        // Execute the breakpoint viewer in the active tab
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: applyBreakpoint,
          args: [{ width, prefix, device }],
        });

        // Close the popup
        window.close();
      } catch (error) {
        console.error("Failed to apply breakpoint:", error);
        showError(error.message);
      }
    });
  });
};

/**
 * Show an error message in the popup
 * @param {string} message - The error message to display
 */
const showError = (message) => {
  const errorElement = document.createElement("div");
  errorElement.className = "error";
  errorElement.textContent = `Error: ${message}`;

  const container = document.querySelector(".container");
  container.appendChild(errorElement);

  // Remove the error after 3 seconds
  setTimeout(() => {
    errorElement.remove();
  }, 3000);
};

/**
 * Apply a breakpoint to the active tab
 * @param {Object} breakpoint - The breakpoint to apply
 * @param {number} breakpoint.width - The width of the breakpoint
 * @param {string} breakpoint.prefix - The prefix of the breakpoint
 * @param {string} breakpoint.device - The device name of the breakpoint
 */
function applyBreakpoint({ width, prefix, device }) {
  // Helper to preserve scripts and iframes
  const preserveElements = (parent) => {
    const scripts = Array.from(parent.getElementsByTagName("script"));
    const iframes = Array.from(parent.getElementsByTagName("iframe"));
    return [...scripts, ...iframes].map((el) => el.cloneNode(true));
  };

  // Helper to restore preserved elements
  const restoreElements = (elements, parent) => {
    elements.forEach((el) => parent.appendChild(el));
  };

  // Clean up existing elements
  const existingWrapper = document.querySelector(".tw-breakpoint-wrapper");
  const existingContainer = document.querySelector(".tw-breakpoint-container");
  const existingIndicator = document.querySelector(".tw-breakpoint-indicator");
  const existingOverlay = document.querySelector(".tw-loading-overlay");

  if (existingContainer) {
    existingContainer.remove();
  }
  existingIndicator?.remove();
  existingOverlay?.remove();

  // Show loading overlay
  const overlay = document.createElement("div");
  overlay.className = "tw-loading-overlay";
  document.body.appendChild(overlay);

  // Create outer container that centers the content
  const container = document.createElement("div");
  container.className = "tw-breakpoint-container";

  // Create inner wrapper for the content
  const wrapper = document.createElement("div");
  wrapper.className = "tw-breakpoint-wrapper";
  wrapper.style.maxWidth = `${width}px`;

  // Store original styles
  const originalStyles = {
    overflow: document.body.style.overflow,
    background: document.body.style.background,
    margin: document.body.style.margin,
    padding: document.body.style.padding,
    height: document.body.style.height,
    width: document.body.style.width,
  };

  // Apply styles to body
  Object.assign(document.body.style, {
    overflow: "hidden",
    margin: "0",
    padding: "0",
    height: "100%",
    width: "100%",
  });

  // Set CSS variable for background color
  document.documentElement.style.setProperty("--tw-bg-color", "#f1f5f9");

  // Preserve important elements
  const preservedElements = preserveElements(document.body);

  // Move all content except our elements into the wrapper
  Array.from(document.body.children).forEach((child) => {
    if (
      !child.classList.contains("tw-breakpoint-container") &&
      !child.classList.contains("tw-breakpoint-indicator") &&
      !child.classList.contains("tw-loading-overlay")
    ) {
      wrapper.appendChild(child);
    }
  });

  // Restore preserved elements
  restoreElements(preservedElements, wrapper);

  // Assemble the structure
  container.appendChild(wrapper);
  document.body.appendChild(container);

  // Add breakpoint indicator
  const indicator = document.createElement("div");
  indicator.className = "tw-breakpoint-indicator";

  // Add size info
  const sizeInfo = document.createElement("span");
  sizeInfo.textContent = `${prefix}: ${width}px • ${device}`;
  indicator.appendChild(sizeInfo);

  // Add controls
  const controls = document.createElement("div");
  controls.className = "tw-controls";

  // Add reset button
  const resetButton = document.createElement("button");
  resetButton.className = "tw-control-button";
  resetButton.textContent = "✕";
  resetButton.title = "Reset view";
  resetButton.addEventListener("click", () => {
    // Restore original styles
    Object.entries(originalStyles).forEach(([prop, value]) => {
      document.body.style[prop] = value;
    });

    // Remove our elements
    container.remove();
    indicator.remove();
    overlay.remove();
  });

  controls.appendChild(resetButton);
  indicator.appendChild(controls);
  document.body.appendChild(indicator);

  // Remove loading overlay after a short delay
  setTimeout(() => {
    overlay.remove();
  }, 500);
}

// Initialize the popup when the DOM is loaded
document.addEventListener("DOMContentLoaded", initPopup);
