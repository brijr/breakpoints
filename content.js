// State management
let state = {
  isResizing: false,
  activeMenu: null,
  activeControls: null,
};

// Constants - Tailwind breakpoints
const BREAKPOINTS = [
  { prefix: "xs", width: 393, device: "iPhone 14 Pro" },
  { prefix: "sm", width: 640, device: "Small Tablet" },
  { prefix: "md", width: 768, device: "iPad Mini" },
  { prefix: "lg", width: 1024, device: "iPad Pro" },
  { prefix: "xl", width: 1280, device: "Laptop" },
  { prefix: "2xl", width: 1536, device: "Desktop" },
  { prefix: "full", width: window.innerWidth, device: "Full Width" },
];

// Utility functions
const createElement = (tag, className, attributes = {}) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  Object.entries(attributes).forEach(([key, value]) => (element[key] = value));
  return element;
};

const cleanupElements = (...selectors) => {
  selectors.forEach((selector) => {
    const element = document.querySelector(selector);
    if (element) element.remove();
  });
};

const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const handleResize = (
  wrapper,
  sizeInfo,
  { prefix, device },
  startPos,
  startWidth,
  isTouch = false
) => {
  const getNewWidth = (currentPos) => {
    const delta = currentPos - startPos;
    return Math.max(320, Math.min(startWidth + delta, window.innerWidth - 48));
  };

  return (e) => {
    if (!wrapper?.dataset?.resizing) return;
    const currentPos = isTouch ? e.touches[0].clientX : e.clientX;
    const newWidth = getNewWidth(currentPos);
    wrapper.style.width = `${newWidth}px`;
    sizeInfo.textContent = `${prefix}: ${newWidth}px • ${device}`;
    wrapper.style.transform =
      newWidth <= 768
        ? `scale(${Math.min(1, (window.innerWidth - 48) / newWidth)})`
        : "none";
    if (isTouch) e.preventDefault();
  };
};

// Component functions
const createIframeContent = () => {
  const container = createElement("div", "tw-content", {
    style: "width: 100%; height: 100%; overflow: hidden;",
  });

  const iframe = createElement("iframe", "", {
    style: "width: 100%; height: 100%; border: none; margin: 0; padding: 0;",
    sandbox: "allow-same-origin allow-scripts allow-forms allow-popups",
    src: window.location.href,
    loading: "eager",
    importance: "high",
  });

  container.appendChild(iframe);
  return { container, iframe };
};

const createControls = (container, indicator) => {
  const controls = createElement("div", "tw-controls");

  // Toggle background button
  const toggleBgButton = createElement("button", "tw-control-button", {
    textContent: "🎨",
    title: "Toggle background",
    onclick: (e) => {
      e.stopPropagation();
      const root = document.documentElement;
      const currentBg = getComputedStyle(root)
        .getPropertyValue("--tw-bg-color")
        .trim();
      root.style.setProperty(
        "--tw-bg-color",
        currentBg === "#000" ? "#111" : "#000"
      );
    },
  });
  controls.appendChild(toggleBgButton);

  // Reset button
  const resetButton = createElement("button", "tw-control-button", {
    textContent: "✕",
    title: "Reset view",
    onclick: () => {
      container.style.animation = "tw-fade-out 0.3s ease-out forwards";
      indicator.style.animation = "tw-fade-out 0.3s ease-out forwards";
      setTimeout(() => {
        container.remove();
        indicator.remove();
        document.body.style.overflow = "";
      }, 300);
    },
  });
  controls.appendChild(resetButton);

  return controls;
};

const createMenu = () => {
  const menu = createElement("div", "tw-breakpoint-menu");
  menu.style.display = "none";

  return menu;
};

