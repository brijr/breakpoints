// Constants
const BREAKPOINTS = [
  { prefix: 'xs', width: 393, device: 'iPhone 14 Pro' },
  { prefix: 'sm', width: 640, device: 'Small Tablet' },
  { prefix: 'md', width: 768, device: 'iPad Mini' },
  { prefix: 'lg', width: 1024, device: 'iPad Pro' },
  { prefix: 'xl', width: 1280, device: 'Laptop' },
  { prefix: '2xl', width: 1536, device: 'Desktop' },
  { prefix: 'full', width: window.innerWidth, device: 'Full Width' }
];

// State management
let state = {
  isResizing: false,
  activeMenu: null,
  activeControls: null
};

// Utility functions
const createElement = (tag, className, attributes = {}) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  Object.entries(attributes).forEach(([key, value]) => element[key] = value);
  return element;
};

const cleanupElements = (...selectors) => {
  selectors.forEach(selector => {
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

const handleResize = (wrapper, sizeInfo, { prefix, device }, startPos, startWidth, isTouch = false) => {
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
    wrapper.style.transform = newWidth <= 768 ? `scale(${Math.min(1, (window.innerWidth - 48) / newWidth)})` : 'none';
    if (isTouch) e.preventDefault();
  };
};

// Create iframe content
const createIframeContent = () => {
  const container = createElement('div', 'tw-content', {
    style: 'width: 100%; height: 100%; overflow: hidden;'
  });

  const iframe = createElement('iframe', '', {
    style: 'width: 100%; height: 100%; border: none; margin: 0; padding: 0;',
    sandbox: 'allow-same-origin allow-scripts allow-forms allow-popups',
    src: window.location.href,
    loading: 'eager',
    importance: 'high'
  });

  container.appendChild(iframe);
  return { container, iframe };
};

// Create controls
const createControls = (container, indicator) => {
  const controls = createElement('div', 'tw-controls');

  // Toggle background button
  const toggleBgButton = createElement('button', 'tw-control-button', {
    textContent: '🎨',
    title: 'Toggle background',
    onclick: (e) => {
      e.stopPropagation();
      const root = document.documentElement;
      const currentBg = getComputedStyle(root).getPropertyValue('--tw-bg-color').trim();
      root.style.setProperty('--tw-bg-color', currentBg === '#000' ? '#111' : '#000');
    }
  });
  controls.appendChild(toggleBgButton);

  // Reset button
  const resetButton = createElement('button', 'tw-control-button', {
    textContent: '✕',
    title: 'Reset view',
    onclick: () => {
      container.style.animation = 'tw-fade-out 0.3s ease-out forwards';
      indicator.style.animation = 'tw-fade-out 0.3s ease-out forwards';
      setTimeout(() => {
        cleanupElements('meta[name="viewport"][data-tw-original]');
        container.remove();
        indicator.remove();
        state.activeControls = null;
      }, 300);
    }
  });
  controls.appendChild(resetButton);

  return controls;
};

// Create menu
function createMenu() {
  const menu = createElement('div', 'tw-menu');

  BREAKPOINTS.forEach(breakpoint => {
    const item = createElement('button', 'tw-menu-item', {
      onclick: () => applyBreakpoint(breakpoint)
    });

    ['prefix', 'size', 'device'].forEach(type => {
      const span = createElement('span', type);
      span.textContent = type === 'size' ? `${breakpoint.width}px` : breakpoint[type];
      item.appendChild(span);
    });

    menu.appendChild(item);
  });

  return menu;
}

const closeMenu = (e) => {
  if (!e.target.closest('.tw-menu') && !e.target.closest('.tw-menu-button')) {
    state.activeMenu?.remove();
    state.activeMenu = null;
    document.removeEventListener('click', closeMenu);
  }
};

// Toggle menu visibility
function toggleMenu() {
  if (state.activeMenu) {
    state.activeMenu.remove();
    state.activeMenu = null;
    return;
  }

  // Close menu when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!e.target.closest('.tw-menu') && !e.target.closest('.tw-menu-button') && state.activeMenu) {
        state.activeMenu.remove();
        state.activeMenu = null;
        document.removeEventListener('click', closeMenu);
      } 
    });
  }, 0);

  state.activeMenu = createMenu();
  document.body.appendChild(state.activeMenu);
}

// Setup viewport
const setupViewport = () => {
  const existingViewport = document.querySelector('meta[name="viewport"]');
  if (existingViewport) {
    existingViewport.setAttribute('data-tw-original', existingViewport.content);
  }

  const viewport = createElement('meta', '', {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1'
  });
  document.head.appendChild(viewport);
};

// Setup resize handlers
const setupResizeHandlers = (wrapper, handle, sizeInfo, breakpoint) => {
  const startResize = (startPos, startWidth, isTouch) => {
    state.isResizing = true;
    wrapper.dataset.resizing = 'true';
    if (!isTouch) document.body.style.cursor = 'ew-resize';

    const moveHandler = handleResize(wrapper, sizeInfo, breakpoint, startPos, startWidth, isTouch);
    const endResize = () => {
      state.isResizing = false;
      delete wrapper.dataset.resizing;
      if (!isTouch) document.body.style.cursor = '';
      document[isTouch ? 'removeEventListener' : 'removeEventListener'](
        isTouch ? 'touchmove' : 'mousemove',
        moveHandler
      );
    };
    const debouncedMoveHandler = debounce(moveHandler, 16);

    document[isTouch ? 'addEventListener' : 'addEventListener'](
      isTouch ? 'touchmove' : 'mousemove',
      moveHandler
    );
    document[isTouch ? 'addEventListener' : 'addEventListener'](
      isTouch ? 'touchend' : 'mouseup',
      endResize,
      { once: true }
    );
  };

  handle.addEventListener('mousedown', (e) => {
    startResize(e.clientX, wrapper.offsetWidth, false);
  });

  handle.addEventListener('touchstart', (e) => {
    startResize(e.touches[0]?.clientX || 0, wrapper.offsetWidth, true);
    e.preventDefault();
  });
};

