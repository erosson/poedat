#!/usr/bin/env node
// Pull passive skill tree data from GGG's website, and reformat as a json file for easier access.
// This is the format most third-party skill tree planners use, and it's not in our other datamined stuff.
const fs = require("fs").promises
const fetch = require("node-fetch")

async function main() {
  const res = await fetch("https://www.pathofexile.com/passive-skill-tree", {headers: {'User-Agent': 'node-fetch from https://github.com/erosson/poedat'}})
  const body = await res.text()
  // passive skill tree data is a JS variable embedded in <script> tags. crudely extract it
  const raw = body
    .split("var passiveSkillTreeData = ")[1]
    .split("var opts = ")[0]
    .trim()
    .replace(/;$/, '')
  const json = JSON.parse(raw)
  // a few quick sanity tests
  if (!json.assets) throw new Error('json.assets')
  if (!json.classes) throw new Error('json.classes')
  if (!json.min_y) throw new Error('json.min_y')
  if (!json.nodes) throw new Error('json.nodes')
  return json
}
if (require.main === module) {
  main().then(json => {
    fs.writeFile(__dirname+"/../build/latest/passive-skill-tree.json", JSON.stringify(json, null, 2))
    fs.writeFile(__dirname+"/../build/latest/passive-skill-tree.min.json", JSON.stringify(json))
  })
}
