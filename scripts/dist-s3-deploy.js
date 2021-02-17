#!/usr/bin/env node
const fs = require("fs").promises
const path = require("path")
const promisify = require("util").promisify
const child_process = require("child_process")
const S3 = require("@aws-sdk/client-s3")

// const prefix = '_test/'
const prefix = ''

async function main() {
  const s3 = new S3.S3Client({region: 'us-east-1'})
  // const res = await s3.send(new S3.ListObjectsCommand({Bucket: "poedat.erosson.org"}))
  // console.log(res)
  // return
  const version = JSON.parse(await fs.readFile(`./dist/s3/versions/latest.json`)).version
  const tree = JSON.parse(await fs.readFile(`./dist/s3/versions/${version}/index.json`))
  for (let [file, hash] of Object.entries(tree)) {
    const key = `${prefix}versions/${version}/${file}`
    console.log(`https://poedat.erosson.org/${key}`)
    const res = await s3.send(new S3.PutObjectCommand({
      Bucket: "poedat.erosson.org",
      Key: key,
      WebsiteRedirectLocation: `/${prefix}by-sha256/${hash}/${path.basename(file)}`,
    }))
  }
}
main().catch(err => {
  console.error(err)
  process.exit(1)
})
