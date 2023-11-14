import * as Main from "resource:///org/gnome/shell/ui/main.js";
import GLib from "gi://GLib";
import Shell from "gi://Shell";
import St from "gi://St";
import Clutter from "gi://Clutter";

import * as Util from "./util.js";

function LOG(message) {
    // log("[pixel-saver]: " + message);
}

function WARN(message) {
    log("[pixel-saver]: " + message);
}

let appMenu = null;

/**
 * AppMenu synchronization
 */
function updateAppMenu() {
    let win = global.display.focus_window;
    if (!win) {
        return false;
    }

    let title = win.title;

    // Not the topmost maximized window.
    if (win !== Util.getWindow()) {
        let app = Shell.WindowTracker.get_default().get_window_app(win);
        title = app.get_name();
    }

    if (title.length > 64) {
        title = title.substr(0, 62) + "...";
    }
    title = title.replace(/\n/g, " ");

    LOG("Override title " + title);
    appMenu._label.set_text(title);
    tooltip.text = title;

    return false;
}

/**
 * Track the focused window's title
 */
let activeWindow = null;
let awCallbackID = 0;
function changeActiveWindow(win) {
    if (win === activeWindow) {
        return;
    }

    if (activeWindow) {
        activeWindow.disconnect(awCallbackID);
    }

    activeWindow = win;

    if (win) {
        awCallbackID = win.connect("notify::title", updateAppMenu);
        updateAppMenu();
    }
}

/**
 * Focus change
 */
function onFocusChange() {
    let input_mode_check =
        global.stage_input_mode === undefined ? true : global.stage_input_mode == Shell.StageInputMode.FOCUSED;
    if (!Shell.WindowTracker.get_default().focus_app && input_mode_check) {
        // If the app has just lost focus to the panel, pretend
        // nothing happened; otherwise you can't keynav to the
        // app menu.
        return false;
    }

    changeActiveWindow(global.display.focus_window);
    return false;
}

/**
 * tooltip
 */
let tooltip = null;
let showTooltip = false;

let SHOW_DELAY = 350;
let SHOW_DURATION = 0.15;
let HIDE_DURATION = 0.1;

let tooltipDelayCallbackID = 0;
let menuCallbackID = 0;

function resetMenuCallback() {
    if (menuCallbackID) {
        appMenu.menu.disconnect(menuCallbackID);
        menuCallbackID = 0;
    }
}

function onAppMenuHover(actor) {
    let hover = actor.get_hover();
    if (showTooltip === hover) {
        return false;
    }

    // We are not in the right state, let's fix that.
    showTooltip = hover;

    if (showTooltip) {
        tooltipDelayCallbackID = GLib.timeout_add(GLib.PRIORITY_DEFAULT, SHOW_DELAY, function () {
            if (!showTooltip) {
                WARN("showTooltip is false and delay callback ran.");
            }

            // Something wants us to stop.
            if (tooltipDelayCallbackID === 0) {
                return false;
            }

            let label = appMenu._label;
            if (label == null || !label.get_clutter_text().get_layout().is_ellipsized()) {
                // Do not need to hide.
                tooltipDelayCallbackID = 0;
                return false;
            }

            Main.uiGroup.add_actor(tooltip);

            resetMenuCallback();
            menuCallbackID = appMenu.menu.connect("open-state-changed", function (menu, open) {
                if (open) {
                    Main.uiGroup.remove_actor(tooltip);
                } else {
                    Main.uiGroup.add_actor(tooltip);
                }
            });

            [px, py] = Main.panel.actor.get_transformed_position();
            [bx, by] = label.get_transformed_position();
            [w, h] = label.get_transformed_size();

            let y = py + Main.panel.actor.get_height() + 3;
            let x = bx - Math.round((tooltip.get_width() - w) / 2);
            tooltip.opacity = 0;
            tooltip.set_position(x, y);

            LOG("show title tooltip");

            tooltip.remove_all_transitions();
            tooltip.ease({
                opacity: 255,
                time: SHOW_DURATION,
                transition: Clutter.AnimationMode.EASE_OUT_QUAD,
            });

            return false;
        });
    } else if (tooltipDelayCallbackID > 0) {
        // If the event ran, then we hide.
        LOG("hide title tooltip");

        resetMenuCallback();

        tooltip.remove_all_transitions();
        tooltip.ease({
            opacity: 0,
            time: HIDE_DURATION,
            transition: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: function () {
                Main.uiGroup.remove_actor(tooltip);
            },
        });

        tooltipDelayCallbackID = 0;
    }

    return false;
}

/**
 * Subextension hooks
 */
function init() {}

let wmCallbackIDs = [];
let focusCallbackID = 0;
let tooltipCallbackID = 0;

function enable() {
    appMenu = Main.panel.statusArea.appMenu;

    tooltip = new St.Label({
        style_class: "tooltip dash-label",
        text: "",
        opacity: 0,
    });

    wmCallbackIDs = wmCallbackIDs.concat(Util.onSizeChange(updateAppMenu));

    focusCallbackID = global.display.connect("notify::focus-window", onFocusChange);
    tooltipCallbackID = appMenu.actor.connect("notify::hover", onAppMenuHover);
}

function disable() {
    wmCallbackIDs.forEach(function (id) {
        global.window_manager.disconnect(id);
    });

    wmCallbackIDs = [];

    global.display.disconnect(focusCallbackID);
    focusCallbackID = 0;

    appMenu.actor.disconnect(tooltipCallbackID);
    tooltipCallbackID = 0;

    if (activeWindow) {
        activeWindow.disconnect(awCallbackID);
        awCallbackID = 0;
        activeWindow = null;
    }

    if (tooltipDelayCallbackID) {
        GLib.Source.remove(tooltipDelayCallbackID);
        tooltipDelayCallbackID = 0;
    }

    resetMenuCallback();

    tooltip.destroy();
    tooltip = null;
}

export { init, enable, disable };
