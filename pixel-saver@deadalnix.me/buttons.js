const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Meta = imports.gi.Meta;
const PanelMenu = imports.ui.panelMenu;
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
 * A class for button we insert in the activity bar.
 */
const Button = new Lang.Class({
	Name: 'PixelSaverButtons',
	Extends: PanelMenu.Button,
	
	_init: function(action, callback) {
		this.parent(0.0, "Pixel Saver Buttons", true);
		
		this.actor.connect('button-release-event', leftclick(callback));
		this.actor.add_style_class_name('pixel-saver-button');
		this.actor.add_actor(new St.Icon({
			style_class: 'system-status-icon',
			icon_name: 'window-' + action + '-symbolic'
		}));
		
		/*
		this.parent(0.0, "Pixel Saver Buttons", true);
		
		let child = null, trigger = null;
		
		// If we know that theme, use it.
		if (false && theme !== DEFAULT_THEME) {
			trigger = this.actor;
			child = new St.Button({
				style_class: action + ' system-status-icon',
				track_hover: true
			});
		} else {
			trigger = this.actor;
			child = new St.Icon({
				style_class: action + ' system-status-icon',
				icon_name: 'window-' + action + '-symbolic'
			});
		}
		
		this.actor.add_actor(child);
		this.actor.add_style_class_name('pixel-saver-button');
		
		this.actor.connect('button-release-event', leftclick(callback));
		// */
	},
	
	show: function() {
		this.actor.show();
	},
	
	hide: function() {
		this.actor.hide();
	}
});

/**
 * Facilities to create and track buttons.
 */
let buttons = [];

function insertButtons(side, actions) {
	const sides = ['left', 'right'];
	let position = sides[side];
	
	let baseIndex = side
		? Main.panel._rightBox.get_children().length - 1
		: Main.panel._leftBox.get_children().length;
	
	const callbacks = {
		minimize : minimize,
		maximize : maximize,
		close    : close
	};
	
	const icons = {
		minimize : 'minimize',
		maximize : 'restore',
		close    : 'close'
	};
	
	for (let i = 0; i < actions.length; ++i) {
		let action = actions[i];
		if (!action) {
			continue;
		}
		
		let callback = callbacks[action];
		if (!callback) {
			// Skip if the button's name is not right...
			WARN("\'%s\' is not a valid button.".format(action));
			continue;
		}
		
		let icon = icons[action];
		let button = new Button(icon, callback);
		buttons.push(button);
		
		Main.panel.addToStatusArea(
			icon,
			button,
			baseIndex + i,
			position
		);
	}
}

function createButtons() {
	// Ensure we do not create buttons twice.
	destroyButtons();
	
	const DCONF_META_PATH = 'org.gnome.desktop.wm.preferences';
	let buttonLayout = new Gio.Settings({schema_id: DCONF_META_PATH}).get_string('button-layout');
	LOG('Button layout : ' + buttonLayout);
	
	let actions = buttonLayout.replace(/ /g, '').split(':');
	for (let i = 0; i < actions.length; ++i) {
		insertButtons(i, actions[i].split(','));
	}
	
	updateVisibility();
}

function destroyButtons() {
	buttons.forEach(function(button) {
		button.destroy();
	});
	
	buttons = [];
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
	let win = Util.getWindow();
	if (!win || win.minimized) {
		WARN('impossible to minimize');
		return;
	}
	
	win.minimize();
}

function maximize() {
	let win = Util.getWindow();
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
	let win = Util.getWindow();
	if (!win) {
		WARN('impossible to close');
		return;
	}
	
	win.delete(global.get_current_time());
}

/**
 * Theme related functions.
 *
 * The theme variable indicate the current active theme.
 * Null if it is a theme we do not support.
 */
let theme = null;

const DEFAULT_THEME = 'default';

