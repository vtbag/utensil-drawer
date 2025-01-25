export function ensureDrawer() {
	return (top!.__vtbag.utensilDrawer ??= {
		before: [],
		after: [],
		level:
			'startViewTransition' in document
				? CSS.supports('selector(:active-view-transition)')
					? 2
					: 1
				: 0,
	});
}
export function ensurePatchedStartViewTransition() {
	return (ensureDrawer().replacementStartViewTransition ??= patch(document.startViewTransition));
}

function patch(startViewTransition: typeof Document.prototype.startViewTransition) {
	const drawer = ensureDrawer();
	return (param?: UpdateCallback | StartViewTransitionParameter) => {
		if (typeof param === 'function') {
			param = update(param);
		} else {
			param && (param.update = update(param.update));
		}
		const viewTransition = startViewTransition.call(document, param);
		drawer.before.map((interceptor) => interceptor(viewTransition));
		drawer.before = [];
		return viewTransition;
	};

	function update(updateDOM?: () => Promise<void> | void) {
		return async () => {
			updateDOM && (await updateDOM());
			drawer.after.map((interceptor) => interceptor(drawer.viewTransition!));
			drawer.after = [];
		};
	}
}
