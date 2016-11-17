if (document.location.host === 'www.bountysource.com') {
	safari.self.tab.dispatchMessage('cookie', document.cookie);
}