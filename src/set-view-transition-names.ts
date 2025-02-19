/* Sets the view transition name in the style attribute of selected elements, see setGivenViewTransitionNames.
`selector´is an arbitrary CSS selector for the current document
*/
export function setSelectedViewTransitionNames(selector: string, prefix: any, force = false) {
	let selected;
	try {
		selected = document.querySelectorAll<HTMLElement>(selector);
	} catch (e) {
		console.error(
			(e as Error).message.replace(
				/.*:/,
				'[vtbag] Error selecting elements for view transition names:'
			)
		);
		return;
	}
	setGivenViewTransitionNames([...selected], prefix, force);
}

/* Sets the view transition name in the style attribute of the given elements.
If `elements` has exactly one entry, `prefix` is used as a name.
Otherwise the `elements` are named with the `prefix` with an appended index starting from 0.
If `force` is true, the names are always set, otherwise only if they are not already set.
If the prefix string ends with a '~', the character is replaced by a '-' and the names are assigned in random order.
*/
export function setGivenViewTransitionNames(
	elements: HTMLElement[],
	prefix: string,
	force = false
) {
	if (prefix[prefix.length - 1] === '~') {
		prefix = prefix.slice(0, -1) + '-';
		shuffle(elements);
	}
	prefix = CSS.escape(prefix);
	elements.forEach((element, idx, array) => {
		const name = `${prefix}${array.length > 1 && prefix !== '' && prefix !== 'none' && prefix !== 'auto' ? idx : ''}`;
		(force && (element.style.viewTransitionName = name)) ||
			(element.style.viewTransitionName ||= name);
	});
}

export function setOldPageViewTransitionNames(selector: string, prefix: any) {
	addEventListener('pageswap', () => setSelectedViewTransitionNames(selector, prefix));
}

// The pagereveal event fires very early. Thus scripts using this code should load inside the <head>
export function setNewPageViewTransitionNames(selector: string, prefix: any) {
	addEventListener('pagereveal', () => setSelectedViewTransitionNames(selector, prefix));
}

function shuffle<T>(array: T[]): T[] {
	for (let i = array.length - 1; i > 0; --i) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}
