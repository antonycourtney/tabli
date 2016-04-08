/*
 * A simple wrapper around leakTest.js
 * so we can (hopefully) run from vanilla node rather than babel-node,
 * and so hopefully also be runnable with node-inspector so that
 * we can do heap analysis
 */
require('babel-register')({
  presets: ['es2015','react']
});
require('./leakTest.js');