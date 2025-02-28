// DOM utility functions
exports.createElement = (tag, className, attributes = {}) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  Object.entries(attributes).forEach(([key, value]) => (element[key] = value));
  return element;
};

exports.cleanupElements = (...selectors) => {
  selectors.forEach((selector) => {
    const element = document.querySelector(selector);
    if (element) element.remove();
  });
};

// Performance utility functions
exports.debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Event handling utilities
exports.handleResize = (
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
