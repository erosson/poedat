# ⚠ **This project is no longer maintained.** 

You should use [poe-dat-viewer](https://snosme.github.io/poe-dat-viewer/) instead. ([github](https://github.com/SnosMe/poe-dat-viewer))

---

# [poedat](https://github.com/erosson/poedat)

Data exported from Path of Exile using [PyPoE](https://github.com/OmegaK2/PyPoE) and [bun_extract_file](https://github.com/zao/ooz), hosted online for easy access from your programs, auto-updated once per day.

**This tool is for programmers. If you're not a programmer, try [poedb](https://poedb.tw/) instead?**

A simple UI for exploring the latest JSON data: https://pypoe-json.erosson.org/

The raw data:

* PyPoE json data: https://poedat.erosson.org/pypoe/v1/tree
  * [latest version](https://poedat.erosson.org/pypoe/v1/latest.json). old patches kept for at least six months
* bun_extract_file's raw `.dat`s: https://poedat.erosson.org/dat/v1/tree
  * [latest version](https://poedat.erosson.org/dat/v1/latest.json). old patches kept for at least six months
* Passive skill tree and league data from pathofexile.com: https://poedat.erosson.org/web/v1
* Json data from the PoE wiki: https://poedat.erosson.org/wiki/v1

### How does this work?

Once a day, the buildbot checks to see if [PoE's Steam depot](https://steamdb.info/depot/238961/) has changed. If it has changed, we download a selection of interesting files, run bun_extract_file and PyPoE, and push the results to Amazon S3 - no human interaction required.

[PoE on steamdb](https://steamdb.info/app/238960/)

[The buildbot's configuration](https://github.com/erosson/poedat/blob/master/.github/workflows/bundle.yml)

### What about [RePoE](https://github.com/brather1ng/RePoE)?

RePoE is a similar project! It's been around much longer, and is very nice. poedat aims for more complete, automatically updated data, with little to no preprocessing beyond what PyPoE gives us. Sometimes "less preprocessing" is less convenient to use; RePoE could be better for you.

### Couldn't I run PyPoE or bun_extract_file myself?

Sure, but now I hope you don't *have* to. Having the data already exported helps me experiment faster and helps keep my programs updated.

### Non-English language support?

Yes! Here's some [French PyPoE files](https://poedat.erosson.org/pypoe/v1/tree/3.13.1e/French/) and [French .dat files](https://poedat.erosson.org/dat/v1/tree/3.13.1e/Data/French/), for example.

[Chinese isn't supported yet, but I'd love help changing that.](https://github.com/erosson/poedat/issues/1)

### Can I hotlink these files, or use them in my own buildbots?

Go for it. They're behind Cloudflare and easily cached, so your links don't add to my costs.

**Make sure your programs follow 301 and 302 redirects**, because poedat redirects identical files to the same url. Data exported from PoE has lots of duplication - most data doesn't change across patches - so this saves me a lot of space.

### License for the files on poedat.erosson.org?

The repository's GPL license applies to only to the scripts and other files in the git repository. I've applied no license to the generated files on poedat.erosson.org; they belong mostly to GGG with credit to the PyPoE, libooz, and poe-wiki folks. I hope you'll use them!
