export const activation = (e?: PageSwapEvent | PageRevealEvent) =>
	e && 'activation' in e ? (e as PageSwapEvent).activation : window.navigation?.activation;

export function direction(e?: PageSwapEvent | PageRevealEvent) {
	const act = activation(e);
	return act?.from.index > act?.entry.index
		? 'backward'
		: act.entry.index === act.from.index
			? 'same'
			: 'forward';
}
