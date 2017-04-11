const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

const Gettext = imports.gettext.domain('pixel-saver');
const _ = Gettext.gettext;

let settings;

function init() {
	settings = Utils.getSettings(Me);
	Utils.initTranslations("pixel-saver");
}

function buildPrefsWidget(){

	// Prepare labels and controls
	let buildable = new Gtk.Builder();
	buildable.add_from_file( Me.dir.get_path() + '/Settings.ui' );
	let box = buildable.get_object('prefs_widget');

	// Basic settings tab:
	settings.bind('only-main-monitor',
		buildable.get_object('only_main_monitor_switch'),
		'active',
		Gio.SettingsBindFlags.DEFAULT);

	box.show_all();

	return box;
};

