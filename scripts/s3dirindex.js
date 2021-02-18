#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const promisify = require("util").promisify
const child_process = require("child_process")
const S3 = require("@aws-sdk/client-s3")
const minimist = require("minimist")
const tmp = require("tmp-promise")
const glob = require("glob")

async function main() {
  const args = await parseArgs(process.argv.slice(2))
  const build = (await tmp.dir({unsafeCleanup: true})).path
  const s3 = new S3.S3Client({region: 'us-east-1'})

  // pull tree, build dirindex, push tree
  await runSync(`s3://${args.bucket}/${args.prefix}${args.tree || ''}`, build)
  const indexFiles = (await promisify(glob.glob)(build+'/**', {nodir: true}))
    .map(f => path.relative(build, f).replace(/\\/g, '/'))
  await s3.send(new S3.PutObjectCommand({
    Bucket: args.bucket,
    Key: `${args.prefix}index.json`,
    "Content-Type": "application/json",
    Body: JSON.stringify(indexFiles),
  }))
  const indexHtml = (await fs.promises.readFile(path.join(__dirname, 's3dirindex-template.html')))
    .toString()
    .replace(/\{\{\$LIST\}\}/g, indexFiles
      .map(f => `    <li><a href="${args.tree || '.'}/${f}">${f}</a></li>`)
      .join("\n")
    )
  await s3.send(new S3.PutObjectCommand({
    Bucket: args.bucket,
    Key: `${args.prefix}index.html`,
    ContentType: "text/html",
    Body: indexHtml,
  }))
  console.log(`https://s3.amazonaws.com/${args.bucket}/${args.prefix}index.html`)
}

async function runSync(src, dest, args=[]) {
  return new Promise((resolve, reject) => {
    console.log(`sync: ${src} --> ${dest}`)
    const p = child_process.spawn("aws", ["s3", "sync", src, dest].concat(args))
    // p.stdout.on('data', data => console.log(`${data}`))
    p.stderr.on('data', data => console.error(`${data}`))
    p.on('close', code => {
      if (code) {
        return reject(`aws s3 sync failure: ${code}`)
      }
      return resolve()
    })
  })
}

async function parseArgs(argv) {
  const args = minimist(argv)
  if (!args.bucket || !args.prefix) {
    console.error(`usage: node s3dirindex.js --bucket BUCKET --prefix PREFIX [--tree TREE_PREFIX]`)
    process.exit(1)
  }
  const {bucket, tree} = args
  const prefix = args.prefix
    ? (args.prefix.endsWith("/") ? args.prefix : `${args.prefix}/`)
    : ''
  return {prefix, bucket, tree}
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
