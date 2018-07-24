const Mainloop = imports.mainloop;
const Meta = imports.gi.Meta;

const MAXIMIZED = Meta.MaximizeFlags.BOTH;

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
		let is_maximized = window.get_maximized() === MAXIMIZED;
  	        let is_maxvertical = window.get_maximized() === Meta.MaximizeFlags.VERTICAL;
		if (window.has_focus() && (is_maximized || is_maxvertical)  && !window.minimized) {
			return window;
		}
	}
	
	return null;
}

function onSizeChange(callback) {
	let callbackIDs = [];
	let wm = global.window_manager;
	
	// Obvious size change callback.
	callbackIDs.push(wm.connect('size-change', callback));
	
	// Needed for window drag to top panel (this doesn't trigger maximize).
	callbackIDs.push(wm.connect('hide-tile-preview', callback));
	
	// NB: 'destroy' needs a delay for .list_windows() report correctly
	callbackIDs.push(wm.connect('destroy', function () {
		Mainloop.idle_add(callback);
	}));
	
	return callbackIDs;
}

