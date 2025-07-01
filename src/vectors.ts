import { getCurrentViewTransition } from './may-start-view-transition';

export type Inst = {
	pattern: string;
	props: string[];
};

type Params = {
	width: string;
	height: string;
	matrix: DOMMatrixReadOnly;
};
let lastViewTransitionObject: ViewTransition | undefined = undefined;
/*
	Specs is a comma separated list of instructions that tell the function what pseudo properties to set.
	An instruction consists of a regular expression followed by a space separated list of property names.
	Semantics are: if the regexp matches the name of a view transition group, then add pseudo-properties for the named properties.
	pseudo properties are added.
	Note that no spaces are allowed inside the regular expression.
	Omitting specs as well as passing null or an empty string will add all properties for all groups
*/
export function setVectors(
	instructions: Inst[] = [{ pattern: '.*', props: ['x', 'y', 'width', 'height'] }],
	where: 'pseudo' | 'root' | 'both' = 'both'
): void {
	const styles: string[] = [];
	if (
		lastViewTransitionObject !== undefined &&
		lastViewTransitionObject === getCurrentViewTransition()
	)
		return; // prevent Safari from getting confused
	lastViewTransitionObject = getCurrentViewTransition();
	document.body.getBoundingClientRect(); // force reflow for Safari
	document.getAnimations().forEach((animation: any) => {
		if (!animation.animationName?.startsWith('-ua-view-transition-group')) return;
		const effect = animation.effect;
		const pseudo = effect?.pseudoElement;
		const group = pseudo.slice(24, -1);
		const emit = instructions.find((inst) => group.match(inst.pattern)?.[0] === group)?.props;
		if (!emit) return;

		const frames = effect.getKeyframes();

		const from: Params = {
			width: frames[0]?.width || 0,
			height: frames[0]?.height || 0,
			matrix: new DOMMatrixReadOnly(frames[0]?.transform || 'none'),
		};

		const end = frames[frames.length - 1];
		let to: Params;
		if (end.width === 'auto') {
			// Chrome bug
			const now = animation.currentTime;
			animation.currentTime = effect.getComputedTiming().endTime || 0;
			const last = getComputedStyle(effect?.target || document.documentElement, pseudo);
			to = {
				width: last.width,
				height: last.height,
				matrix: new DOMMatrixReadOnly(last.transform || 'none'),
			};
			animation.currentTime = now;
		} else {
			to = {
				width: end.width || 0,
				height: end.height || 0,
				matrix: new DOMMatrixReadOnly(end.transform || 'none'),
			};
		}

		if (where === 'root' || where === 'both') {
			styles.push(':root {');
			emit.includes('x') &&
				styles.push(`	--vtbag-vector-${group}-from-x: ${from.matrix.e}px;
	--vtbag-vector-${group}-to-x: ${to.matrix.e}px;`);
			emit.includes('y') &&
				styles.push(`	--vtbag-vector-${group}-from-y: ${from.matrix.f}px;
	--vtbag-vector-${group}-to-y: ${to.matrix.f}px;`);
			emit.includes('width') &&
				styles.push(`	--vtbag-vector-${group}-from-width: ${from.width};
	--vtbag-vector-${group}-to-width: ${to.width};`);
			emit.includes('height') &&
				styles.push(`	--vtbag-vector-${group}-from-width: ${from.height};
	--vtbag-vector-${group}-to-width: ${to.height};`);
			styles.push('}');
		}
		if (where === 'pseudo' || where === 'both') {
			styles.push(`::view-transition-group(${group}) {`);
			emit.includes('x') &&
				styles.push(`	--vtbag-vector-from-x: ${from.matrix.e}px;
	--vtbag-vector-to-x: ${to.matrix.e}px;`);
			emit.includes('y') &&
				styles.push(`	--vtbag-vector-from-y: ${from.matrix.f}px;
	--vtbag-vector-to-y: ${to.matrix.f}px;`);
			emit.includes('width') &&
				styles.push(`	--vtbag-vector-from-width: ${from.width};
	--vtbag-vector-to-width: ${to.width};`);
			emit.includes('height') &&
				styles.push(`	--vtbag-vector-from-height: ${from.height};
	--vtbag-vector-to-height: ${to.height};`);
			styles.push('}');
		}
	});
	document.querySelectorAll('#vtbag-dynamic-styles-vtbag-vectors')?.forEach((e) => e.remove());
	document.head.insertAdjacentHTML(
		'beforeend',
		`<style id="vtbag-dynamic-styles-vtbag-vectors">${styles.join('\n')}</style>`
	);
}
