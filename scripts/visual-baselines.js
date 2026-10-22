const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");

// The visual-regression baselines live outside Git, as assets of one
// GitHub pre-release; tests/visual-baselines.json pins, for every commit,
// the exact set each Playwright project compares against.
//
//   node scripts/visual-baselines.js pull   [--platform linux|darwin|all] [--force]
//   node scripts/visual-baselines.js push   [--platform linux|darwin|all]
//   node scripts/visual-baselines.js status [--platform linux|darwin|all]
//   node scripts/visual-baselines.js key    [--platform linux|darwin|all]
//   node scripts/visual-baselines.js prune  [--min-age-days 7] [--dry-run]
//   node scripts/visual-baselines.js init
//
// They used to be Git LFS objects. Each full set is about 700MB per
// platform and was regenerated on almost every push: 18GB of new images in
// sixty days, against the 10GB of LFS storage a free organisation gets and
// cannot reclaim without deleting the repository. Release assets have no
// total size or bandwidth limit, so the history of the images moves there
// and Git keeps only their fingerprints.
//
// One archive per Playwright project folder (tests/__screenshots__/
// <project>-<platform>/), because a release holds at most 1000 assets and
// a folder is the unit a visual change usually touches. An archive is
// named after a digest of its folder's images, not of its bytes, so the
// same images always have the same name, whatever tar wrote: uploading is
// idempotent, and two runs racing to upload the same set agree.
//
// `pull` records the digest of every folder it writes in
// tests/__screenshots__/.synced.json. A folder that no longer matches that
// record was changed here, by `check:visual:update`, and is kept rather
// than overwritten until it is pushed, unless --force says otherwise; the
// same thing a checkout does with an edited file.

const projectRoot = path.join(__dirname, "..");
const manifestFile = path.join(projectRoot, "tests/visual-baselines.json");
const shotsDir = path.join(projectRoot, "tests/__screenshots__");
const stateFile = path.join(shotsDir, ".synced.json");

/** @typedef {{ repository: string, release: string, sets: Record<string, string> }} Manifest */

/** @returns {Manifest} */
const readManifest = () => JSON.parse(fs.readFileSync(manifestFile, "utf8"));

