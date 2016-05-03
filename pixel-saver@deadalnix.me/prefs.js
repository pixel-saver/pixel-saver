/* -*- mode:js; indent-tabs-mode:true; tab-width:2; -*- */
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Gettext = imports.gettext.domain('pixel-saver');
const _ = Gettext.gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Settings = Me.imports.settings;

function init() {
	Convenience.initTranslations('pixel-saver');
}

function column(label, widget) {
	let box = new Gtk.Box({
		orientation: Gtk.Orientation.HORIZONTAL,
		spacing: 18
	});
	box.add(label);
	box.pack_end(widget, true, true, 0);

	return box;
}

const PixelSaverPrefsWidget = new GObject.Class({
	Name: 'PixelSaver.Prefs.Widget',
	GTypeName: 'PixelSaverPrefsWidget',
	Extends: Gtk.Box,

	_init: function(params) {
		this.parent(params);

		this.orientation = Gtk.Orientation.VERTICAL;
		this.border_width = 18;
		this.spacing = 6;

		let options = new Settings.Options();

		let buttonPositionLabel = new Gtk.Label({
			label: _("Show window buttons in top panel"),
		});

		let buttonPositionCombo = new Gtk.ComboBoxText({ halign:Gtk.Align.END });
		buttonPositionCombo.set_size_request(120, -1);
		buttonPositionCombo.append('before-name', _("Before Application Name"));
		buttonPositionCombo.append('after-name', _("After Application Name"));
		buttonPositionCombo.append('within-status-area', _("Within System Status Area"));
		buttonPositionCombo.append('after-status-area', _("After System Status Area"));
		buttonPositionCombo.append('hidden', _("Don't show"));
		buttonPositionCombo.set_active_id(options.BUTTON_POSITION.get());
		buttonPositionCombo.connect('changed', Lang.bind(this, function(widget) {
			options.BUTTON_POSITION.set(widget.get_active_id());
		}));

		this.add(column(buttonPositionLabel, buttonPositionCombo));
	}
});

function buildPrefsWidget() {
	let widget = new PixelSaverPrefsWidget();
	widget.show_all();
	return widget;
}

