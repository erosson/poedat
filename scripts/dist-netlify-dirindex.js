#!/usr/bin/env node
const fs = require("fs").promises
const path = require("path")

async function main() {
  const indexPath = process.argv[process.argv.length-3]
  const poeVersion = process.argv[process.argv.length-2]
  const distTail = process.argv[process.argv.length-1]
  const dist = path.join(distTail, poeVersion)
  // console.error({indexPath, poeVersion, distTail, dist})

  const template = (await fs.readFile(path.join(__dirname, "dist-netlify-dirindex-template.html"))).toString()
  const index = JSON.parse(await fs.readFile(indexPath))
  const byDirname = {}
  Object.keys(index).forEach(file => {
    const dirname = path.dirname(file)
    const basename = path.basename(file)
    byDirname[dirname] = (byDirname[dirname] || {files: [], dirs: new Set()})
    byDirname[dirname].files.push(basename)
    const parent = path.dirname(dirname)
    if (parent) {
      byDirname[parent] = (byDirname[parent] || {files: [], dirs: new Set()})
      byDirname[parent].dirs.add(path.basename(dirname))
    }
  })
  await Promise.all(Object.entries(byDirname).map(async ([dirname, contents]) => {
    contents.dirs.delete(".")
    contents = {...contents, dirs: Array.from(contents.dirs.values())}
    const list = []
      .concat(
        [".."],
        contents.dirs.map(d => d + '/'),
        contents.files,
        ["index.json", "index.min.json"],
      )
      .map(basename => `    <li><a href="${basename}">${basename}</a></li>`)
      .join("\n")
    const html = template
      .replace(/\{\{\$DIRNAME\}\}/g, path.join(poeVersion, dirname))
      .replace(/\{\{\$DESC\}\}/g, "")
      .replace(/\{\{\$LIST\}\}/g, list)
    await fs.mkdir(path.join(dist, dirname), {recursive: true})
    await fs.writeFile(path.join(dist, dirname, "index.html"), html)
    await fs.writeFile(path.join(dist, dirname, "index.json"), JSON.stringify(contents, null, 2))
    await fs.writeFile(path.join(dist, dirname, "index.min.json"), JSON.stringify(contents))
  }))
}
main().catch(err => {
  console.error(err)
  process.exit(1)
})
