export interface StartViewTransitionExtensions {
	respectReducedMotion?: boolean; // default is true
	collisionBehavior?: 'skipOld' | 'chaining' | 'skipNew'; // default is "skipOld"
	speedUpWhenChained?: number; // default is 1.0
	maxUpdateDuration?: number; // default is 250
}

let nativeSupport = 'none';
if (document.startViewTransition) {
	try {
		document.startViewTransition({ update: () => {}, types: [] }).skipTransition();
		nativeSupport = 'full';
	} catch (e) {
		nativeSupport = 'partial';
	}
	// @ts-expect-error
	if (Element.prototype.startViewTransition) {
		nativeSupport = 'scoped';
	}
}

export function nativeViewTransitionSupport() {
	return nativeSupport;
}

type AddProperty<T, K extends string, V> = T & { [P in K]: V };

let currentViewTransition: ViewTransition | undefined;
export const getCurrentViewTransition = ()=> currentViewTransition;

let updating = false;
const chained: ExtendedViewTransition[] = [];
const updated: ExtendedViewTransition[] = [];

interface ExtendedViewTransition extends ViewTransition {
	extensions: StartViewTransitionExtensions;
	update: UpdateCallback;
	wasSkipped(): boolean;
	updateResolve: (value: void | PromiseLike<void>) => void;
	updateReject: (reason?: any) => void;
	readyResolve: (value: void | PromiseLike<void>) => void;
	readyReject: (reason?: any) => void;
	finishResolve: (value: void | PromiseLike<void>) => void;
	finishReject: (reason?: any) => void;
}

/*
	One version of startViewTransition() for all browsers with or without native support.
	Without native support or with "respectReducedMotion" and reduced motion the function  behaves as if every transition were skipped.

	Collision behavior:
	By default ("skipOld") behaves like the API function where new invocations skip active ones.
	This can be set to "skipNew", where new invocations are skipped if another one is still active.
	With "chaining" the update functions of concurrent calls will be combined to one view transition (all calls that arrive before the new state is captured) or in followup transitions for all new calls arriving later. In this later case, not all buffered
	updates might be executed at once: after `maxUpdateDuration` milliseconds the function will stop executing updates and animate the ones that have been executed so far. The remainders will automatically be covered by consecutive batches.

	You can crank up the speed of running animations by setting "speedUpWhenChained" to > 1.
*/
export function mayStartViewTransition(
	param?: StartViewTransitionParameter | UpdateCallback,
	extensions: StartViewTransitionExtensions = {},
	scope = document
): ViewTransition {
	const {
		collisionBehavior = 'skipOld',
		speedUpWhenChained = 1,
		respectReducedMotion = true,
		maxUpdateDuration = 250,
	} = extensions;

	const update = (param instanceof Function ? param : param?.update) ?? (() => {});
	const types = param instanceof Function ? [] : param?.types;

	if (collisionBehavior === 'skipNew' && currentViewTransition && !updating) {
		return createViewTransitionSurrogate(update, types);
	}

	const transition = chain(update, types ?? [], {
		collisionBehavior,
		speedUpWhenChained,
		respectReducedMotion,
		maxUpdateDuration,
	});
	if (collisionBehavior === 'skipOld') {
		currentViewTransition?.skipTransition();
	}
	if (!currentViewTransition) batch();
	return transition;

	function batch() {
		currentViewTransition = startViewTransition(scope, chained[0].extensions.respectReducedMotion);

		currentViewTransition.ready.then(
			() => updated.forEach((update) => update.readyResolve()),
			() => updated.forEach((update) => update.readyReject())
		);
		currentViewTransition.finished
			.then(
				() => updated.forEach((update) => update.finishResolve()),
				() => updated.forEach((update) => update.finishReject())
			)
			.finally(() => {
				updated.length = 0;
				currentViewTransition = undefined;
			})
			.finally(() => chained.length > 0 && batch());
	}
}

