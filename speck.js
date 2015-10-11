const speck = require('speckjs')
const fs = require('fs')

const name = './src/index.js'
speck.build({
  name,
  content: fs.readFileSync(name, 'utf8')
}, {ecmaVersion: 6, sourceType: 'module'})
