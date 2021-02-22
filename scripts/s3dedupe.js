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
const cliProgress = require("cli-progress")
const async = require("async")

async function main() {
  const args = await parseArgs(process.argv.slice(2))
  const srcs = await getSources(args)

  const progress = {}
  const progressFormat =
  progress.multi = new cliProgress.MultiBar({
    noTTYOutput: true,
    notTTYSchedule: 10 * 1000,
    // format string copied from the default, https://github.com/AndiDittrich/Node.CLI-Progress/blob/156fffa0d79fd8553a167fb02850e53cceb1b08c/lib/options.js#L55
    format: '{name}:\t[{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
  })
  progress.hashBuild = progress.multi.create(srcs.length, 0)
  progress.hashUpload = progress.multi.create(1, 0)
  progress.treeUpload = progress.multi.create(srcs.length, 0)
  progress.hashBuild.update(0, {name: 'hash build'})
  progress.hashUpload.update(0, {name: 'hash upload'})
  progress.treeUpload.update(0, {name: 'tree upload'})

  const hashes = await buildHashes(args, srcs, progress.hashBuild)
  // push hashes
  const s3 = new S3.S3Client({region: 'us-east-1'})
  await runSync(hashes.builddir, `s3://${args.bucket}/${args.prefix}`)
  progress.hashUpload.increment()
  progress.hashUpload.stop()
  await pushTree(s3, args, hashes, progress.treeUpload)
  progress.multi.stop()
  console.log(hashes.stats)
}

async function pushTree(s3, args, hashes, progress) {
  // push multiple entries at a time, in parallel
  await async.eachLimit(Object.entries(hashes.entries), 5, async ([file, hash]) => {
    const key = `${args.prefix}${args.tree}${file}`
    const target = `/${args.prefix}${args.hashDir}/${hash}/${path.basename(file)}`
    const res = await s3.send(new S3.PutObjectCommand({
      Bucket: args.bucket,
      Key: key,
      WebsiteRedirectLocation: target,
    }))
    progress.increment()
    // console.log(`s3://${args.bucket}/${key} --> s3://${args.bucket}${target}`)
  })
  progress.stop()
}

async function runSync(src, dest, args=[]) {
  return new Promise((resolve, reject) => {
    // console.log(`sync: ${src} --> ${dest}`)
    const p = child_process.spawn("aws", ["s3", "sync", src, dest].concat(args))
    // p.stdout.on('data', data => console.log(`${data}`))
    p.stdout.on('data', data => null)
    p.stderr.on('data', data => console.error(`${data}`))
    p.on('close', code => {
      if (code) {
        return reject(`aws s3 sync failure: ${code}`)
      }
      return resolve()
    })
  })
}

async function buildHashes(args, srcs, progress) {
  const stats = {count: 0, dupes: 0}
  const entries = {}
  const builddir = path.join(args.build, "push")

  for (let rawsrc of srcs) {
    const src = path.relative(args.source, rawsrc).replace(/\\/g, '/')
    const basename = path.basename(src)
    const dirname = path.dirname(src)
    const sum = await fileHash(rawsrc)
    // console.log(src, sum)

    // ./build/by-sha256/...abcdef.../file.json
    const byHashDir = path.join(builddir, args.hashDir, sum)
    const hashTarget = path.join(byHashDir, basename)
    await fs.promises.mkdir(byHashDir, {recursive: true})
    try {
      // COPYFILE_EXCL: fail if the file already exists, without the race condition of pre-checking
      await fs.promises.copyFile(rawsrc, hashTarget, fs.constants.COPYFILE_EXCL)
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
    // const treeDir = path.join(args.build, args.tree, dirname)
    // await fs.promises.mkdir(treeDir, {recursive: true})
    // await fs.promises.writeFile(path.join(treeDir, basename), sum)

    stats.count += 1
    entries[src] = sum
    progress.increment()
  }
  progress.stop()

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
  const prefix = args.prefix || '/'
  if (prefix && !prefix.endsWith('/')) throw new Error('--prefix must end with "/"')
  const hashDir = 'by-sha256'
  const tree = args.tree || "tree/"
  if (!tree.endsWith('/')) throw new Error('--tree must end with "/"')

  const build = await getBuildDir(args)
  return {source, bucket, prefix, build, hashDir, tree}
}

async function getBuildDir(args) {
  if (args.build) {
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