// This function can be called even if the browser does not support view transitions.
// On browsers without native support -- or if motion should be reduced --
// it will run the update callback, won't start animations, but return the promises.
//
// With native support it will call the API function.
// If the native function can not deal with types, they are silently ignored
function startViewTransition(
	scope: Document | HTMLElement,
	respectReducedMotion = true
): ViewTransition {
	let types = new Set<string>();
	chained.forEach((call) => call.types.forEach((t) => types.add(t)));
	const update = unchainUpdates;
	let transition;

	const reducedMotion =
		respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	updating = true;
	if (nativeSupport === 'none' || reducedMotion) {
		transition = createViewTransitionSurrogate(update, types);
	} else {
		if (nativeSupport === 'partial') {
			// @ts-expect-error
			transition = scope.startViewTransition(update);
		} else {
			// @ts-expect-error
			transition = scope.startViewTransition({ update, types });
		}
	}

	types = transition.types ?? types;
	chained.forEach((call) => (call.types = types));
	// ignore update errors in unchainUpdates
	// on the top level, they are only thrown to skip the transition
	transition.updateCallbackDone.then(
		() => {},
		(e: any) => {
			e;
		}
	);
	return transition;
}

export function createViewTransitionSurrogate(
	update: UpdateCallback = () => {},
	types: string[] | Set<string> = []
): ViewTransition {
	const updateCallbackDone = new Promise<void>(async (resolve, reject) => {
		try {
			await Promise.resolve();
			await update();
			resolve();
		} catch (e) {
			reject(e);
		}
	});
	const ready = new Promise<void>((res) => updateCallbackDone.then(res, res));
	const finished = new Promise<void>((res) => ready.then(res, res));
	types.forEach((t) => currentViewTransition?.types.add(t));
	return {
		updateCallbackDone,
		ready,
		finished,
		skipTransition: () => {},
		types: currentViewTransition ? currentViewTransition.types : new Set(types),
	};
}

function chain(
	update: UpdateCallback = () => {},
	types: string[] | Set<string> = [],
	extensions: StartViewTransitionExtensions
): ExtendedViewTransition {
	let updateResolve, updateReject, readyResolve, readyReject, finishResolve, finishReject;

	const updateCallbackDone = new Promise<void>(
		(res, rej) => ((updateResolve = res), (updateReject = rej))
	);
	const ready = new Promise<void>((res, rej) => ((readyResolve = res), (readyReject = rej)));
	const finished = new Promise<void>((res, rej) => ((finishResolve = res), (finishReject = rej)));
	let skipped = false;
	types.forEach((t) => currentViewTransition?.types.add(t));

	const transition = {
		chained: true,
		updateResolve,
		updateReject,
		readyResolve,
		readyReject,
		finishResolve,
		finishReject,
		updateCallbackDone,
		extensions,
		ready,
		finished,
		skipTransition() {
			skipped = true;
		},
		wasSkipped() {
			return skipped;
		},
		update,
		types: currentViewTransition ? currentViewTransition.types : new Set(types),
	} as unknown as ExtendedViewTransition;

	chained.push(transition);

	if (extensions.speedUpWhenChained !== 1) {
		document.getAnimations().forEach((a) => {
			a.effect?.pseudoElement?.startsWith('::view-transition') &&
				(a.playbackRate *= extensions.speedUpWhenChained!);
		});
	}

	return transition;
}

async function unchainUpdates(): Promise<void> {
	let failed = false;
	let executed = 0;
	let longEnough = false;

	const start = Date.now();
	updating = true;
	while (chained.length > 0 && !longEnough) {
		const call = chained.shift()!;
		longEnough = Date.now() - start >= call.extensions.maxUpdateDuration!;
		++executed;
		updated.push(call);
		if (call.types) {
			call.types.forEach((t) => currentViewTransition!.types.add(t));
		}
		try {
			call.update === undefined || (await call.update());
			call.updateResolve();
		} catch (e) {
			failed ||= true;
			call.updateReject(e);
		}

		if (
			call.extensions.respectReducedMotion &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		)
			call.skipTransition();
		if (call.wasSkipped()) {
			currentViewTransition!.skipTransition();
		}
	}
	updating = false;
	if (failed) throw new Error('(chained) update failed');
}
