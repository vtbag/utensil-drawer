import { getTypeAttributes, polyfilledTypes } from './polyfilled-types.js';
import {
	createViewTransitionProxy,
	SwitchableViewTransition,
} from './switchable-view-transition.js';
import { createViewTransitionSurrogate } from './view-transition-surrogate.js';

export interface StartViewTransitionExtensions {
	scope?: Document | Element; // default is document
	respectReducedMotion?: boolean; // default is true
	collisionBehavior?: 'skipOld' | 'chaining' | 'chaining-only' | 'skipNew' | 'never'; // default is "skipOld"
	speedUpWhenChained?: number; // default is 1.0
	useTypesPolyfill?: 'never' | 'auto' | 'always'; // defaults to 'never';
	catchErrors?: boolean; // default is true
}
const collisionBehaviors = ['skipOld', 'chaining', 'chaining-only', 'skipNew', 'never'];

interface ViewTransitionRequest {
	update: ViewTransitionUpdateCallback;
	extensions: StartViewTransitionExtensions;
	proxy: SwitchableViewTransition;
}

type ScopeData = {
	currentViewTransition: ViewTransition | undefined;
	open: number | undefined;
	keepLast: boolean;
	chained: ViewTransitionRequest[];
	updates: ViewTransitionUpdateCallback[];
};

const scopes = new WeakMap<Document | Element, ScopeData>();

export function getCurrentViewTransition(scope: Document | Element = document) {
	return getScopeData(scope).currentViewTransition;
}

function getScopeData(scope: Document | Element = document) {
	let data = scopes.get(scope);
	if (!data) {
		data = {
			currentViewTransition: undefined,
			open: undefined,
			keepLast: false,
			chained: [],
			updates: [],
		};
		scopes.set(scope, data);
	}
	return data;
}

const close = (scopeData: ScopeData) => {
	cancelAnimationFrame(scopeData.open!);
	scopeData.open = undefined;
};

let nativeSupport = 'none';
if (document.startViewTransition) {
	try {
		document.startViewTransition({ update: () => { }, types: [] }).skipTransition();
		nativeSupport = 'full';
	} catch (e) {
		nativeSupport = 'partial';
	}
	if (Element.prototype.startViewTransition) {
		nativeSupport = 'scoped';
	}
}

export function nativeViewTransitionSupport() {
	return nativeSupport;
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
	param?: StartViewTransitionOptions | ViewTransitionUpdateCallback,
	ext: StartViewTransitionExtensions = {}
): ViewTransition {
	let {
		scope = document,
		collisionBehavior = 'skipOld',
		speedUpWhenChained = 1,
		respectReducedMotion = true,
		useTypesPolyfill = 'never',
		catchErrors = true,
	} = ext;

	if (scope !== document && nativeSupport !== 'scoped') {
		console.warn(
			`Using a scope other than document is only supported in browsers with scoped view transitions`
		);
		scope = document;
		collisionBehavior = 'never';
	}
	const scopeData = getScopeData(scope);

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

	const update = (param instanceof Function ? param : param?.update) ?? (() => { });
	const types = new Set(
		param instanceof Function ? [] : ((param as StartViewTransitionOptions)?.types ?? [])
	);
	const reduceMotion =
		respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	let surrogate = false;
	if (
		(collisionBehavior === 'skipNew' && scopeData.currentViewTransition) ||
		collisionBehavior === 'never' ||
		nativeSupport === 'none' ||
		reduceMotion
	) {
		surrogate = true;
	}

	if (!scopeData.currentViewTransition || collisionBehavior === 'skipOld') {
		scopeData.keepLast = !!scopeData.currentViewTransition && !!scopeData.open;
		scopeData.open = requestAnimationFrame(() => close(scopeData));
		scopeData.currentViewTransition = polyfilledTypes(
			(scopeData.currentViewTransition = surrogate
				? createViewTransitionSurrogate(unchainUpdates)
				: scope.startViewTransition!(unchainUpdates)),
			useTypesPolyfill === 'always' || (useTypesPolyfill !== 'never' && nativeSupport === 'partial')
		);
		if (catchErrors) {
			const error = (e: any) => console.error(e);
			scopeData.currentViewTransition.updateCallbackDone.catch(error);
			scopeData.currentViewTransition.ready.catch(error);
		}
		scopeData.currentViewTransition.finished.finally(() => {
			getTypeAttributes()?.forEach((t) => document.documentElement.classList.remove(t));
			scopeData.currentViewTransition = undefined;
			scopeData.chained
				.splice(0, scopeData.chained.length)
				.forEach(({ update, extensions, proxy }) => {
					mayStartViewTransition({ update, types: [...proxy.types] }, extensions);
					proxy.switch();
				});
		});
	}
	if (scopeData.open && (collisionBehavior !== 'chaining-only' || scopeData.updates.length === 0)) {
		types.forEach((t) => scopeData.currentViewTransition!.types?.add(t));
		scopeData.updates.push(update);
		return scopeData.currentViewTransition;
	}
	const proxy = createViewTransitionProxy(types);
	scopeData.chained.push({ update, extensions, proxy });
	if (extensions.speedUpWhenChained !== 1) {
		document.getAnimations().forEach((a) => {
			a.effect?.pseudoElement?.startsWith('::view-transition') &&
				(a.playbackRate *= extensions.speedUpWhenChained!);
		});
	}
	return proxy;

	async function unchainUpdates() {
		const current = scopeData.updates.splice(
			0,
			scopeData.updates.length - (scopeData.keepLast ? 1 : 0)
		);
		scopeData.keepLast = false;
		const rejected = (await Promise.allSettled(current.map((u) => u!()))).find(
			(r) => r.status === 'rejected'
		) as PromiseRejectedResult;
		if (rejected) throw new Error(rejected.reason);
	}
}
