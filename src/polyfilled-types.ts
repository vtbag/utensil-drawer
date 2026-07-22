export function root(scope: Document | HTMLElement): HTMLElement {
	return 'documentElement' in scope ? scope.documentElement : scope;
}

export function polyfilledTypes(
	scope: Document | Element,
	viewTransition: ViewTransition
): ViewTransition {
	const classList = ('documentElement' in scope ? scope.documentElement : scope).classList;
	let types = undefined;

	const typeAttr = 'vtbag-vtt-0'; // for :active-view-transition, postcss-active-view-transition-type
	classList.add(typeAttr);

	return new Proxy(viewTransition, {
		get(target, prop: keyof ViewTransition) {
			if (prop === 'types') {
				return (types ??= new Proxy(target.types ?? new Set<string>(), {
					get(typesTarget, typesProp: string | symbol) {
						if (typesProp === 'add') {
							return (value: string) => {
								typesTarget.add(value);
								classList.add('vtbag-vtt-' + value);
							};
						} else if (typesProp === 'delete') {
							return (value: string) => {
								typesTarget.delete(value);
								classList.remove('vtbag-vtt-' + value);
							};
						} else if (typesProp === 'clear') {
							return () => {
								typesTarget.forEach((value: string) => classList.remove('vtbag-vtt-' + value));
								typesTarget.clear();
							};
						} else if (typesProp === 'has') {
							return (value: string) => typesTarget.has(value);
						} else if (typesProp === Symbol.iterator) {
							return () => typesTarget[Symbol.iterator]();
						}
						return typesTarget[typesProp as keyof Set<string>];
					},
				}));
			}
			return target[prop];
		},
	});
}
