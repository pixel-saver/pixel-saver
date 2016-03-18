const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const Gettext = imports.gettext.domain('pixel-saver');
const _ = Gettext.gettext;

/* Settings Keys */
const SETTINGS_BUTTONS_LEFT = 'buttons-placement-left';
const TRUNCATE_TITLE = 'truncate-title';
const TITLE_LENGTH = 'title-length';

function init() {
//    Convenience.initTranslations();
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

        this.row_spacing = 6;

        this.orientation = Gtk.Orientation.VERTICAL;

        this.settings = Convenience.getSettings();

        this.add(new Gtk.Label({
            label: _("<b>Window buttons on the left</b>"),
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


	this.add(new Gtk.Label({
            label: _("<b>Truncate title</b>"),
            use_markup: true,
            halign: Gtk.Align.START
        }));
	let truncate_title = new Gtk.Switch({
            active: this.settings.get_boolean(TRUNCATE_TITLE),
	    halign: Gtk.Align.START
	});

	let max_title_length_widget = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 0, 200, 40);
        truncate_title.connect('notify::active', Lang.bind(this, function(src) {
            this.settings.set_boolean(TRUNCATE_TITLE, src.active);
            max_title_length_widget.set_sensitive(src.active);
        }));
        this.add(truncate_title);


	this.add(new Gtk.Label({
            label: _("<b>Maximum title length</b>"),
            use_markup: true,
            halign: Gtk.Align.START
        }));
	max_title_length_widget.set_sensitive(this.settings.get_boolean(TRUNCATE_TITLE));
	max_title_length_widget.adjustment.set_value(this.settings.get_int(TITLE_LENGTH));
	max_title_length_widget.connect('value-changed', Lang.bind(this, function(range) {
            this.settings.set_int(TITLE_LENGTH, range.get_value());
        }));
        this.add(max_title_length_widget);
    },
});
