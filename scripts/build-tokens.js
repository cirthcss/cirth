const fs = require("node:fs");
const path = require("node:path");

const { tokenSchemes } = require("./lib/dist-manifest");
const { buildTokenDocuments } = require("./lib/tokens");
const { version } = require("../package.json");

// Writes the DTCG token export (gh#93) from the stylesheet the build just
// produced. It runs on every build, like the minify step, so the tokens are
// never edited or committed by hand: change src/, rebuild, and they follow.
const distFolder = path.join(__dirname, "../dist");
const tokensFolder = path.join(distFolder, "tokens");

const documents = buildTokenDocuments(
	fs.readFileSync(path.join(distFolder, "cirth.css"), "utf8"),
	version,
);

fs.rmSync(tokensFolder, { recursive: true, force: true });
fs.mkdirSync(tokensFolder, { recursive: true });

for (const scheme of tokenSchemes) {
	fs.writeFileSync(
		path.join(tokensFolder, `${scheme}.tokens.json`),
		`${JSON.stringify(documents[scheme], null, "\t")}\n`,
	);
}
