const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const projectRoot = path.join(__dirname, "..");
const sourceFoldername = path.join(projectRoot, "src");
const buildScript = path.join(__dirname, "build.js");

// Polling avoids file-handle limits seen with recursive fs.watch on this source tree.
const pollInterval = 500;

let buildProcess = null;
let pendingBuild = false;
let debounceTimer = null;
let pollTimer = null;
let lastSnapshot = new Map();

const getScssFiles = (foldername) => {
	const files = [];

	fs.readdirSync(foldername, { withFileTypes: true }).forEach((dirent) => {
		const filename = path.join(foldername, dirent.name);

		if (dirent.isDirectory()) {
			files.push(...getScssFiles(filename));
		} else if (dirent.isFile() && filename.endsWith(".scss")) {
			files.push(filename);
		}
	});

	return files.sort();
};

// mtime plus size is enough here and avoids hashing every SCSS file on each poll.
const getSnapshot = () => {
	const snapshot = new Map();

	getScssFiles(sourceFoldername).forEach((filename) => {
		const stats = fs.statSync(filename);
		const relativeFilename = path.relative(sourceFoldername, filename);

		snapshot.set(relativeFilename, `${stats.mtimeMs}:${stats.size}`);
	});

	return snapshot;
};

const hasChanged = (nextSnapshot) => {
	if (nextSnapshot.size !== lastSnapshot.size) {
		return true;
	}

	for (const [filename, signature] of nextSnapshot) {
		if (lastSnapshot.get(filename) !== signature) {
			return true;
		}
	}

	return false;
};

// Debounce changes and queue only one extra build if edits arrive during an active build.
const scheduleBuild = () => {
	clearTimeout(debounceTimer);

	debounceTimer = setTimeout(() => {
		if (buildProcess) {
			pendingBuild = true;
			return;
		}

		runBuild();
	}, 150);
};

const runBuild = () => {
	buildProcess = spawn(process.execPath, [buildScript], {
		cwd: projectRoot,
		stdio: "inherit",
	});

	buildProcess.on("exit", () => {
		buildProcess = null;

		if (pendingBuild) {
			pendingBuild = false;
			scheduleBuild();
		}
	});
};

const pollScss = () => {
	const nextSnapshot = getSnapshot();

	if (hasChanged(nextSnapshot)) {
		lastSnapshot = nextSnapshot;
		scheduleBuild();
	}
};

const closeWatchers = () => {
	clearInterval(pollTimer);
	clearTimeout(debounceTimer);

	if (buildProcess) {
		buildProcess.kill();
	}
};

if (!fs.existsSync(sourceFoldername)) {
	console.error("The src folder was not found.");
	process.exit(1);
}

console.log("[@cirthcss/cirth] Watching src/");
lastSnapshot = getSnapshot();
pollTimer = setInterval(pollScss, pollInterval);
runBuild();

process.on("SIGINT", () => {
	closeWatchers();
	process.exit(0);
});

process.on("SIGTERM", () => {
	closeWatchers();
	process.exit(0);
});