// Setup viewport
const setupViewport = () => {
  const container = createElement("div", "tw-breakpoint-container");
  const wrapper = createElement("div", "tw-breakpoint-wrapper");
  const indicator = createElement("div", "tw-breakpoint-indicator");
  const sizeInfo = createElement("span");

  indicator.appendChild(sizeInfo);
  document.body.appendChild(container);
  document.body.appendChild(indicator);

  return { container, wrapper, indicator, sizeInfo };
};

// Setup resize handlers
const setupResizeHandlers = (wrapper, handle, sizeInfo, breakpoint) => {
  const startResize = (startPos, startWidth, isTouch) => {
    wrapper.dataset.resizing = "true";
    const moveHandler = handleResize(
      wrapper,
      sizeInfo,
      breakpoint,
      startPos,
      startWidth,
      isTouch
    );
    const endResize = () => {
      delete wrapper.dataset.resizing;
      if (isTouch) {
        document.removeEventListener("touchmove", moveHandler);
        document.removeEventListener("touchend", endResize);
      } else {
        document.removeEventListener("mousemove", moveHandler);
        document.removeEventListener("mouseup", endResize);
      }
    };

    if (isTouch) {
      document.addEventListener("touchmove", moveHandler, { passive: false });
      document.addEventListener("touchend", endResize);
    } else {
      document.addEventListener("mousemove", moveHandler);
      document.addEventListener("mouseup", endResize);
    }
  };

  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    const startWidth = wrapper.offsetWidth;
    startResize(e.clientX, startWidth);
  });

  handle.addEventListener("touchstart", (e) => {
    const startWidth = wrapper.offsetWidth;
    startResize(e.touches[0].clientX, startWidth, true);
  });
};

// Apply breakpoint
function applyBreakpoint({ width, prefix, device }) {
  cleanupElements(".tw-breakpoint-container", ".tw-breakpoint-indicator");

  const { container, wrapper, indicator, sizeInfo } = setupViewport();

  // Set initial size
  wrapper.style.width = `${width}px`;
  sizeInfo.textContent = `${prefix}: ${width}px • ${device}`;

  // Create content
  const { container: contentContainer, iframe } = createIframeContent();
  wrapper.appendChild(contentContainer);

  // Create resize handle
  const handle = createElement("div", "tw-resize-handle");
  wrapper.appendChild(handle);

  // Setup resize handlers
  setupResizeHandlers(wrapper, handle, sizeInfo, { prefix, device });

  // Add controls
  const controls = createControls(container, indicator);
  indicator.appendChild(controls);

  // Add to DOM
  container.appendChild(wrapper);

  // Apply scaling for small screens
  if (width > window.innerWidth - 48) {
    wrapper.style.transform = `scale(${(window.innerWidth - 48) / width})`;
  }

  // Handle window resize
  const handleWindowResize = debounce(() => {
    if (width > window.innerWidth - 48) {
      wrapper.style.transform = `scale(${(window.innerWidth - 48) / width})`;
    } else {
      wrapper.style.transform = "none";
    }
  }, 100);

  window.addEventListener("resize", handleWindowResize);

  return true;
}

// Toggle breakpoint viewer
function toggleBreakpointViewer() {
  const container = document.querySelector(".tw-breakpoint-container");

  if (container) {
    cleanupElements(".tw-breakpoint-container", ".tw-breakpoint-indicator");
    return false;
  }

  const menu = createMenu();
  document.body.appendChild(menu);

  BREAKPOINTS.forEach((breakpoint) => {
    const button = createElement("button", "tw-breakpoint-button", {
      textContent: `${breakpoint.prefix}: ${breakpoint.width}px`,
      onclick: () => {
        menu.remove();
        applyBreakpoint(breakpoint);
      },
    });
    menu.appendChild(button);
  });

  menu.style.display = "flex";

  // Close menu when clicking outside
  document.addEventListener("click", function closeMenu(e) {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener("click", closeMenu);
    }
  });

  return true;
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleBreakpointViewer") {
    const result = toggleBreakpointViewer();
    sendResponse({ success: result });
    return true;
  }
});
