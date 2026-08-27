const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.join(__dirname, "../..");
const presetsSourceDir = path.join(projectRoot, "src/presets");
const publicPresetPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*\.scss$/;

// src/presets/ is the source of truth for every maintained preset. Keeping
// discovery here means the build invariants, browser checks, docs switcher,
// axe matrix, and visual coverage cannot quietly disagree about the lineup.
const listPresetNames = () =>
	fs
		.readdirSync(presetsSourceDir, { withFileTypes: true })
		.filter((entry) => entry.isFile() && publicPresetPattern.test(entry.name))
		.map((entry) => path.basename(entry.name, ".scss"))
		.sort();

/** @param {string} name */
const presetLabel = (name) =>
	name
		.split("-")
		.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
		.join(" ");

module.exports = { listPresetNames, presetLabel, presetsSourceDir };
