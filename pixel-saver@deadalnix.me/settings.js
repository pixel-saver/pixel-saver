/* -*- mode:js; indent-tabs-mode:true; tab-width:2 -*- */
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

function Options() {
	var self = this;
	var settings = Convenience.getSettings();
	var signals = {};
	function _bind(key, callback) {
		return signals[key] = settings.connect('changed::' + key, callback);
	};
	this.BUTTON_POSITION = {
		key: 'button-position',
		get: function() { return settings.get_string(this.key); },
		set: function(value) { settings.set_string(this.key, value); },
		changed: function(callback) {
			return _bind(this.key, callback);
		},
	};
	this.destroy = function() {
		for (var key in signals) {
			if (signals.hasOwnProperty(key)) {
				settings.disconnect(signals[key]);
				delete signals[key];
			}
		}
	};
}

