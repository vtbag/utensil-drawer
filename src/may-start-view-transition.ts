export interface StartViewTransitionExtensions {
	respectReducedMotion?: boolean; // default is true
	collisionBehavior?: 'skipOld' | 'chaining' | 'chaining-only' | 'skipNew' | 'never'; // default is "skipOld"
	speedUpWhenChained?: number; // default is 1.0
	useTypesPolyfill?: 'never' | 'auto' | 'always'; // defaults to 'never';
}
const collisionBehaviors = ['skipOld', 'chaining', 'chaining-only', 'skipNew', 'never'];
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
let keepLast: boolean = false;

const close = () => {
	cancelAnimationFrame(open!);
	open = undefined;
};
const chained: ViewTransitionRequest[] = [];
const updates: UpdateCallback[] = [];
let typeAttributes: Set<string>;
interface ViewTransitionRequest {
	update: UpdateCallback;
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
	With "chaining" the update functions of concurrent calls will be combined to one view transition (all calls that arrive before the old state is captured) or in followup transitions for all new calls arriving later.
	You can suppress combining calls that arrive before the old state is captured by setting "collisionBehavior" to "chaining-only".

	You can crank up the speed of running animations by setting "speedUpWhenChained" to > 1.
*/
export function mayStartViewTransition(
	param?: StartViewTransitionParameter | UpdateCallback,
	ext: StartViewTransitionExtensions = {}
): ViewTransition {
	let {
		collisionBehavior = 'skipOld',
		speedUpWhenChained = 1,
		respectReducedMotion = true,
		useTypesPolyfill = 'never',
	} = ext;

	collisionBehaviors.includes(collisionBehavior) ||
		(console.warn(
			`Invalid collisionBehavior "${collisionBehavior}" specified, using "skipOld" instead`
		),
		(collisionBehavior = 'skipOld'));

	const extensions = {
		collisionBehavior,
		speedUpWhenChained,
		respectReducedMotion,
		useTypesPolyfill,
	};

	const update = (param instanceof Function ? param : param?.update) ?? (() => {});
	const types = new Set(param instanceof Function ? [] : (param?.types ?? []));
	const reduceMotion =
		respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	let surrogate = false;
	if (
		(collisionBehavior === 'skipNew' && currentViewTransition) ||
		collisionBehavior === 'never' ||
		nativeSupport === 'none' ||
		reduceMotion
	) {
		surrogate = true;
	}

	if (!currentViewTransition || collisionBehavior === 'skipOld') {
		keepLast = !!currentViewTransition && !!open;
		open = requestAnimationFrame(close);
		typeAttributes = new Set<string>();
		currentViewTransition = surrogate
			? createViewTransitionSurrogate(unchainUpdates)
			: document.startViewTransition!(unchainUpdates);
		currentViewTransition.finished.finally(() => {
			typeAttributes.forEach((t) => document.documentElement.classList.remove(t));
			currentViewTransition = undefined;
			chained.splice(0, chained.length).forEach(({ update, extensions, proxy }) => {
				mayStartViewTransition({ update, types: proxy.types }, extensions);
				proxy.switch();
			});
		});
	}
	if (open && (collisionBehavior !== 'chaining-only' || updates.length === 0)) {
		const cl = document.documentElement.classList;
		const curr: any =
			useTypesPolyfill === 'never'
				? currentViewTransition.types
				: useTypesPolyfill === 'always'
					? cl
					: (currentViewTransition.types ?? cl);
		types.forEach((t) => {
			curr?.add(t);
			console.log(`Adding type "${t}" to view transition`, curr === cl);
			curr === cl && typeAttributes.add(t);
		});
		updates.push(update);
		return currentViewTransition;
	}
	const proxy = createViewTransitionProxy(types);
	chained.push({ update, extensions, proxy });
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
	let delegate: Promise<void> | undefined;
	const save = (kind: string, resolve: any, reject: any, callback?: any) => {
		if (delegate) {
			return kind === 'then' ? delegate.then(resolve, reject) : delegate.finally(callback);
		}
		const promise = createPromiseSubstitute();
		saved.push({ kind, resolve, reject, callback, promise });
		return promise;
	};
	return {
		then(resolve: any, reject: any): Promise<void> {
			return save('then', resolve, reject);
		},
		catch(reject: any): Promise<void> {
			return save('then', undefined, reject);
		},
		finally(callback: () => void): Promise<void> {
			return save('finally', undefined, undefined, callback);
		},
		switch(to: Promise<void>) {
			if (delegate) throw new Error('Already switched to another promise');
			saved.forEach((e) =>
				e.promise.switch(e.kind === 'then' ? to.then(e.resolve, e.reject) : to.finally(e.callback))
			);
			delegate = to;
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
				this.types = currentViewTransition.types ?? this.types;
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

export function createViewTransitionSurrogate(update: () => Promise<void>): ViewTransition {
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
			await update();
			res();
		} catch (e) {
			updateFailure = e;
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
		types: new Set<string>(),
	} as ViewTransition;
}

async function unchainUpdates() {
	const current = updates.splice(0, updates.length - (keepLast ? 1 : 0));
	keepLast = false;
	const rejected = (await Promise.allSettled(current.map((u) => u!()))).find(
		(r) => r.status === 'rejected'
	) as PromiseRejectedResult;
	if (rejected) throw new Error(rejected.reason);
}
