/**
 * @overview
 * Pixel Saver v1.0
 * Amaury SECHET <deadalnix@gmail.com>
 * Other contributors:
 * - Amy Chan <mathematical.coffee@gmail.com>
 * Sept-- 2013.
 *
 * ## Help! It didn't work/I found a bug!
 *
 * This extension is based on work by Amy Chan, namely maximus[1] and Window Buttons[2].
 *
 * 1. Make sure you can *reproduce* the bug reliably.
 * 2. Do 'Ctrl + F2' and 'lg' and see if there are any errors produced by Maximus,
 *	both in the 'Errors' window *and* the 'Extensions' > 'Maximus' > 'Show Errors'
 *	tab (the 'Show Errors' is in GNOME 3.4+ only I think).
 * 3. Disable all your extensions except Maximus and see if you can still reproduce
 *	the bug. If so, mention this.
 * 4. If you can't reproduce th bug with all extensions but Maximus disabled, then
 *	gradually enable your extensions one-by-one until you work out which one(s)
 *	together cause the bug, and mention these.
 * 5. Open a new issue at [4].
 * 6. Include how you can reproduce the bug and any relevant information from 2--4.
 * 7. Also include:
 * - your version of the extension (in metadata.json)
 * - list of all your installed extensions (including disabled ones, as
 *   this is no guarantee they won't interfere with other extensions)
 * - your version of GNOME-shell (gnome-shell --version).
 * 8. I'll try get back to you with a fix.
 * (Brownie points: open a terminal, do `gnome-shell --replace` and reproduce the
 *  bug. Include any errors that pop up in this terminal.)
 *
 * ## Note:
 * It's actually possible to get the undecorate-on-maximise behaviour without
 * needing this extension. See the link [5] and in particular, the bit on editing
 * your metacity theme metacity-theme-3.xml. ("Method 2: editing the theme").
 *
 * ## References:
 * [1]:https://launchpad.net/maximus
 * [2]:https://extensions.gnome.org/extension/59/status-title-bar/
 * [3]:https://bitbucket.org/mathematicalcoffee/window-options-gnome-shell-extension
 * [4]:https://bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension/issues
 * [5]:http://www.webupd8.org/2011/05/how-to-remove-maximized-windows.html
 *
 */
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Decoration = Me.imports.decoration;
const Buttons = Me.imports.buttons;
const AppMenu = Me.imports.app_menu;

function init(extensionMeta) {
	Buttons.init(extensionMeta);
	Decoration.init(extensionMeta);
	AppMenu.init(extensionMeta);
}

function enable() {
	Buttons.enable();
	Decoration.enable();
	AppMenu.enable();
}

function disable() {
	AppMenu.disable();
	Decoration.disable();
	Buttons.disable();
}

