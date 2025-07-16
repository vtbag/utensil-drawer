export interface SwitchablePromise extends Promise<void> {
	switch(to: Promise<void>): void;
}
export function createPromiseSubstitute(): SwitchablePromise {
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
