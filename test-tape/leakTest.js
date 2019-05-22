import * as TabWindow from '../src/js/tabWindow'
import difflet from 'difflet'
import * as testData from './testData'
import test from 'tape'
import * as process from 'process'
import * as util from 'util'
import * as _ from 'lodash'
import filesize from 'filesize'

var memwatch = require('memwatch-next')
// memwatch.setup()

memwatch.on('leak', function (info) {
  console.error('Memory leak detected: ', info)
})

const NITER = 100000

// returns formatted mem usage as a string:
function formattedMemUsage () {
  const rawmu = process.memoryUsage()
  const fmtmu = _.mapValues(rawmu, (v) => filesize(v))
  return util.inspect(fmtmu)
}

test('updateLeakTest', (t) => {

  global.gc()
  console.log('leakTest: initial mem usage: ', formattedMemUsage())

  // Let's first create the tabWindow for our saved bookmark folder:
  var tabWindow = TabWindow.makeFolderTabWindow(testData.d3BookmarkFolder)
  const tabWindowJS = JSON.parse(JSON.stringify(tabWindow.toJS()))

  /*
    console.log("makeFolderTabWindow returned:")
    console.log(">>>>>>>")
    console.log(JSON.stringify(tabWindowJS,null,2))
    console.log(">>>>>>>")
  */

  /*
  console.log('diffs between tabWindowJS and expected:')
  dumpDiffs(tabWindowJS, testData.d3InitialExpectedTabWindow)
  */

  t.deepEqual(tabWindowJS, testData.d3InitialExpectedTabWindow, 'attachChromeWindow basic functionality')

  t.equal(tabWindow.title, 'd3 docs', 'saved window title matches bookmark folder')

  for (var i = 0; i < NITER; i++) {
    if ((i % 10000) == 0) {
      console.log('iteration: ', i)
    }
    tabWindow = TabWindow.updateWindow(tabWindow, testData.d3OpenedChromeWindow)
  }
  const updTabWindow = tabWindow
  const updTabWindowJS = JSON.parse(JSON.stringify(updTabWindow.toJS()))

  /*
    console.log("updateTabWindow returned:")
    console.log(">>>>>>>")
    console.log(JSON.stringify(updTabWindowJS,null,2))
    console.log(">>>>>>>")
  */
  /*
    console.log("diffs between updTabWindow (actual) and expected:")
    dumpDiffs(updTabWindowJS, testData.d3AttachedExpectedTabWindow)
  */

  t.deepEqual(updTabWindowJS, testData.d3AttachedExpectedTabWindow, 'updateWindow -- after attach')

  console.log('performing GC:')
  global.gc()

  console.log('leakTest: final mem usage: ', formattedMemUsage())

  t.end()
})
