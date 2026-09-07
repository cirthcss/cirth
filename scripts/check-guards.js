const assert = require("node:assert");

const { classifyCommand, classifyPush } = require("./lib/release-guard");

// The local release guards, tested without pushing or publishing anything.
//
// Both guards refuse things, which is the hard kind of code to trust: a
// guard that blocks nothing looks exactly like a guard that works, right
// up until the day it matters. So every case below is asserted in both
// directions — the dangerous forms are blocked, and the ordinary ones a
// contributor runs all day are not.
//
// The allow list is the more important half. A guard that blocks `git
// push origin feature/x` gets switched off within the hour, and then
// nothing is guarded at all.

const zero = "0000000000000000000000000000000000000000";
const sha = "1111111111111111111111111111111111111111";

/** @type {string[]} */
const checks = [];

/**
 * @param {string} label
 * @param {() => void} body
 */
const check = (label, body) => {
	body();
	checks.push(label);
};

/** @param {string} command */
const blocks = (command) => {
	const verdict = classifyCommand(command);
	assert.ok(
		verdict.blocked,
		`expected to be blocked, but it was allowed:\n    ${command}`,
	);
	assert.ok(
		(verdict.reason ?? "").length > 20,
		`blocked \`${command}\` without explaining what to do instead`,
	);
};

/** @param {string} command */
const allows = (command) => {
	const verdict = classifyCommand(command);
	assert.ok(
		!verdict.blocked,
		`expected to be allowed, but it was blocked:\n    ${command}\n` +
			`    ${verdict.reason}`,
	);
};

// --- The command guard: what must be refused --------------------------

check("a direct push to master is blocked, however it is spelled", () => {
	for (const command of [
		"git push origin master",
		"git push origin HEAD:master",
		"git push origin master:master",
		"git push origin +master",
		"git push origin refs/heads/master",
		"git push upstream master",
		"git -C /Users/x/cirth push origin master",
		"git --no-pager push origin master",
		"git push -u origin master",
		"git push origin :master",
		'git push "origin" "master"',
		"npm run build && git push origin master",
		"cd /tmp; git push origin master",
		"env GIT_TRACE=1 git push origin master",
	]) {
		blocks(command);
	}
});

check("pushing a release tag is blocked", () => {
	for (const command of [
		"git push origin v0.15.0-beta.1",
		"git push origin refs/tags/v0.15.0-beta.1",
		"git push origin --tags",
		"git push --follow-tags origin develop",
		"git push origin --mirror",
		"git push origin --all",
	]) {
		blocks(command);
	}
});

check("--no-verify is blocked outright", () => {
	blocks("git push --no-verify origin master");
	blocks("git push --no-verify origin feature/foo");
});

check("turning the hook guard off is blocked", () => {
	blocks("git config core.hooksPath /dev/null");
	blocks("git config --unset core.hooksPath");
});

check("local npm publishing is blocked", () => {
	for (const command of [
		"npm publish",
		"npm publish --tag beta",
		"npm publish --access public --tag latest",
		"npm stage publish",
		"npm stage publish --tag beta",
	]) {
		blocks(command);
	}
});

check("approving a stage is blocked — it is the human checkpoint", () => {
	blocks("npm stage approve abc123");
});

check("moving a dist-tag by hand is blocked", () => {
	blocks("npm dist-tag add @cirthcss/cirth@0.15.0-beta.1 beta");
	blocks("npm dist-tag rm @cirthcss/cirth beta");
});

// --- The command guard: what must keep working ------------------------

check("ordinary development pushes are allowed", () => {
	for (const command of [
		"git push origin feature/foo",
		"git push origin fix/bar",
		"git push origin develop",
		"git push origin release/v0.15.0-beta.1",
		"git push -u origin experiment/native-baseline-aesthetic-rework",
		"git push origin HEAD:feature/foo",
		"git push",
		"git push --force-with-lease origin feature/foo",
		"git fetch origin master",
		"git tag v0.15.0-beta.1",
	]) {
		allows(command);
	}
});

check("read-only npm commands are allowed", () => {
	for (const command of [
		"npm pack",
		"npm pack --dry-run",
		"npm publish --dry-run",
		"npm view @cirthcss/cirth",
		"npm view @cirthcss/cirth dist-tags",
		"npm whoami",
		"npm stage list @cirthcss/cirth",
		"npm stage view abc123",
		"npm stage download abc123",
		"npm stage reject abc123",
		"npm dist-tag ls @cirthcss/cirth",
		"npm run build",
		"npm run release:prepare -- --version 0.15.0-beta.2",
		"npm ci",
	]) {
		allows(command);
	}
});

check("reading the hook configuration is allowed", () => {
	allows("git config --get core.hooksPath");
	allows("git config core.hooksPath .githooks");
});

check("a blocked segment is caught anywhere in a chain", () => {
	blocks("npm run lint && npm run build && npm publish");
	blocks("npm pack | tee out.txt; npm stage approve abc");
	allows("npm run lint && npm run build && npm pack");
});

// --- The pre-push guard ------------------------------------------------

/**
 * @param {[string, string, string, string][]} refs
 * @returns {string}
 */
const stdin = (refs) => refs.map((parts) => parts.join(" ")).join("\n");

check("pre-push blocks master, including a deletion", () => {
	assert.equal(
		classifyPush(
			stdin([["refs/heads/master", sha, "refs/heads/master", zero]]),
		).length,
		1,
	);
	assert.equal(
		classifyPush(stdin([["(delete)", zero, "refs/heads/master", sha]])).length,
		1,
		"deleting master must be refused too",
	);
});

check("pre-push blocks release tags", () => {
	assert.equal(
		classifyPush(
			stdin([
				["refs/tags/v0.15.0-beta.1", sha, "refs/tags/v0.15.0-beta.1", zero],
			]),
		).length,
		1,
	);
});

check("pre-push allows every ordinary branch", () => {
	assert.deepEqual(
		classifyPush(
			stdin([
				["refs/heads/feature/foo", sha, "refs/heads/feature/foo", zero],
				["refs/heads/develop", sha, "refs/heads/develop", zero],
				[
					"refs/heads/release/v0.15.0-beta.1",
					sha,
					"refs/heads/release/v0.15.0-beta.1",
					zero,
				],
				["refs/tags/checkpoint-1", sha, "refs/tags/checkpoint-1", zero],
			]),
		),
		[],
	);
});

check("one bad ref among good ones still refuses the push", () => {
	const verdicts = classifyPush(
		stdin([
			["refs/heads/feature/foo", sha, "refs/heads/feature/foo", zero],
			["refs/heads/master", sha, "refs/heads/master", zero],
		]),
	);
	assert.equal(verdicts.length, 1);
	assert.match(String(verdicts[0].reason), /master/);
});

check("empty input is not an error", () => {
	assert.deepEqual(classifyPush(""), []);
	assert.deepEqual(classifyPush("\n\n"), []);
});

process.stdout.write(
	checks.map((label) => `  ok  ${label}\n`).join("") +
		`\n[@cirthcss/cirth] Release guards verified — ${checks.length} checks ` +
		`passed.\n`,
);
