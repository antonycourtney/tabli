
const chromeConstants = { BROWSER_NAME: 'chrome', BROWSER_PATH_PREFIX: '../' }
const braveConstants = { BROWSER_NAME: 'brave', BROWSER_PATH_PREFIX: '../node_modules/tabli-core/' }

/**
 * do browser detection and assign constants to exported bindings.
 *
 * Should only happen once.
 */
function initBrowser() {
  if (window.chrome) {
    Object.assign(module.exports,chromeConstants) 
  } else {
    Object.assign(module.exports,braveConstants)
  }
}


// Note that this assignment needs to appear BEFORE the initialized
// check and initBrowser call that follows
module.exports = { BROWSER_NAME: undefined, BROWSER_PATH_PREFIX: undefined }

let initialized = false;
if (!initialized) {
  initBrowser();
  initialized = true;
}
