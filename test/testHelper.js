import jsdom from 'jsdom'
const dom = new jsdom.JSDOM('<!doctype html><html><body></body></html>')
const win = dom.window

global.document = win.document
global.window = win

Object.keys(window).forEach((key) => {
  if (!(key in global)) {
    global[key] = window[key]
  }
})
