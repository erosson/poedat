#!/usr/bin/env node
const fs = require("fs").promises
const path = require("path")

async function main() {
  const versionsPath= process.argv[process.argv.length-2]
  const dist = process.argv[process.argv.length-1]
  // console.error({versionsPath, dist})

  const template = (await fs.readFile(path.join(__dirname, "dist-netlify-dirindex-template.html"))).toString()
  const versions = JSON.parse(await fs.readFile(versionsPath))
  const contents = {files: [], dirs: [].concat(["latest"], versions.map(v => 'v/'+v))}

  const list = []
    .concat(
      contents.dirs.map(d => d + '/'),
      contents.files,
      ["index.json", "index.min.json"],
    )
    .map(basename => `    <li><a href="${basename}">${basename}</a></li>`)
    .join("\n")
  const html = template
    .replace(/\{\{\$DIRNAME\}\}/g, "https://github.com/erosson/poedat")
    .replace(/\{\{\$DESC\}\}/g, `
      <p><a href="https://github.com/erosson/poedat">https://github.com/erosson/poedat</a></p>
      <p>a Path of Exile datamining buildbot</p>
      <p>under construction</p>
    `)
    .replace(/\{\{\$LIST\}\}/g, list)
  await fs.writeFile(path.join(dist, "index.html"), html)
  await fs.writeFile(path.join(dist, "index.json"), JSON.stringify(contents, null, 2))
  await fs.writeFile(path.join(dist, "index.min.json"), JSON.stringify(contents))
}
main().catch(err => {
  console.error(err)
  process.exit(1)
})
