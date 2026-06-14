#!/usr/bin/env node
let fs = require('fs')

let text = fs.readFileSync('node_modules/whatsapp-web.js/package.json', 'utf8')
let json = JSON.parse(text)
let version = json.dependencies.puppeteer

text = fs.readFileSync('package.json', 'utf8')
json = JSON.parse(text)
json.dependencies.puppeteer = version
text = JSON.stringify(json, null, 2)
fs.writeFileSync('package.json', text + '\n')