// Apply breakpoint
function applyBreakpoint({ width, prefix, device }) {
  cleanupElements(
    '.tw-breakpoint-wrapper:not([data-tw-preserved])',
    '.tw-breakpoint-container:not([data-tw-preserved])',
    '.tw-breakpoint-indicator:not([data-tw-preserved])',
    '.tw-loading-overlay:not([data-tw-preserved])',
    '.tw-menu:not([data-tw-preserved])'
  );

  const overlay = createElement('div', 'tw-loading-overlay');
  document.body.appendChild(overlay);

  const container = createElement('div', 'tw-breakpoint-container');
  const wrapper = createElement('div', 'tw-breakpoint-wrapper');

  wrapper.setAttribute('data-tw-preserved', 'true');

  // Set initial width and transform
  if (prefix === 'full') {
    wrapper.style.width = '100%';
    wrapper.style.maxWidth = 'none';
  } else {
    if (width <= 768) {
      wrapper.style.width = '100%';
      wrapper.style.minWidth = `${width}px`;
      wrapper.style.transform = `scale(${Math.min(1, (window.innerWidth - 48) / width)}) translateZ(0)`;
      wrapper.style.transformOrigin = 'top left';
    } else {
      wrapper.style.width = `${width}px`;
      wrapper.style.transform = 'none';
    }
    wrapper.style.maxWidth = '100%';
  }

  wrapper.style.willChange = 'transform, width';
  const resizeHandle = createElement('div', 'tw-resize-handle');
  wrapper.appendChild(resizeHandle);

  setupViewport();

  const { container: contentContainer, iframe } = createIframeContent();
  wrapper.appendChild(contentContainer);

  // Performance optimization
  wrapper.style.backfaceVisibility = 'hidden';
  wrapper.style.perspective = '1000px';
  wrapper.style.transform = wrapper.style.transform + ' translateZ(0)';

  // Handle iframe load
  iframe.onload = () => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      let viewportMeta = iframeDoc.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        viewportMeta = iframeDoc.createElement('meta');
        viewportMeta.name = 'viewport';
        iframeDoc.head.appendChild(viewportMeta);
      }
      viewportMeta.content = 'width=device-width, initial-scale=1, shrink-to-fit=no';
      iframeDoc.documentElement.style.background = '#fff';
    } catch (e) {
      contentContainer.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 2rem;
          text-align: center;
          color: #666;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <div>
            <h2 style="margin: 0 0 1rem; font-size: 1.5rem; font-weight: 500;">Content Security Policy Restriction</h2>
            <p style="margin: 0; line-height: 1.5;">
              This website's security policy prevents the breakpoint viewer from displaying the content directly.
              <br>
              Please try opening the website in a new tab at your desired breakpoint width.
            </p>
          </div>
        </div>
      `;
    }
  };

  container.appendChild(wrapper);
  container.style.opacity = '0';
  document.body.appendChild(container);

  requestAnimationFrame(() => {
    container.style.transition = 'opacity 0.2s ease-out';
    container.style.opacity = '1';
  });

  const indicator = createElement('div', 'tw-breakpoint-indicator');
  indicator.setAttribute('data-tw-preserved', 'true');
  const sizeInfo = createElement('span', '', {
    textContent: `${prefix}: ${width}px • ${device}`
  });
  indicator.appendChild(sizeInfo);

  const controls = createControls(container, indicator);
  indicator.appendChild(controls);
  state.activeControls = controls;
  document.body.appendChild(indicator);

  setupResizeHandlers(wrapper, resizeHandle, sizeInfo, { prefix, device });

  setTimeout(() => overlay.remove(), 300);
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== 'toggleBreakpointViewer') return false;
  
  // Prevent multiple instances
  const existingElements = document.querySelectorAll(
    '.tw-breakpoint-container, .tw-breakpoint-indicator, .tw-menu, .tw-menu-button'
  );

  // Reset state
  state = {
    isResizing: false,
    activeMenu: null,
    activeControls: null
  };
  
  if (existingElements.length > 0) {
    existingElements.forEach(el => el.remove());
    sendResponse({ success: true });
    return true;
  }

  try {
    // Check if we're in an iframe
    if (window !== window.top) {
      console.warn('Breakpoint viewer cannot be initialized in an iframe');
      sendResponse({ success: false, error: 'Cannot initialize in iframe' });
      return true;
    }

    const newButton = createElement('button', 'tw-menu-button', {
      innerHTML: '📱 Breakpoints',
      onclick: toggleMenu
    });
    document.body.appendChild(newButton);
    sendResponse({ success: true });
  } catch (error) {
    console.error('Breakpoint viewer error:', error);
    sendResponse({ success: false, error: error.message });
  }
  return true;
});