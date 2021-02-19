ASSETS_EXE_PATH="`pwd`/assets/exe/depot"
ASSETS_PATH="`pwd`/assets/content/depot"

build-strings() {
  mkdir -p build/strings
  [ ! -f "build/strings/strings.exe" ] && unzip third-party/Strings.zip -d build/strings
  strings -accepteula >/dev/null 2>/dev/null || true
  PATH=$PATH:`pwd`/build/strings
}

build-ooz() {
  mkdir -p build/ooz
  # `--location` follows 30X redirects
  [ -f build/ooz/bun_extract_file.exe ] || curl --location https://github.com/erosson/ooz/releases/download/latest/bun_extract_file.exe --output build/ooz/bun_extract_file.exe
  [ -f build/ooz/libbun.dll ] || curl --location https://github.com/erosson/ooz/releases/download/latest/libbun.dll --output build/ooz/libbun.dll
  [ -f build/ooz/ooz.exe ] || curl --location https://github.com/erosson/ooz/releases/download/latest/ooz.exe --output build/ooz/ooz.exe
  [ -f build/ooz/libooz.dll ] || curl --location https://github.com/erosson/ooz/releases/download/latest/libooz.dll --output build/ooz/libooz.dll
  PATH=$PATH:`pwd`/build/ooz
}

build-version() {
  build-strings
  if [ -f build/version/version.txt ]; then
    POE_VERSION="`cat build/version/version.txt`"
    echo $POE_VERSION
  else
    mkdir -p build/version
    POE_VERSION="`strings "$ASSETS_EXE_PATH/PathOfExileSteam.exe" | grep release/tags/ | sed -e "s_release/tags/__"`"
    if [ -z $POE_VERSION ]; then
      echo "Failed to find poe version"
      exit 1
    fi
    echo "${POE_VERSION}" | tee "build/version/version.txt"
    echo "{\"version\":\"${POE_VERSION}\"}" > "build/version/version.json"
  fi
}