function loadTheme() {
	let defaultCSS = GLib.build_filenamev([extensionPath, 'themes', 'default.css']);
	if (!GLib.file_test(defaultCSS, GLib.FileTest.EXISTS)) {
		WARN("Failed to load %s".format(defaultCSS));
	}
	
	let gtkTheme = Gtk.Settings.get_default().gtk_theme_name;
	let themeCSS = GLib.build_filenamev([extensionPath, 'themes', gtkTheme, 'style.css']);
	
	if (!GLib.file_test(themeCSS, GLib.FileTest.EXISTS)) {
		LOG("Failed to load theme %s, using default instead.".format(gtkTheme));
		gtkTheme = DEFAULT_THEME;
	}
	
	if (theme === gtkTheme) {
		return;
	}
	
	unloadTheme();
	
	// Load the new style
	let themeCtx = St.ThemeContext.get_for_stage(global.stage).get_theme();
	
	// If we never set a theme, we need to load the default CSS.
	if (theme === null) {
		LOG('Loading default.css');
		themeCtx.load_stylesheet(Gio.file_new_for_path(defaultCSS));
	}
	
	// If we have a known theme, load it.
	if (gtkTheme !== DEFAULT_THEME) {
		LOG('Loading theme ' + gtkTheme);
		themeCtx.load_stylesheet(Gio.file_new_for_path(themeCSS));
	}
	
	// Register the new theme.
	theme = gtkTheme;
	
	// Force style update.
	createButtons();
}

function unloadTheme(unloadDefault = false) {
	if (theme === null) {
		return;
	}
	
	let themeCtx = St.ThemeContext.get_for_stage(global.stage).get_theme();
	if (theme !== DEFAULT_THEME) {
		LOG('Unloading theme ' + theme);
		
		let themeCSS = GLib.build_filenamev([extensionPath, 'themes', theme, 'style.css']);
		themeCtx.unload_stylesheet(themeCSS);
		
		theme = DEFAULT_THEME;
	}
	
	if (unloadDefault) {
		LOG('Unloading default.css');
		
		let defaultCSS = GLib.build_filenamev([extensionPath, 'themes', 'default.css']);
		themeCtx.unload_stylesheet(themeCSS);
		
		theme = null;
	}
}

/**
 * callbacks
 */
function updateVisibility() {
	// If we have a window to control, then we show the buttons.
	let visible = !Main.overview.visible;
	if (visible) {
		visible = false;
		let win = Util.getWindow();
		if (win) {
			visible = win.decorated;
		}
	}
	
	buttons.forEach(function(button) {
		if (visible) {
			button.show();
		} else {
			button.hide();
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
let overviewCallbackIDs = [];
let themeCallbackID = 0;

function enable() {
	loadTheme();
	createButtons();
	
	overviewCallbackIDs.push(Main.overview.connect('showing', updateVisibility));
	overviewCallbackIDs.push(Main.overview.connect('hidden', updateVisibility));
	
	let wm = global.window_manager;
	wmCallbackIDs.push(wm.connect('switch-workspace', updateVisibility));
	wmCallbackIDs.push(wm.connect('map', updateVisibility));
	wmCallbackIDs.push(wm.connect('minimize', updateVisibility));
	wmCallbackIDs.push(wm.connect('unminimize', updateVisibility));
	
	wmCallbackIDs = wmCallbackIDs.concat(Util.onSizeChange(updateVisibility));
	
	themeCallbackID = Gtk.Settings.get_default().connect('notify::gtk-theme-name', loadTheme);
}

function disable() {
	wmCallbackIDs.forEach(function(id) {
		global.window_manager.disconnect(id);
	});
	
	overviewCallbackIDs.forEach(function(id) {
		Main.overview.disconnect(id);
	});
	
	wmCallbackIDs = [];
	overviewCallbackIDs = [];
	
	if (themeCallbackID !== 0) {
		Gtk.Settings.get_default().disconnect(0);
		themeCallbackID = 0;
	}
	
	destroyButtons();
	unloadTheme(true);
}
