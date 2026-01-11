import { getCurrentViewTransition } from './may-start-view-transition.js';
import { createPromiseSubstitute } from './switchable-promise.js';

export interface SwitchableViewTransition extends ViewTransition {
	switch(): void;
}

export function createViewTransitionProxy(types: Set<string>): SwitchableViewTransition {
	let delegate: ViewTransition | undefined = undefined;
	let skipped = false;
	const waitForThose: Promise<unknown>[] = [];
	return new Proxy(
		{
			updateCallbackDone: createPromiseSubstitute(),
			ready: createPromiseSubstitute(),
			finished: createPromiseSubstitute(),
			skipTransition: () => (delegate ? delegate.skipTransition() : (skipped = true)),
			waitUntil: (promise: Promise<unknown>) => waitForThose.push(promise),
			types: new Proxy(new Set(types), {
				get(target, prop: string | symbol) {
					if (prop === 'add') {
						return (value: string) => (delegate ? delegate.types!.add(value) : target.add(value));
					} else if (prop === 'delete') {
						return (value: string) =>
							delegate ? delegate.types!.delete(value) : target.delete(value);
					} else if (prop === 'clear') {
						return () => (delegate ? delegate.types!.clear() : target.clear());
					} else if (prop === 'has') {
						return (value: string) => (delegate ? delegate.types!.has(value) : target.has(value));
					} else if (prop === 'size') {
						return () => (delegate ? delegate.types!.size : target.size);
					} else if (prop === 'forEach') {
						return (
							callback: (value: string, value2: string, set: Set<string>) => void,
							thisArg?: any
						) =>
							delegate
								? delegate.types!.forEach(callback, thisArg)
								: target.forEach(callback, thisArg);
					} else if (prop === Symbol.iterator) {
						return () =>
							delegate ? delegate.types![Symbol.iterator]() : target[Symbol.iterator]();
					}
					return target[prop as keyof Set<string>];
				},
			}),
			switch() {
				const currentViewTransition = getCurrentViewTransition();
				if (!currentViewTransition) throw new Error('No view transition active');
				if (delegate) throw new Error('Already switched to another view transition');
				if (skipped) {
					currentViewTransition?.skipTransition();
				}
				if ('waitUntil' in currentViewTransition)
					for (const promise of waitForThose) {
						currentViewTransition.waitUntil(promise);
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
				return delegate ? delegate[prop] : (target as Record<string, unknown>)[prop];
			},
		}
	);
}
