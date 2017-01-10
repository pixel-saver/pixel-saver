const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Meta = imports.gi.Meta;
const St = imports.gi.St;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Util = Me.imports.util;

function LOG(message) {
	// log("[pixel-saver]: " + message);
}

function WARN(message) {
	log("[pixel-saver]: " + message);
}

/**
 * Buttons
 */
const DCONF_META_PATH = 'org.gnome.desktop.wm.preferences';

let initialized = false;
let actors = [], boxes = [];
function createButtons() {
	// Ensure we do not create buttons twice.
	destroyButtons();
	
	actors = [
		new St.Bin({ style_class: 'box-bin' }),
		new St.Bin({ style_class: 'box-bin' })
	];
	
	boxes = [
		new St.BoxLayout({ style_class: 'button-box' }),
		new St.BoxLayout({ style_class: 'button-box' })
	];
	
	actors.forEach(function(actor, i) {
		actor.add_actor(boxes[i]);
	});
	
	let order = new Gio.Settings({schema_id: DCONF_META_PATH}).get_string('button-layout');
	LOG('Buttons layout : ' + order);
	
	let orders = order.replace(/ /g, '').split(':');
	
	orders[0] = orders[0].split(',');
	orders[1] = orders[1].split(',');
	
	const callbacks = {
		minimize : minimize,
		maximize : maximize,
		close    : close
	};
	
	for (let bi = 0; bi < boxes.length; ++bi) {
		let order = orders[bi],
		    box = boxes[bi];
		
		for (let i = 0; i < order.length; ++i) {
			if (!order[i]) {
				continue;
			}
			
			if (!callbacks[order[i]]) {
				// Skip if the button's name is not right...
				WARN("\'%s\' is not a valid button.".format(order[i]));
				continue;
			}

			let icon = new St.Icon({
				style_class: order[i] + ' window-button',
				reactive: true,
				track_hover: true
			});
			icon.connect('button-press-event', function() { return true; });
			icon.connect('button-release-event', leftclick(callbacks[order[i]]));

			box.add(icon);
		}

		if (!box.get_children().length) {
			boxes[bi].destroy();
			boxes[bi] = null;
			actors[bi].destroy();
			actors[bi] = null;
		}
	}
}

function destroyButtons() {
	actors.forEach(function(actor, i) {
		if (actor) {
			actor.destroy();
			boxes[i].destroy();
		}
	});
	
	actors = [];
	boxes = [];
}

/**
 * Buttons actions
 */
function leftclick(callback) {
	return function(actor, event) {
		if (event.get_button() !== 1) {
			return null;
		}
		
		return callback(actor, event);
	}
}

function minimize() {
	let win = global.display.focus_window;
	if (!win || win.minimized) {
		WARN('impossible to minimize');
		return;
	}
	
	win.minimize();
}

function maximize() {
	let win = global.display.focus_window;
	if (!win) {
		WARN('impossible to maximize');
		return;
	}
	
	const MAXIMIZED = Meta.MaximizeFlags.BOTH;
	if (win.get_maximized() === MAXIMIZED) {
		win.unmaximize(MAXIMIZED);
	} else {
		WARN('window shoud already be maximized');
		win.maximize(MAXIMIZED);
	}
	
	win.activate(global.get_current_time());
}

function close() {
	let win = global.display.focus_window;
	if (!win) {
		WARN('impossible to close');
		return;
	}
	
	win.delete(global.get_current_time());
}

/**
 * Theming
 */
let activeCSS = false;
function loadTheme() {
	let theme = Gtk.Settings.get_default().gtk_theme_name,
		cssPath = GLib.build_filenamev([extensionPath, 'themes', theme, 'style.css']);
	
	LOG('Load theme ' + theme);
	if (!GLib.file_test(cssPath, GLib.FileTest.EXISTS)) {
		cssPath = GLib.build_filenamev([extensionPath, 'themes/default/style.css']);
	}
	
	if (cssPath === activeCSS) {
		return;
	}
	
	unloadTheme();
	
	// Load the new style
	let cssFile = Gio.file_new_for_path(cssPath);
	St.ThemeContext.get_for_stage(global.stage).get_theme().load_stylesheet(cssFile);
	
	// Force style update.
	actors.forEach(function(actor) {
		actor.grab_key_focus();
	});
	
	activeCSS = cssPath;
}

function unloadTheme() {
	if (activeCSS) {
		LOG('Unload ' + activeCSS);
		
		let cssFile = Gio.file_new_for_path(activeCSS);
		St.ThemeContext.get_for_stage(global.stage).get_theme().unload_stylesheet(cssFile);
		activeCSS = false;
	}
}

/**
 * callbacks
 */
function updateVisibility() {
	let win = global.display.focus_window
	if (!win) {
		return false;
	}

	if (!initialized) {
		Mainloop.idle_add(function () {
			let buttonContainer = Main.panel.statusArea.appMenu._container;

			if (actors[0]) {
				buttonContainer.insert_child_at_index(actors[0], 0);
			}

			if (actors[1]) {
				buttonContainer.insert_child_at_index(actors[1], buttonContainer.get_children().length - 1);
			}

			return false;
		});

		initialized = true;
	}
	
	// Only show buttons when focused window title is shown in AppMenu (see app_menu.js)
	let visible = win.decorated && win.get_maximized();
	
	actors.forEach(function(actor, i) {
		if (!actor) {
			return;
		}
		
		if (visible) {
			actor.show();
		} else {
			actor.hide();
		}
	});
	
	return false;
}

/**
 * Subextension hooks
 */
let extensionPath;
function init(extensionMeta) {
	extensionPath = extensionMeta.path;
}

let wmCallbackIDs = [];
let themeCallbackID = 0;
let focusCallbackID = 0;

function enable() {
	loadTheme();
	createButtons();

	wmCallbackIDs = wmCallbackIDs.concat(Util.onSizeChange(updateVisibility));
	
	focusCallbackID = global.display.connect('notify::focus-window', updateVisibility);
	
	themeCallbackID = Gtk.Settings.get_default().connect('notify::gtk-theme-name', loadTheme);
}

function disable() {
	wmCallbackIDs.forEach(function(id) {
		global.window_manager.disconnect(id);
	});
	wmCallbackIDs = [];
	
	global.display.disconnect(focusCallbackID);
	focusCallbackID = 0;
	
	if (themeCallbackID !== 0) {
		Gtk.Settings.get_default().disconnect(0);
		themeCallbackID = 0;
	}
	
	destroyButtons();
	unloadTheme();

	initialized = false;
}

