// The measurement half of the fingerprint and the dead-CSS audit runs
// inside the browser (see `pageAgent` in docs-fingerprint.js, installed
// with addInitScript). It is authored as a string, so TypeScript cannot
// infer it from the source: this file is its contract, and the two are
// meant to be read side by side.

/** One declaration in the audited stylesheet, with the at-rules it sits under. */
interface AuditDeclaration {
	/** `<rule path>|<property>` — stable for as long as the sheet is. */
	id: string;
	/** Index path from the sheet's top level down to the rule. */
	path: number[];
	property: string;
	/** As `getPropertyValue` serialises it, or the authored text where it will not. */
	value: string;
	/** The declaration exactly as the source wrote it, `env()` and all. */
	raw: string;
	priority: string;
	selector: string;
	/** e.g. `CSSMediaRule:(width < 48rem)`, outermost first. */
	conditions: string[];
}

interface Fingerprint {
	/** One hash over every measured element in the document. */
	hash: string;
	elements: number;
	/** Per-element hash, keyed by a positional path, so a diff can be named. */
	digest: Record<string, string>;
	/** Present only when the page never settled between two measurements. */
	unstable?: boolean;
}

interface CirthAudit {
	collect(): Fingerprint;
	collectStable(attempts?: number): Promise<Fingerprint>;
	/** True as soon as any element differs from `snapshot()`'s output. */
	differs(baseline: string[]): boolean;
	hash(text: string): string;
	/** Every authored declaration in the first stylesheet whose href matches. */
	index(needle: string): AuditDeclaration[] | null;
	matches(selector: string): boolean;
	/** Open every <details>, <dialog> and popover on the page. */
	open(): void;
	reachability(selector: string): "matched" | "stateful" | "absent";
	/** True when anything the selector matches computes `position: sticky`. */
	sticky(selector: string): boolean;
	ruleAt(needle: string, path: number[]): CSSStyleRule;
	settle(): Promise<void>;
	/** Per-element descriptions in document order, for `differs()`. */
	snapshot(): string[];
}

// No import or export anywhere in this file, on purpose: that keeps it an
// ambient script rather than a module, so `Window` merges globally and the
// name does not shadow docs-fingerprint.js for module resolution.
interface Window {
	__cirthAudit: CirthAudit;
}
