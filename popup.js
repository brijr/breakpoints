document.querySelectorAll('.breakpoint-btn').forEach(button => {
  button.addEventListener('click', async () => {
    const width = parseInt(button.dataset.width);
    const prefix = button.querySelector('.prefix').textContent;
    const device = button.dataset.device;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (width, prefix, device) => {
        // Helper to preserve scripts and iframes
        const preserveElements = (parent) => {
          const scripts = Array.from(parent.getElementsByTagName('script'));
          const iframes = Array.from(parent.getElementsByTagName('iframe'));
          return [...scripts, ...iframes].map(el => el.cloneNode(true));
        };

        // Helper to restore preserved elements
        const restoreElements = (elements, parent) => {
          elements.forEach(el => parent.appendChild(el));
        };

        // Clean up existing elements
        const existingWrapper = document.querySelector('.tw-breakpoint-wrapper');
        const existingContainer = document.querySelector('.tw-breakpoint-container');
        const existingIndicator = document.querySelector('.tw-breakpoint-indicator');
        const existingOverlay = document.querySelector('.tw-loading-overlay');

        if (existingContainer) {
          existingContainer.remove();
        }
        existingIndicator?.remove();
        existingOverlay?.remove();
        
        // Show loading overlay
        const overlay = document.createElement('div');
        overlay.className = 'tw-loading-overlay';
        document.body.appendChild(overlay);
        
        // Create outer container that centers the content
        const container = document.createElement('div');
        container.className = 'tw-breakpoint-container';
        
        // Create inner wrapper for the content
        const wrapper = document.createElement('div');
        wrapper.className = 'tw-breakpoint-wrapper';
        wrapper.style.maxWidth = `${width}px`;
        
        // Store original styles
        const originalStyles = {
          overflow: document.body.style.overflow,
          background: document.body.style.background,
          margin: document.body.style.margin,
          padding: document.body.style.padding,
          height: document.body.style.height,
          width: document.body.style.width
        };
        
        // Apply styles to body
        Object.assign(document.body.style, {
          overflow: 'auto',
          overflow: 'hidden',
          margin: '0',
          padding: '0',
          height: '100%',
          width: '100%'
        });

        // Set CSS variable for background color
        document.documentElement.style.setProperty('--tw-bg-color', '#f1f5f9');
        
        // Preserve important elements
        const preservedElements = preserveElements(document.body);
        
        // Move all content except our elements into the wrapper
        Array.from(document.body.children).forEach(child => {
          if (!child.classList.contains('tw-breakpoint-container') && 
              !child.classList.contains('tw-breakpoint-indicator') &&
              !child.classList.contains('tw-loading-overlay')) {
            wrapper.appendChild(child);
          }
        });
        
        // Restore preserved elements
        restoreElements(preservedElements, wrapper);
        
        // Assemble the structure
        container.appendChild(wrapper);
        document.body.appendChild(container);
        
        // Add breakpoint indicator
        const indicator = document.createElement('div');
        indicator.className = 'tw-breakpoint-indicator';
        
        // Add size info
        const sizeInfo = document.createElement('span');
        sizeInfo.textContent = `${prefix}: ${width}px • ${device}`;
        indicator.appendChild(sizeInfo);
        
        // Add controls
        const controls = document.createElement('div');
        controls.className = 'tw-controls';
        
        // Add toggle background button
        const toggleBgButton = document.createElement('button');
        toggleBgButton.className = 'tw-control-button';
        toggleBgButton.innerHTML = '🎨';
        toggleBgButton.title = 'Toggle background';
        toggleBgButton.onclick = () => {
          const currentBg = getComputedStyle(document.documentElement)
            .getPropertyValue('--tw-bg-color').trim();
          const newBg = currentBg === '#000' ? '#111' : '#000';
          document.documentElement.style.setProperty('--tw-bg-color', newBg);
        };
        controls.appendChild(toggleBgButton);
        
        // Add reset button to indicator
        const resetButton = document.createElement('button');
        resetButton.className = 'tw-control-button';
        resetButton.innerHTML = '✕';
        resetButton.title = 'Reset view';
        resetButton.onclick = () => {
          // Add fade out animation
          container.style.animation = 'tw-fade-out 0.3s ease-out forwards';
          indicator.style.animation = 'tw-fade-out 0.3s ease-out forwards';
          
          // Remove elements after animation
          setTimeout(() => {
          container.remove();
          indicator.remove();
          Object.assign(document.body.style, originalStyles);
          document.documentElement.style.removeProperty('--tw-bg-color');
          }, 300);
        };
        controls.appendChild(resetButton);
        
        indicator.appendChild(controls);
        document.body.appendChild(indicator);
        
        // Remove loading overlay after a short delay
        setTimeout(() => overlay.remove(), 300);
      },
      args: [width, prefix, device]
    });
    
    window.close();
  });
});