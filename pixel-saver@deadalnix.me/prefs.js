/* -*- mode:js; indent-tabs-mode:true; tab-width: 4 -*- */
const Lang = imports.lang;
const Gtk = imports.gi.Gtk;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const Gettext = imports.gettext.domain('pixel-saver');
const _ = Gettext.gettext;

const SHOW_BUTTONS = 'show-buttons';

function init() {
	Convenience.initTranslations('pixel-saver');
}

function buildPrefsWidget() {
	let settings = Convenience.getSettings();

	let container = new Gtk.Box({
		orientation: Gtk.Orientation.VERTICAL,
		border_width: 10
	});

	(function() {
		let hbox = new Gtk.Box({
			orientation: Gtk.Orientation.HORIZONTAL,
			spacing: 20
		});

		let showButtonsLabel = new Gtk.Label({
			label: _("Show window buttons in top bar") + ":"
		});

		let showButtonsSwitch = new Gtk.Switch({
			active: settings.get_boolean(SHOW_BUTTONS),
			halign: Gtk.Align.END
		});
		showButtonsSwitch.connect('notify::active', Lang.bind(this, function(src) {
			settings.set_boolean(SHOW_BUTTONS, src.active);
		}));

		hbox.add(showButtonsLabel);
		hbox.pack_end(showButtonsSwitch, true, true, 0);

		container.add(hbox);
	})();

	container.show_all();

	return container;
}

