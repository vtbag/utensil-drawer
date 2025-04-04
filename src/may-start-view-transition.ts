import { unPauseAllAnimations } from "./pause";

let currentViewTransition: ViewTransition | undefined;
const blocked: ExtendedViewTransition[] = [];
interface ExtendedViewTransition extends ViewTransition {
	update: UpdateCallback;
	skipped: boolean;
	updateResolve: (value: void | PromiseLike<void>) => void;
	updateReject: (value: void | PromiseLike<void>) => void;
	readyResolve: (value: void | PromiseLike<void>) => void;
	readyReject: (value: void | PromiseLike<void>) => void;
	finishResolve: (value: void | PromiseLike<void>) => void;
	finishReject: (value: void | PromiseLike<void>) => void;
}


/*
	One version of startViewTransition() for all browsers.
	Without native view transition support just calls the update function and returns a view transition object with promises.
	Calling this while a transition is active won't cancel the ongoing transition
	but stack no transitions into a single one to follow the current one.
	Cranks up speed if frequently interrupted.
*/
export function mayStartViewTransition(
	param?: StartViewTransitionParameter | UpdateCallback, stack = false, scope = document
): ViewTransition {

	if (stack && currentViewTransition) {
		const transition = block(param instanceof Function ? param : param?.update, param instanceof Function ? [] : param?.types ?? []);
		blocked.push(transition);
		document.getAnimations().forEach(a => {
			a.effect?.pseudoElement?.startsWith("::view-transition") && (a.playbackRate *= 2);
		});
		return transition;
	}
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (param === undefined || param instanceof Function) {
		if (scope.startViewTransition && !reducedMotion) return resilient(scope.startViewTransition(param));
		return fallback(param, []);
	}
	if (scope.startViewTransition && !reducedMotion)
		try {
			return resilient(scope.startViewTransition(param));
		} catch (e) {
			return resilient(scope.startViewTransition(param.update));
		}
	return fallback(param && typeof param === 'object' ? param.update : param, param.types ?? []);
}

function fallback(
	update: UpdateCallback = () => { },
	types: string[] | Set<string>
): ViewTransition {
	const updateCallbackDone = Promise.resolve(update());
	const ready = Promise.resolve(updateCallbackDone);
	const finished = Promise.resolve(ready);

	return resilient({
		updateCallbackDone,
		ready,
		finished,
		skipTransition: () => { },
		types: new Set(types),
	} as ViewTransition);
}
function block(
	update: UpdateCallback = () => { },
	types: string[] | Set<string>
): ExtendedViewTransition {
	let updateResolve, updateReject, readyResolve, readyReject, finishResolve, finishReject;
	const updateCallbackDone = new Promise<void>((res, rej) => (updateResolve = res, updateReject = rej));
	const ready = new Promise<void>((res, rej) => (readyResolve = res, readyReject = rej));
	const finished = new Promise<void>((res, rej) => (finishResolve = res, finishReject = rej));

	return {
		skipped: false,
		updateResolve,
		updateReject,
		readyResolve,
		readyReject,
		finishResolve,
		finishReject,
		update,
		updateCallbackDone,
		ready,
		finished,
		skipTransition() { (this as ExtendedViewTransition).skipped = true; },
		types,
	} as unknown as ExtendedViewTransition;
}

function resilient(transition: ViewTransition): ViewTransition {
	transition.finished.then(() => {
		currentViewTransition = undefined;
		if (blocked.length === 0) return;
		const copied = [...blocked];
		blocked.length = 0;
		const transition = mayStartViewTransition({
			update: async () => {
				copied.forEach(async update => update.update && await update.update());
			}, types: copied[copied.length - 1].types
		});
		copied.find(update => update.skipped) && transition.skipTransition();
		transition.updateCallbackDone.then(() => copied.forEach(update => update.updateResolve()));
		transition.updateCallbackDone.catch(() => copied.forEach(update => update.updateReject()));
		transition.ready.then(() => copied[copied.length - 1].readyResolve()); // only the last one
		transition.ready.catch(() => copied.forEach(update => update.readyReject()));
		transition.finished.then(() => copied.forEach(update => update.finishResolve()));
		transition.finished.catch(() => copied.forEach(update => update.finishReject()));
	});
	return currentViewTransition = transition;
}