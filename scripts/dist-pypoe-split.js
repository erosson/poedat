#!/usr/bin/env node
// Split one big pypoe output file into one file per `.dat`.
const fs = require('fs')

const input = process.argv[process.argv.length-2]
const output = process.argv[process.argv.length-1]
const all = JSON.parse(fs.readFileSync(input))

fs.mkdirSync(output, {recursive: true})
all.forEach(dat => {
  fs.writeFileSync(output+'/'+dat.filename+'.json', JSON.stringify(dat, null, 2))
  fs.writeFileSync(output+'/'+dat.filename+'.min.json', JSON.stringify(dat))
})
const index = all.map(dat => dat.filename)
fs.writeFileSync(output+'/index.json', JSON.stringify(index, null, 2))
fs.writeFileSync(output+'/index.min.json', JSON.stringify(index))
