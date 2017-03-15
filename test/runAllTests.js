'use strict'

global.chrome = {
  runtime: {}
}

// N.B. using require() instead of import so global setting above can take effect
require('./tabWindowTest')
require('./viewTests')
require('./semVerTests')
