# [poedat](https://github.com/erosson/poedat)

Data exported from Path of Exile, auto-updated once per day, hosted on the web for easy access. Use it in your PoE programs to keep up with PoE patch changes more easily.

This tool is for programmers. If you're not a programmer, try [poedb](https://poedb.tw/) instead?

* [PyPoE](https://github.com/OmegaK2/PyPoE) json data: https://poedat.erosson.org/pypoe/v1/tree
  * A nice UI for these JSON files: https://pypoe-json.erosson.org/
  * [latest version](https://poedat.erosson.org/pypoe/v1/latest.json). old patches kept for at least six months
* [bun_extract_file](https://github.com/zao/ooz)'s raw `.dat`s: https://poedat.erosson.org/dat/v1/tree
  * [latest version](https://poedat.erosson.org/dat/v1/latest.json). old patches kept for at least six months
* Passive skill tree and league data from pathofexile.com: https://poedat.erosson.org/web/v1
* Json data from the PoE wiki: https://poedat.erosson.org/wiki/v1

**Make sure your programs follow 301 and 302 redirects**, because poedat redirects identical files to the same url. Data exported from PoE has lots of duplication (most data doesn't change across patches), so this saves me a lot of space.

**Feel free to hotlink poedat.erosson.org, or use in your own buildbots.** These are all easily-cached static files, so hotlinking costs me nothing.

The repository's GPL license applies to only to the scripts and other files in the git repository. The generated files on poedat.erosson.org are not licensed, and belong mostly to GGG with credit to the PyPoE, libooz, and poe-wiki folks.
