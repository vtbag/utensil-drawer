const navigation = window.navigation;

function navigate(e: NavigateEvent) {
	if (e.navigationType === 'push') {
		const entries = navigation.entries();
		const next = e.destination.url;
		for (let i = navigation.currentEntry?.index ?? -1; i >= 0; --i) {
			if (next === entries[i].url) {
				e.preventDefault();
				history.go(i - navigation.currentEntry!.index);
				return;
			}
		}
		for (let i = navigation.currentEntry?.index ?? entries.length; i < entries.length; ++i) {
			if (next === entries[i].url) {
				e.preventDefault();
				history.go(i - navigation.currentEntry!.index);
				return;
			}
		}
	}
}
navigation?.addEventListener('navigate', navigate);
