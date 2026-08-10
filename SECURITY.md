# Security Policy

This repository follows the organisation-level security policy in
[cirthcss/.github/SECURITY.md](https://github.com/cirthcss/.github/blob/master/SECURITY.md).
This file adds the Cirth-specific scope and reporting context.

## Reporting a potential vulnerability

Please do not open a public issue with exploit details, secrets, credentials,
private data, or a working payload.

Use the repository's **Security** tab and private vulnerability reporting
channel when available. If private reporting is not available, contact the
organisation owner through [the maintainer's GitHub profile](https://github.com/ricpastori)
to arrange a private channel before sharing technical details.

A useful report should identify:

- the affected Cirth version, commit, or package release;
- the impact and a realistic scenario;
- safe reproduction steps or a minimal proof of concept;
- any suggested mitigation;
- whether the concern has been disclosed elsewhere.

Please redact credentials, tokens, personal data, and private URLs.

## Cirth-specific scope

This policy covers security concerns caused or materially worsened by:

- source under `src/` and the SCSS-to-CSS build pipeline;
- the public `@cirthcss/cirth` npm package and its published `dist/` artifacts;
- package exports, release configuration, and repository build scripts;
- documentation or release-process changes that could alter the published package.

The current package publishes compiled CSS from `dist/`; SCSS remains repository
source and build infrastructure. Reports should identify the relevant version
or commit where possible.

## Out of scope

Please report issues belonging to GitHub, npm, browsers, CDNs, or unrelated
upstream dependencies to the responsible project. This policy does not
authorise testing against third-party applications, websites, networks, or user
data. Do not perform denial-of-service, social engineering, destructive testing,
or activity that could affect availability or other users.

## Maintainer handling

Maintainers will acknowledge actionable reports, investigate impact, coordinate
fixes and disclosure, and credit reporters who wish to be credited. Response
times are best effort; this document does not promise a severity label,
disclosure deadline, fix, or release.

Please allow maintainers to coordinate a fix and disclosure before publishing
sensitive technical details.

## Disclaimer

This policy is a reporting guide, not a security audit or a statement that
Cirth is free of vulnerabilities.