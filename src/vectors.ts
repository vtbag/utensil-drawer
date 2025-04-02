
export function setVectors() {
	const styles:string[]=[];
	document.body.getBoundingClientRect();
	document.getAnimations().forEach((animation: any) => {
		if (!animation.animationName.startsWith("-ua-view-transition-group")) return;
		const effect = animation.effect;
		const pseudo = effect?.pseudoElement;
		const group = pseudo.slice(24, -1);
		const frames = effect.getKeyframes();
		let from = '' + frames[0]?.transform || 'none';
		let to = '' + frames[frames.length - 1]?.transform || 'none';
		if (to === 'none') {
			const end = effect.getComputedTiming().endTime;
			animation.currentTime = end || 0;
			to = getComputedStyle(effect?.target || document.documentElement, pseudo).transform || 'none';
			animation.currentTime = 0;
		}
		if (from === 'none' || to === 'none') return;

		const fromValues = new DOMMatrixReadOnly(from);
		const toValues = new DOMMatrixReadOnly(to);
		styles.push(
			'vtbag-vectors',
			`
        :root {
          --vtbag-vector-${group}-from-x: ${fromValues.e}px;
          --vtbag-vector-${group}-to-x: ${toValues.e}px;
          --vtbag-vector-${group}-from-y: ${fromValues.f}px;
          --vtbag-vector-${group}-to-y: ${toValues.f}px;
        }
        ::view-transition-group(${group}) {
          --vtbag-vector-from-x: ${fromValues.e}px;
          --vtbag-vector-to-x: ${toValues.e}px;
          --vtbag-vector-from-y: ${fromValues.f}px;
          --vtbag-vector-to-y: ${toValues.f}px;
        }`
		);

	});
  document.head.insertAdjacentHTML('beforeend', `<style id="vtbag-dynamic-styles-vtbag-vectors">${styles.join('\n')}</style>`);
}
