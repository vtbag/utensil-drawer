export interface StartViewTransitionExtensions {
	respectReducedMotion?: boolean; // default is true
	collisionBehavior?: 'skipOld' | 'chaining' | 'skipNew' | 'never'; // default is "skipOld"
	speedUpWhenChained?: number; // default is 1.0
}
const collisionBehaviors = ['skipOld', 'chaining', 'skipNew', 'never'];

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

let currentViewTransition: ViewTransition | undefined;
export const getCurrentViewTransition = () => currentViewTransition;

let open: number | undefined = undefined;
let clash: boolean = false;

const close = () => {
	open = undefined;
};
const chained: ViewTransitionRequest[] = [];
const updates: UpdateCallback[] = [];

interface ViewTransitionRequest {
	update: UpdateCallback;
	types: Set<string>;
	extensions: StartViewTransitionExtensions;
	proxy: SwitchableViewTransition;
}

/*
	One version of startViewTransition() for all browsers with or without native support.
	Without native support or with "respectReducedMotion" and reduced motion the function  behaves as if every transition were skipped.

	Collision behavior:
	By default ("skipOld") behaves like the API function where new invocations skip active ones.
	This can be set to "skipNew", where new invocations are skipped if another one is still active.
	'never' will behave as if view transitions are not supported at all.
	With "chaining" the update functions of concurrent calls will be combined to one view transition (all calls that arrive before the new state is captured) or in followup transitions for all new calls arriving later.
	In this later case, not all buffered updates might be executed at once: after `maxUpdateDuration` milliseconds the function will stop executing updates and animate the ones that have been executed so far. The remainders will automatically be covered by consecutive batches.

	You can crank up the speed of running animations by setting "speedUpWhenChained" to > 1.
*/
export function mayStartViewTransition(
	param?: StartViewTransitionParameter | UpdateCallback,
	ext: StartViewTransitionExtensions = {}
): ViewTransition {
	let { collisionBehavior = 'skipOld', speedUpWhenChained = 1, respectReducedMotion = true } = ext;

	collisionBehaviors.includes(collisionBehavior) ||
		(console.warn(
			`Invalid collisionBehavior "${collisionBehavior}" specified, using "skipOld" instead`
		),
		(collisionBehavior = 'skipOld'));

	const extensions = { collisionBehavior, speedUpWhenChained, respectReducedMotion };

	const update = (param instanceof Function ? param : param?.update) ?? (() => {});
	const types = new Set(param instanceof Function ? [] : (param?.types ?? []));
	const reduceMotion =
		respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (
		(collisionBehavior === 'skipNew' && currentViewTransition) ||
		collisionBehavior === 'never' ||
		nativeSupport === 'none' ||
		reduceMotion
	) {
		open = requestAnimationFrame(close);
		updates.push(update);
		clash = !!currentViewTransition;
		currentViewTransition = createViewTransitionSurrogate(types);
		currentViewTransition.finished.finally(() => {
			currentViewTransition = undefined;
		});
		return currentViewTransition;
	}

	if (!currentViewTransition || collisionBehavior === 'skipOld') {
		open = requestAnimationFrame(close);
		clash = !!currentViewTransition;
		currentViewTransition = document.startViewTransition!(unchainUpdates);
		currentViewTransition.finished.finally(() => {
			currentViewTransition = undefined;
			const remainders = chained.splice(0, chained.length);
			remainders.length > 0 &&
				remainders.forEach(({ update, types, extensions, proxy }) => {
					mayStartViewTransition({ update, types }, extensions);
					proxy.switch();
				});
		});
	}
	if (open) {
		types.forEach((t) => currentViewTransition!.types.add(t));
		updates.push(update);
		return currentViewTransition;
	}
	const proxy = createViewTransitionProxy(types);
	chained.push({ update, types, extensions, proxy });
	if (extensions.speedUpWhenChained !== 1) {
		document.getAnimations().forEach((a) => {
			a.effect?.pseudoElement?.startsWith('::view-transition') &&
				(a.playbackRate *= extensions.speedUpWhenChained!);
		});
	}
	return proxy;
}

interface SwitchableViewTransition extends ViewTransition {
	switch(): void;
}
interface SwitchablePromise extends Promise<void> {
	switch(to: Promise<void>): void;
}
function createPromiseSubstitute(): SwitchablePromise {
	const saved: any[] = [];
	return {
		then(resolve: any, reject: any): Promise<void> {
			saved.push({ kind: 'then', resolve, reject });
			return createPromiseSubstitute();
		},
		catch(reject: any): Promise<void> {
			saved.push({ kind: 'then', resolve: undefined, reject });
			return createPromiseSubstitute();
		},
		finally(callback: () => void): Promise<void> {
			saved.push({ kind: 'finally', callback });
			return createPromiseSubstitute();
		},
		switch(to: Promise<void>) {
			saved.forEach((e) =>
				e.kind === 'then' ? to.then(e.resolve, e.reject) : to.finally(e.callback)
			);
		},
	} as SwitchablePromise;
}

function createViewTransitionProxy(types: Set<string>): SwitchableViewTransition {
	let delegate: ViewTransition | undefined = undefined;
	let skipped = false;
	return new Proxy(
		{
			updateCallbackDone: createPromiseSubstitute(),
			ready: createPromiseSubstitute(),
			finished: createPromiseSubstitute(),
			skipTransition: () => (delegate ? delegate.skipTransition() : (skipped = true)),
			types: new Set(types),
			switch() {
				if (!currentViewTransition) throw new Error('No view transition active');
				if (delegate) throw new Error('Already switched to another view transition');
				if (skipped) {
					currentViewTransition?.skipTransition();
				}
				this.types.forEach((t) => currentViewTransition?.types?.add(t));
				this.updateCallbackDone.switch(currentViewTransition.updateCallbackDone);
				this.ready.switch(currentViewTransition.ready);
				this.finished.switch(currentViewTransition.finished);
				delegate = currentViewTransition;
			},
		},
		{
			get(target, prop: keyof ViewTransition): any {
				return delegate ? delegate[prop] : target[prop];
			},
		}
	);
}

export function createViewTransitionSurrogate(types: Set<string>): ViewTransition {
	let res: () => void;
	let rej: (reason?: any) => void;
	let readyReject: (reason?: any) => void;

	const updateCallbackDone = new Promise<void>((resolve, reject) => {
		res = resolve;
		rej = reject;
	});
	let updateFailure: any = undefined;
	requestAnimationFrame(async () => {
		try {
			await unchainUpdates();
			res();
		} catch (e) {
			rej(e);
		}
	});
	const ready = new Promise<void>((res, rej) => {
		readyReject = rej;
		updateCallbackDone.then(
			() => res(), //rej('Browser does not support View Transition API'),
			(_) => res() //rej(err)
		);
	});
	const done = (res: () => void, rej: (reason?: any) => void) =>
		updateFailure ? rej(updateFailure) : res();
	const finished = new Promise<void>((res, rej) =>
		updateCallbackDone.finally(() =>
			ready.then(
				() => done(res, rej),
				(e) => done(res, rej)
			)
		)
	);
	return {
		updateCallbackDone,
		ready,
		finished,
		skipTransition: () => {},
		types,
	} as ViewTransition;
}

async function unchainUpdates() {
	const current = updates.splice(0, updates.length - (clash ? 1 : 0));
	clash = false;
	const rejected = (await Promise.allSettled(current.map((u) => u!()))).find(
		(r) => r.status === 'rejected'
	);
	if (rejected) throw new Error(rejected.reason);
}
