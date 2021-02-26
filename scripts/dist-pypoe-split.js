#!/usr/bin/env node
// Split one big pypoe output file into one file per `.dat`.
const fs = require('fs')

const input = process.argv[process.argv.length-2]
const output = process.argv[process.argv.length-1]
const all = JSON.parse(fs.readFileSync(input))

fs.mkdirSync(output, {recursive: true})
const sizes = {}
all.forEach(dat => {
  const json = JSON.stringify(dat)
  fs.writeFileSync(output+'/'+dat.filename+'.json', JSON.stringify(dat, null, 2))
  fs.writeFileSync(output+'/'+dat.filename+'.min.json', json)
  sizes[dat.filename] = json.length
})
const index = all.map(dat => ({
  filename: dat.filename,
  numHeaders: dat.header.length,
  numItems: dat.data.length,
  size: sizes[dat.filename],
}))
fs.writeFileSync(output+'/pypoe.json', JSON.stringify(index))
