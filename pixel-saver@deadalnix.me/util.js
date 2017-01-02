const Mainloop = imports.mainloop;

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