/** @param {Manifest} manifest */
const writeManifest = (manifest) => {
	const sets = Object.fromEntries(Object.entries(manifest.sets).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
	fs.writeFileSync(manifestFile, `${JSON.stringify({ ...manifest, sets }, null, "\t")}\n`);
};

/** @returns {Record<string, string>} */
const readState = () => {
	try {
		return JSON.parse(fs.readFileSync(stateFile, "utf8"));
	} catch {
		return {};
	}
};

/** @param {Record<string, string>} state */
const writeState = (state) => {
	fs.mkdirSync(shotsDir, { recursive: true });
	fs.writeFileSync(stateFile, `${JSON.stringify(state, null, "\t")}\n`);
};

/** @param {string} name */
const option = (name) => {
	const index = process.argv.indexOf(`--${name}`);
	if (index === -1) return undefined;
	const value = process.argv[index + 1];
	if (value === undefined || value.startsWith("--")) throw new Error(`--${name} needs a value.`);
	return value;
};

/** @param {string} name */
const flag = (name) => process.argv.includes(`--${name}`);

// The platform suffix Playwright gives a folder ({platform} in
// snapshotPathTemplate), so the default is the set this machine renders.
const platform = option("platform") ?? process.platform;
if (!["linux", "darwin", "win32", "all"].includes(platform)) {
	throw new Error(`--platform must be linux, darwin or all, not ${platform}.`);
}
/** @param {string} set */
const ours = (set) => platform === "all" || set.endsWith(`-${platform}`);

/** @param {string} set @param {string} digest */
const assetName = (set, digest) => `${set}-${digest.slice(0, 16)}.tar`;

/**
 * The images of one folder, by name. Only PNGs count: a stray file, or
 * the `._` copy macOS makes of a file with extended attributes, is not a
 * baseline.
 *
 * @param {string} dir
 */
const images = (dir) =>
	fs
		.readdirSync(dir, { withFileTypes: true })
		.filter((entry) => entry.isFile() && entry.name.endsWith(".png") && !entry.name.startsWith("."))
		.map((entry) => entry.name)
		.sort();

/**
 * A folder's digest: sha256 over each image's name and sha256, in name
 * order. It identifies the images, so two archives of the same folder
 * share it whatever their bytes.
 *
 * @param {string} dir
 */
const digestOf = (dir) => {
	const hash = crypto.createHash("sha256");
	for (const name of images(dir)) {
		const content = crypto.createHash("sha256").update(fs.readFileSync(path.join(dir, name))).digest("hex");
		hash.update(`${name}\0${content}\n`);
	}
	return hash.digest("hex");
};

/** The project folders on disk, by name. */
const localSets = () =>
	fs.existsSync(shotsDir)
		? fs
				.readdirSync(shotsDir, { withFileTypes: true })
				.filter((entry) => entry.isDirectory() && images(path.join(shotsDir, entry.name)).length > 0)
				.map((entry) => entry.name)
				.sort()
		: [];

/**
 * @param {string} command
 * @param {string[]} args
 * @param {{ env?: NodeJS.ProcessEnv, quiet?: boolean }} [options]
 */
const run = (command, args, options = {}) => {
	const result = spawnSync(command, args, {
		cwd: projectRoot,
		encoding: "utf8",
		env: options.env ?? process.env,
		maxBuffer: 64 * 1024 * 1024,
	});
	if (result.error) throw new Error(`${command} could not run: ${result.error.message}`);
	return { ok: result.status === 0, stdout: (result.stdout || "").trim(), stderr: (result.stderr || "").trim() };
};

/** @param {number} ms */
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// Failures worth a second attempt: the network, not the request. A
// minute-long upload of a few dozen archives meets a DNS hiccup sooner or
// later, and it used to end the run on the twentieth archive.
const transient = /no such host|dial tcp|i\/o timeout|timed out|connection reset|unexpected EOF|HTTP 50[234]|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i;
const attempts = 4;

/**
 * The GitHub CLI, which reads GH_TOKEN in CI and the stored login on a
 * maintainer's machine. Retried when the network, not GitHub, failed.
 *
 * @param {string[]} args
 */
const gh = (args) => {
	for (let attempt = 1; ; attempt++) {
		const result = run("gh", args);
		if (result.ok) return result.stdout;
		if (attempt === attempts || !transient.test(result.stderr)) {
			throw new Error(`gh ${args.join(" ")} failed:\n${result.stderr || result.stdout}`);
		}
		sleep(attempt * 5000);
	}
};

/**
 * The release's assets. `state` is `uploaded` once an upload completed;
 * an interrupted one leaves the name taken by an asset that is not.
 *
 * @param {Manifest} manifest
 * @returns {Array<{ id: number, name: string, state: string, created_at: string }>}
 */
const listAssets = (manifest) => {
	const release = JSON.parse(gh(["api", `repos/${manifest.repository}/releases/tags/${manifest.release}`]));
	const pages = gh(["api", "--paginate", `repos/${manifest.repository}/releases/${release.id}/assets?per_page=100`, "--jq", ".[] | {id, name, state, created_at}"]);
	return pages
		.split("\n")
		.filter(Boolean)
		.map((line) => JSON.parse(line));
};

/** @param {string} dir @param {string} archive */
const pack = (dir, archive) => {
	// ustar, and no AppleDouble files: the archive a Mac writes has to
	// unpack on the Linux runner as the same images and nothing else.
	const result = run("tar", ["--format", "ustar", "-cf", archive, "-C", dir, ...images(dir)], {
		env: { ...process.env, COPYFILE_DISABLE: "1" },
	});
	if (!result.ok) throw new Error(`tar could not pack ${dir}:\n${result.stderr}`);
};

/** @param {string} archive @param {string} dir */
const unpack = (archive, dir) => {
	const result = run("tar", ["-xf", archive, "-C", dir]);
	if (!result.ok) throw new Error(`tar could not unpack ${archive}:\n${result.stderr}`);
};

/** @param {string} url @param {string} file */
const download = async (url, file) => {
	for (let attempt = 1; ; attempt++) {
		try {
			const response = await fetch(url, { redirect: "follow" });
			if (response.status === 404) {
				throw Object.assign(
					new Error(`${url} answered 404. The asset may have been pruned, or never uploaded: run \`npm run baselines:push\` where the images exist.`),
					{ final: true },
				);
			}
			if (!response.ok || !response.body) throw new Error(`${url} answered ${response.status}.`);
			await pipeline(Readable.fromWeb(/** @type {import("node:stream/web").ReadableStream} */ (response.body)), fs.createWriteStream(file));
			return;
		} catch (error) {
			if (attempt === attempts || /** @type {{ final?: boolean }} */ (error).final) throw error;
			await new Promise((resolve) => setTimeout(resolve, attempt * 5000));
		}
	}
};

/**
 * Uploads one archive until the release holds it complete. An attempt the
 * network cut short can leave an asset of that name in a state other than
 * `uploaded`, which is deleted before the next one.
 *
 * @param {Manifest} manifest
 * @param {string} name
 * @param {string} archive
 */
const upload = (manifest, name, archive) => {
	for (let attempt = 1; ; attempt++) {
		const result = run("gh", ["release", "upload", manifest.release, archive, "--repo", manifest.repository]);
		// A concurrent run may have uploaded the same images first; the
		// name is their digest, so its copy is as good as ours.
		const asset = listAssets(manifest).find((candidate) => candidate.name === name);
		if (asset?.state === "uploaded") return;
		if (asset) gh(["api", "-X", "DELETE", `repos/${manifest.repository}/releases/assets/${asset.id}`]);
		if (attempt === attempts) throw new Error(`Could not upload ${name}:\n${result.stderr}`);
		sleep(attempt * 5000);
	}
};

// Downloads land beside the folders they replace, so that moving one into
// place is a rename on one file system, never a copy.
const scratch = () => {
	fs.mkdirSync(shotsDir, { recursive: true });
	return fs.mkdtempSync(path.join(shotsDir, ".incoming-"));
};

const pull = async () => {
	const manifest = readManifest();
	const state = readState();
	const force = flag("force");
	const temp = scratch();
	let fetched = 0;
	let current = 0;
	/** @type {string[]} */
	const kept = [];
	try {
		for (const [set, digest] of Object.entries(manifest.sets)) {
			if (!ours(set)) continue;
			const dir = path.join(shotsDir, set);
			const have = fs.existsSync(dir) ? digestOf(dir) : null;
			if (have === digest) {
				state[set] = digest;
				current++;
				continue;
			}
			if (have !== null && state[set] !== have && !force) {
				kept.push(set);
				continue;
			}
			const archive = path.join(temp, assetName(set, digest));
			await download(`https://github.com/${manifest.repository}/releases/download/${manifest.release}/${assetName(set, digest)}`, archive);
			const staging = path.join(temp, set);
			fs.mkdirSync(staging);
			unpack(archive, staging);
			const got = digestOf(staging);
			if (got !== digest) throw new Error(`${assetName(set, digest)} unpacks to ${got}, not the ${digest} the manifest pins.`);
			fs.rmSync(dir, { recursive: true, force: true });
			fs.renameSync(staging, dir);
			fs.rmSync(archive);
			state[set] = digest;
			fetched++;
			console.log(`  ↓ ${set}`);
		}
	} finally {
		fs.rmSync(temp, { recursive: true, force: true });
		writeState(state);
	}
	console.log(`[@cirthcss/cirth] visual baselines (${platform}): ${fetched} downloaded, ${current} already current${kept.length ? `, ${kept.length} kept` : ""}.`);
	if (kept.length > 0) {
		console.log(
			`  These folders changed here since they were last pulled, so they were left as they are:\n` +
				kept.map((set) => `    ${set}`).join("\n") +
				"\n  `npm run baselines:push` publishes them; `npm run baselines:pull -- --force` discards them.",
		);
	}
};

const push = () => {
	const manifest = readManifest();
	const state = readState();
	const sets = localSets().filter(ours);
	if (sets.length === 0) throw new Error(`No ${platform} baselines in tests/__screenshots__ to push.`);
	const existing = new Set(listAssets(manifest).filter((asset) => asset.state === "uploaded").map((asset) => asset.name));
	const temp = scratch();
	let uploaded = 0;
	let changed = 0;
	try {
		for (const set of sets) {
			const digest = digestOf(path.join(shotsDir, set));
			if (manifest.sets[set] !== digest) changed++;
			const name = assetName(set, digest);
			// Uploaded whenever the release lacks it, even when the manifest
			// already names it: a manifest written before its upload, or an
			// archive pruned too early, is repaired the same way.
			if (!existing.has(name)) {
				const archive = path.join(temp, name);
				pack(path.join(shotsDir, set), archive);
				upload(manifest, name, archive);
				fs.rmSync(archive, { force: true });
				uploaded++;
				console.log(`  ↑ ${set}`);
			}
			// Recorded only once the images are published: a folder marked
			// as pulled is one `pull` may overwrite.
			manifest.sets[set] = digest;
			state[set] = digest;
		}
	} finally {
		fs.rmSync(temp, { recursive: true, force: true });
		writeState(state);
		writeManifest(manifest);
	}
	for (const set of Object.keys(manifest.sets).filter(ours)) {
		if (!sets.includes(set)) console.log(`  · ${set} is in the manifest but not on disk; left as it is.`);
	}
	console.log(
		`[@cirthcss/cirth] visual baselines (${platform}): ${changed} changed, ${uploaded} uploaded.` +
			(changed ? " Commit tests/visual-baselines.json with the change they belong to." : ""),
	);
};

const status = () => {
	const manifest = readManifest();
	const state = readState();
	const names = [...new Set([...Object.keys(manifest.sets), ...localSets()])].filter(ours).sort();
	for (const set of names) {
		const dir = path.join(shotsDir, set);
		const have = fs.existsSync(dir) ? digestOf(dir) : null;
		const want = manifest.sets[set];
		const label =
			want === undefined ? "not in the manifest" :
			have === null ? "not pulled" :
			have === want ? "current" :
			state[set] === have ? "stale: pull to update" :
			"changed here: push to publish";
		console.log(`  ${set.padEnd(32)} ${label}`);
	}
};

// What a CI cache is keyed by: the digests of one platform's sets, so a
// change to the other platform's baselines does not discard it.
const key = () => {
	const manifest = readManifest();
	const entries = Object.entries(manifest.sets).filter(([set]) => ours(set));
	console.log(crypto.createHash("sha256").update(JSON.stringify(entries)).digest("hex"));
};

// Deletes the archives no manifest refers to any more, so the release
// stays under its 1000 assets. A manifest counts when it is on a branch,
// a tag or an open pull request's head; an archive younger than
// --min-age-days is kept whatever, for a commit pushed while this runs.
const prune = () => {
	const manifest = readManifest();
	const minAge = Number(option("min-age-days") ?? 7);
	const dryRun = flag("dry-run");
	const repo = manifest.repository;
	/** @param {string} endpoint */
	const names = (endpoint) => gh(["api", "--paginate", endpoint, "--jq", ".[].name"]).split("\n").filter(Boolean);
	const refs = [
		...names(`repos/${repo}/branches?per_page=100`),
		...names(`repos/${repo}/tags?per_page=100`),
		...gh(["api", "--paginate", `repos/${repo}/pulls?state=open&per_page=100`, "--jq", ".[].head.sha"]).split("\n").filter(Boolean),
	];
	const referenced = new Set(Object.entries(manifest.sets).map(([set, digest]) => assetName(set, digest)));
	for (const ref of refs) {
		const result = run("gh", ["api", `repos/${repo}/contents/tests/visual-baselines.json?ref=${encodeURIComponent(ref)}`, "--jq", ".content"]);
		// A ref from before the baselines moved here has no manifest.
		if (!result.ok) continue;
		/** @type {Manifest} */
		const other = JSON.parse(Buffer.from(result.stdout, "base64").toString("utf8"));
		for (const [set, digest] of Object.entries(other.sets)) referenced.add(assetName(set, digest));
	}
	const cutoff = Date.now() - minAge * 24 * 60 * 60 * 1000;
	const assets = listAssets(manifest);
	const doomed = assets.filter((asset) => !referenced.has(asset.name) && Date.parse(asset.created_at) < cutoff);
	for (const asset of doomed) {
		if (!dryRun) gh(["api", "-X", "DELETE", `repos/${repo}/releases/assets/${asset.id}`]);
		console.log(`  ${dryRun ? "would delete" : "deleted"} ${asset.name}`);
	}
	console.log(`[@cirthcss/cirth] visual baselines: ${assets.length} assets, ${referenced.size} referenced from ${refs.length} refs, ${doomed.length} ${dryRun ? "to delete" : "deleted"}.`);
};

// Creates the release the archives hang from. Once: a pre-release, so it
// is never marked latest and the roadmap sweep, which skips pre-releases,
// does not mistake it for a version.
const init = () => {
	const manifest = readManifest();
	const exists = run("gh", ["release", "view", manifest.release, "--repo", manifest.repository]);
	if (exists.ok) {
		console.log(`[@cirthcss/cirth] ${manifest.repository} already has the ${manifest.release} release.`);
		return;
	}
	gh([
		"release",
		"create",
		manifest.release,
		"--repo",
		manifest.repository,
		"--prerelease",
		"--target",
		"master",
		"--title",
		"Visual test baselines (not a release)",
		"--notes",
		"Storage for the visual-regression baselines, not a version of Cirth. Each asset is one Playwright project's screenshots; tests/visual-baselines.json pins which ones every commit compares against, and scripts/visual-baselines.js reads and writes them. Keep it a pre-release: the roadmap sweep runs on every published release that is not one.",
	]);
	console.log(`[@cirthcss/cirth] Created the ${manifest.release} pre-release on ${manifest.repository}.`);
};

/** @type {Record<string, () => void | Promise<void>>} */
const commands = { pull, push, status, key, prune, init };
const command = process.argv[2];
if (!command || !(command in commands)) {
	console.error(`Usage: node scripts/visual-baselines.js <${Object.keys(commands).join("|")}> [options]`);
	process.exit(2);
}
Promise.resolve()
	.then(() => commands[command]())
	.catch((error) => {
		console.error(`[@cirthcss/cirth] visual baselines: ${error.message}`);
		process.exitCode = 1;
	});
