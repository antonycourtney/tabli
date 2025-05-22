// Mock ResizeObserver which is used by Radix UI components
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe() {
    // Mock implementation - does nothing
  }
  
  unobserve() {
    // Mock implementation - does nothing  
  }
  
  disconnect() {
    // Mock implementation - does nothing
  }
};

// Mock requestAnimationFrame for smooth animations
global.requestAnimationFrame = (callback) => {
  setTimeout(callback, 0);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};