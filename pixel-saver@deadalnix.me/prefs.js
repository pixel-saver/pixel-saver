const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Gettext = imports.gettext.domain('pixel-saver');
const _ = Gettext.gettext;

const SETTINGS_BUTTONS_LEFT = 'buttons-placement-left';

function init() {
}

function buildPrefsWidget() {
	let widget = new SettingsUI();
	widget.show_all();
	return widget;
}

/* UI Setup */
const SettingsUI = new Lang.Class({
	Name: 'PixelSaver.Prefs.SettingsUI',
	GTypeName: 'SettingsUI',
	Extends: Gtk.Grid,

	_init: function(params) {
		this.parent(params);
		this.margin = 24;
		this.orientation = Gtk.Orientation.VERTICAL;
		this.settings = Convenience.getSettings();

		this.add(new Gtk.Label({
			label: _("<b>Window buttons next to the application menu</b>"),
			use_markup: true,
			halign: Gtk.Align.START
		}));

		let window_buttons_left = new Gtk.Switch({
			active: this.settings.get_boolean(SETTINGS_BUTTONS_LEFT),
			halign: Gtk.Align.START
		});
		window_buttons_left.connect('notify::active', Lang.bind(this, function(src) {
			this.settings.set_boolean(SETTINGS_BUTTONS_LEFT, src.active);
		}));
		this.add(window_buttons_left);
	},
});
