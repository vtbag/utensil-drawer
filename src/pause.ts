export function pauseAllAnimations(scope: HTMLElement | Document) {
	(scope !== document ? scope.getAnimations({ subtree: true }) : scope.getAnimations()).forEach(
		(animation) => {
			const effect = animation.effect;
			const pseudo = effect?.pseudoElement;
			if (effect instanceof KeyframeEffect && pseudo?.startsWith('::view-transition-group')) {
				animation.pause();
			}
		}
	);
}

export function unPauseAllAnimations(scope: HTMLElement | Document) {
	(scope !== document ? scope.getAnimations({ subtree: true }) : scope.getAnimations()).forEach(
		(animation) => {
			const effect = animation.effect;
			const pseudo = effect?.pseudoElement;
			if (effect instanceof KeyframeEffect && pseudo?.startsWith('::view-transition-group')) {
				animation.play();
			}
		}
	);
}
