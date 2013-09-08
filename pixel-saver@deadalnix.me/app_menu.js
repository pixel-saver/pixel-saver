const Lang = imports.lang;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Shell = imports.gi.Shell;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Util = Me.imports.util;

function LOG(message) {
	// log("[pixel-saver]: " + message);
}

function WARN(message) {
	log("[pixel-saver]: " + message);
}

/*
 * AppMenu synchronization
 */
function updateAppMenu() {
	let win = global.display.focus_window;
	
	if(!win) {
		return false;
	}
	
	let title = win.title;
	
	// Not the topmost maximized window.
	if(win !== Util.getWindow()) {
		let app = Shell.WindowTracker.get_default().get_window_app(win);
		title = app.get_name();
	}
	
	LOG('Override title ' + title);
	Main.panel._appMenu._label.setText(title);
	
	return false;
}

/*
 * Track the focused window's title
 */
let activeWindow = null;
let awCallbackID = 0;
function changeActiveWindow(win) {
	if(win === activeWindow) {
		return;
	}
	
	if(activeWindow) {
		activeWindow.disconnect(awCallbackID);
	}
	
	activeWindow = win;
	
	if(win) {
		awCallbackID = win.connect('notify::title', updateAppMenu);
		updateAppMenu();
	}
}

/*
 * Focus change
 */
function onFocusChange() {
	if (!Shell.WindowTracker.get_default().focus_app &&
		global.stage_input_mode == Shell.StageInputMode.FOCUSED) {
		// If the app has just lost focus to the panel, pretend
		// nothing happened; otherwise you can't keynav to the
		// app menu.
		return false;
	}
	
	changeActiveWindow(global.display.focus_window);
	return false;
}

/*
 * Subextension hooks
 */
function init() {}

let wmCallbackIDs = [];
let focusCallbackID = 0;
function enable() {
	focusCallbackID = Shell.WindowTracker.get_default().connect('notify::focus-app', onFocusChange);
	
	wmCallbackIDs.push(global.window_manager.connect('maximize', updateAppMenu));
	wmCallbackIDs.push(global.window_manager.connect('unmaximize', updateAppMenu));
	
	// note: 'destroy' needs a delay for .list_windows() report correctly
    wmCallbackIDs.push(global.window_manager.connect('destroy', function () {
		Mainloop.idle_add(updateAppMenu);
	}));
}

function disable() {
	Shell.WindowTracker.get_default().disconnect(focusCallbackID);
	focusCallbackID = 0;
	
	for (let i = 0; i < wmCallbackIDs.length; ++i) {
		global.window_manager.disconnect(wmCallbackIDs[i]);
	}
	
	wmCallbackIDs = [];
	
	if(activeWindow) {
		activeWindow.disconnect(awCallbackID);
		awCallbackID = 0;
		activeWindow = null;
	}
}

