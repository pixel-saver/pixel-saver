const Meta = imports.gi.Meta;

const VERT = Meta.MaximizeFlags.VERTICAL;
const BOTH = Meta.MaximizeFlags.BOTH;

function getWindow() {
	// get all window in stacking order.
	let windows = global.display.sort_windows_by_stacking(
		global.screen.get_active_workspace().list_windows().filter(function (w) {
			return w.get_window_type() !== Meta.WindowType.DESKTOP;
		})
	);

	let i = windows.length;
		while (i--) {
			let window = windows[i];
			let maximized = window.get_maximized()
			if ((maximized === VERT || maximized === BOTH) && !window.minimized) {
			return window;
		}
	}

	return null;
}

