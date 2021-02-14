#!/usr/bin/env node
const fs = require("fs").promises
const path = require("path")

async function main() {
  const indexPath = process.argv[process.argv.length-3]
  const poeVersion = process.argv[process.argv.length-2]
  const s3hostname = process.argv[process.argv.length-1]
  // console.error({indexPath, poeVersion, s3hostname})

  const index = JSON.parse(await fs.readFile(indexPath))
  Object.entries(index).map(([file, hash]) => {
    // TODO 301 (perm) redirect, not 302 (temp), once this is more stable. stronger caching that way
    console.log(`/v/${poeVersion}/${file}\t${s3hostname}/by-sha256/${hash}/${path.basename(file)}\t302`)
  })
}
main().catch(err => {
  console.error(err)
  process.exit(1)
})
