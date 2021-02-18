#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const promisify = require("util").promisify
const child_process = require("child_process")
const S3 = require("@aws-sdk/client-s3")
const minimist = require("minimist")
const tmp = require("tmp-promise")
const glob = require("glob")
const crypto = require("crypto")

async function main() {
  const args = await parseArgs(process.argv.slice(2))
  const srcs = await getSources(args)

  const hashes = await buildHashes(args, srcs)
  // push hashes
  const s3 = new S3.S3Client({region: 'us-east-1'})
  await runSync(hashes.builddir, `s3://${args.bucket}/${args.prefix}`)
  await pushTree(s3, args, hashes)
  console.log(hashes.stats)
}

async function pushTree(s3, args, hashes) {
  for (let [file, hash] of Object.entries(hashes.entries)) {
    const key = `${args.prefix}${args.treeRoot}/${file}`
    const target = `/${args.prefix}${args.hashDir}/${hash}/${path.basename(file)}`
    const res = await s3.send(new S3.PutObjectCommand({
      Bucket: args.bucket,
      Key: key,
      WebsiteRedirectLocation: target,
    }))
    // console.log(`s3://${args.bucket}/${key} --> s3://${args.bucket}${target}`)
  }
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

async function buildHashes(args, srcs) {
  const stats = {count: 0, dupes: 0}
  const entries = {}
  const builddir = path.join(args.build, "push")
  for (let src of srcs) {
    const basename = path.basename(src)
    const dirname = path.dirname(src)
    const sum = await fileHash(src)
    // console.log(src, sum)

    // ./build/by-sha256/...abcdef.../file.json
    const byHashDir = path.join(builddir, args.hashDir, sum)
    const hashTarget = path.join(byHashDir, basename)
    await fs.promises.mkdir(byHashDir, {recursive: true})
    try {
      // COPYFILE_EXCL: fail if the file already exists, without the race condition of pre-checking
      await fs.promises.copyFile(src, hashTarget, fs.constants.COPYFILE_EXCL)
    }
    catch (e) {
      if (fs.promises.access(hashTarget)) {
        stats.dupes += 1
        // ...and continue running without rethrowing. duplicate files are allowed!
      }
      else {
        throw e
      }
    }

    // ./build/tree/path/to/some/file.json
    // const treeDir = path.join(args.build, args.treeRoot, dirname)
    // await fs.promises.mkdir(treeDir, {recursive: true})
    // await fs.promises.writeFile(path.join(treeDir, basename), sum)

    stats.count += 1
    entries[src] = sum
  }

  return {entries, stats, builddir}
}

async function parseArgs(argv) {
  const args = minimist(argv)
  const [source] = args._
  const {bucket} = args
  if (!source || !args.bucket) {
    console.error(`usage: node s3dedupe.js SOURCE --bucket BUCKET [--prefix PREFIX] [--build BUILD_DIR]`)
    process.exit(1)
  }
  const prefix = args.prefix
    ? (args.prefix.endsWith("/") ? args.prefix : `${args.prefix}/`)
    : ''
  // TODO parameterize
  const hashDir = 'by-sha256'
  const treeRoot = 'tree'

  const build = await getBuildDir(args)
  return {source, bucket, prefix, build, hashDir, treeRoot}
}

async function getBuildDir(args) {
  if (args.build) {
    if ((await fs.promises.stat(args.build)).isFile()) {
      throw new Error("build directory should not be a file")
    }
    await fs.promises.rmdir(args.build, {recursive: true})
    await fs.promises.mkdir(args.build, {recursive: true})
    return args.build
  }
  else {
    const d = await tmp.dir({unsafeCleanup: true})
    return d.path
  }
}

async function fileHash(src) {
  const hash = crypto.createHash('sha256')
  for await (const chunk of fs.createReadStream(src)) {
    hash.update(chunk)
  }
  return hash.digest('hex')
}

async function getSources(args) {
  let source = args.source
  if (!glob.hasMagic(source) && (await fs.promises.stat(source)).isDirectory()) {
    // source is a single directory
    source += '/**'
  }
  return await promisify(glob.glob)(source, {nodir: true})
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
