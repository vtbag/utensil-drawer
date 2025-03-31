import { addStyle, initStyles } from './dynamic-style';

export function setVectors() {
	initStyles('vtbag-vectors');
	document.getAnimations().forEach((animation) => {
		const effect = animation.effect;
		const pseudo = effect?.pseudoElement;
		if (effect instanceof KeyframeEffect && pseudo?.startsWith('::view-transition-group')) {
			const group = pseudo.slice(24, -1);
			const frames = effect.getKeyframes();
			let from = '' + frames[0]?.transform || 'none';
			let to = '' + frames[frames.length - 1]?.transform || 'none';
			if (to === 'none') {
				const end = effect.getComputedTiming().endTime;
				animation.currentTime = end || 0;
				to =
					getComputedStyle(effect?.target || document.documentElement, pseudo).transform || 'none';
				animation.currentTime = 0;
			}
			if (from === 'none') {
				from =
					getComputedStyle(effect?.target || document.documentElement, pseudo).transform || 'none';
			}
			if (from === 'none' || to === 'none') return;

			const fromValues = new DOMMatrixReadOnly(from);
			const toValues = new DOMMatrixReadOnly(to);

			addStyle(
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
		}
	});
}
