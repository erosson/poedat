#!/usr/bin/env node
const fs = require("fs").promises
const path = require("path")

async function main() {
  const latest = JSON.parse(await fs.readFile("build/latest/version.json")).version
  const versions = (await fs.readdir("build/s3-versions"))
    .filter(v => !v.endsWith('.json'))
  if (!versions.includes(latest)) {
    versions.push(latest)
  }
  const json = {dirs: versions, files: ["latest.json"]}

  await fs.writeFile("dist/s3/versions/index.json", JSON.stringify(json, null, 2))
  await fs.writeFile("dist/s3/versions/index.min.json", JSON.stringify(json))
}
main().catch(err => {
  console.error(err)
  process.exit(1)
})
