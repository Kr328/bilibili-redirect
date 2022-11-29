package main

import (
	_ "embed"
)

//go:generate tsc -p userscript/tsconfig.json --outfile userscript.js

//go:embed userscript.js
var userscript []byte
