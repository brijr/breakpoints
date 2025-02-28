// Create iframe content
exports.createIframeContent = function () {
  const createElement = this.createElement || window.createElement;

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

// Create controls
exports.createControls = function (container, indicator) {
  const createElement = this.createElement || window.createElement;

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

// Create menu
exports.createMenu = function () {
  const createElement = this.createElement || window.createElement;

  const menu = createElement("div", "tw-breakpoint-menu");
  menu.style.display = "none";

  return menu;
};
