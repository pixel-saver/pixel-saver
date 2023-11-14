import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Meta from "gi://Meta";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as Util from "resource:///org/gnome/shell/misc/util.js";

import * as Utils from "./util.js";

function LOG(message) {
    // log("[pixel-saver]: " + message);
}

function WARN(message) {
    log("[pixel-saver]: " + message);
}

function check_xprop() {
    let file = Gio.File.new_for_path("/usr/bin/xprop");
    try {
        let [success, contents] = file.load_contents(null);
    } catch (err) {
        Main.notify("Pixel saver", "The extension needs the program 'xprop' to run.");
    }
}

/**
 * Guesses the X ID of a window.
 *
 * It is often in the window's title, being `"0x%x %10s".format(XID, window.title)`.
 * (See `mutter/src/core/window-props.c`).
 *
 * If we couldn't find it there, we use `win`'s actor, `win.get_compositor_private()`.
 * The actor's `x-window` property is the X ID of the window *actor*'s frame
 * (as opposed to the window itself).
 *
 * However, the child window of the window actor is the window itself, so by
 * using `xwininfo -children -id [actor's XID]` we can attempt to deduce the
 * window's X ID.
 *
 * It is not always foolproof, but works good enough for now.
 *
 * @param {Meta.Window} win - the window to guess the XID of. You wil get better
 * success if the window's actor (`win.get_compositor_private()`) exists.
 */
function guessWindowXID(win) {
    // We cache the result so we don't need to redetect.
    if (win._pixelSaverWindowID) {
        return win._pixelSaverWindowID;
    }

    /**
     * If window title has non-utf8 characters, get_description() complains
     * "Failed to convert UTF-8 string to JS string: Invalid byte sequence in conversion input",
     * event though get_title() works.
     */
    try {
        let m = win.get_description().match(/0x[0-9a-f]+/);
        if (m && m[0]) {
            return (win._pixelSaverWindowID = m[0]);
        }
    } catch (err) {}

    // use xwininfo, take first child.
    let act = win.get_compositor_private();
    let xwindow = act && act["x-window"];
    if (xwindow) {
        let xwininfo = GLib.spawn_command_line_sync("xwininfo -children -id 0x%x".format(xwindow));
        if (xwininfo[0]) {
            let str = xwininfo[1].toString();

            /**
             * The X ID of the window is the one preceding the target window's title.
             * This is to handle cases where the window has no frame and so
             * act['x-window'] is actually the X ID we want, not the child.
             */
            let regexp = new RegExp('(0x[0-9a-f]+) +"%s"'.format(win.title));
            let m = str.match(regexp);
            if (m && m[1]) {
                return (win._pixelSaverWindowID = m[1]);
            }

            // Otherwise, just grab the child and hope for the best
            m = str.split(/child(?:ren)?:/)[1].match(/0x[0-9a-f]+/);
            if (m && m[0]) {
                return (win._pixelSaverWindowID = m[0]);
            }
        }
    }

    // Try enumerating all available windows and match the title. Note that this
    // may be necessary if the title contains special characters and `x-window`
    // is not available.
    let result = GLib.spawn_command_line_sync("xprop -root _NET_CLIENT_LIST");
    LOG("xprop -root _NET_CLIENT_LIST");
    if (result[0]) {
        let str = result[1].toString();

        // Get the list of window IDs.
        let windowList = str.match(/0x[0-9a-f]+/g);

        // For each window ID, check if the title matches the desired title.
        for (var i = 0; i < windowList.length; ++i) {
            let cmd = 'xprop -id "' + windowList[i] + '" _NET_WM_NAME _PIXEL_SAVER_ORIGINAL_STATE';
            let result = GLib.spawn_command_line_sync(cmd);
            LOG(cmd);

            if (result[0]) {
                let output = result[1].toString();
                let isManaged = output.indexOf("_PIXEL_SAVER_ORIGINAL_STATE(CARDINAL)") > -1;
                if (isManaged) {
                    continue;
                }

                let title = output.match(/_NET_WM_NAME(\(\w+\))? = "(([^\\"]|\\"|\\\\)*)"/);
                LOG('Title of XID %s is "%s".'.format(windowList[i], title[2]));

                // Is this our guy?
                if (title && title[2] == win.title) {
                    return windowList[i];
                }
            }
        }
    }

    // debugging for when people find bugs..
    WARN("Could not find XID for window with title %s".format(win.title));
    return null;
}

const WindowState = {
    DEFAULT: "default",
    HIDE_TITLEBAR: "hide_titlebar",
    UNDECORATED: "undecorated",
    UNKNOWN: "unknown",
};

/**
 * Get the value of _MOTIF_WM_HINTS before
 * pixel saver did its magic.
 *
 * @param {Meta.Window} win - the window to check the property
 */
function getOriginalState(win) {
    if (win._pixelSaverOriginalState !== undefined) {
        return win._pixelSaverOriginalState;
    }

    if (!win.decorated) {
        return (win._pixelSaverOriginalState = WindowState.UNDECORATED);
    }

    let id = guessWindowXID(win);
    let cmd = "xprop -id " + id;
    LOG(cmd);

    let xprops = GLib.spawn_command_line_sync(cmd);
    if (!xprops[0]) {
        WARN("xprop failed for " + win.title + " with id " + id);
        return (win._pixelSaverOriginalState = State.UNKNOWN);
    }

    let decoder = new TextDecoder();
    let str = decoder.decode(xprops[1]);
    let m = str.match(/^_PIXEL_SAVER_ORIGINAL_STATE\(CARDINAL\) = ([0-9]+)$/m);
    log(m);
    if (m) {
        return (win._pixelSaverOriginalState = !!m[1] ? WindowState.HIDE_TITLEBAR : WindowState.DEFAULT);
    }

    m = str.match(/^_MOTIF_WM_HINTS(\(CARDINAL\))? = [0-9], [0-9]$/m);
    log(m);
    if (m) {
        let state = !!m[1];
        cmd = [
            "xprop",
            "-id",
            id,
            "-f",
            "_PIXEL_SAVER_ORIGINAL_STATE",
            "32c",
            "-set",
            "_PIXEL_SAVER_ORIGINAL_STATE",
            state ? "0x1" : "0x0",
        ];
        LOG(cmd.join(" "));
        Util.spawn(cmd);
        return (win._pixelSaverOriginalState = state ? WindowState.HIDE_TITLEBAR : WindowState.DEFAULT);
    }

    WARN("Can't find original state for " + win.title + " with id " + id);

    // GTK uses the _MOTIF_WM_HINTS atom to indicate that the
    // title bar should be hidden when maximized. If we can't find this atom, the
    // window uses the default behavior
    return (win._pixelSaverOriginalState = WindowState.DEFAULT);
}

/**
 * Tells the window manager to hide the titlebar on maximised windows.
 *
 * Does this by setting the _MOTIF_WM_HINTS hint - means
 * I can do it once and forget about it, rather than tracking maximize/unmaximize
 * events.
 *
 * **Caveat**: doesn't work with Ubuntu's Ambiance and Radiance window themes -
 * my guess is they don't respect or implement this property.
 *
 * I don't know how to read the initial value, so I'm not sure how to resore it.
 *
 * @param {Meta.Window} win - window to set the HIDE_TITLEBAR_WHEN_MAXIMIZED property of.
 * @param {boolean} hide - whether to hide the titlebar or not.
 */
function setHideTitlebar(win, hide) {
    LOG("setHideTitlebar: " + win.get_title() + ": " + hide);

    // Make sure we save the state before altering it.
    getOriginalState(win);

    /**
     * Undecorate with xprop. Use _MOTIF_WM_HINTS instead of _GTK_HIDE_TITLEBAR_WHEN_MAXIMIZED because
     * mutter deprecated it in 3.32 (https://gitlab.gnome.org/GNOME/mutter/merge_requests/221)
     */
    let cmd = [
        "xprop",
        "-id",
        guessWindowXID(win),
        "-f",
        "_MOTIF_WM_HINTS",
        "32c",
        "-set",
        "_MOTIF_WM_HINTS",
        hide ? "0x2, 0x0, 0x0, 0x0, 0x0" : "0x2, 0x0, 0x1, 0x0, 0x0",
    ];
    LOG(cmd.join(" "));

    // Run xprop
    let success, pid;
    [success, pid] = GLib.spawn_async(
        null,
        cmd,
        null,
        GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
        null
    );
}

/**** Callbacks ****/
/**
 * Callback when a window is added in any of the workspaces.
 * This includes a window switching to another workspace.
 *
 * If it is a window we already know about, we do nothing.
 *
 * Otherwise, we activate the hide title on maximize feature.
 *
 * @param {Meta.Window} win - the window that was added.
 *
 * @see undecorate
 */
function onWindowAdded(ws, win, retry) {
    if (win.window_type === Meta.WindowType.DESKTOP) {
        return false;
    }

    // If the window is simply switching workspaces, it will trigger a
    // window-added signal. We don't want to reprocess it then because we already
    // have.
    if (win._pixelSaverOriginalState !== undefined) {
        return false;
    }

    /**
     * Newly-created windows are added to the workspace before
     * the compositor knows about them: get_compositor_private() is null.
     * Additionally things like .get_maximized() aren't properly done yet.
     * (see workspace.js _doAddWindow)
     */
    if (!win.get_compositor_private()) {
        retry = retry !== undefined ? retry : 0;
        if (retry > 3) {
            return false;
        }

        GLib.idle_add(GLib.DEFAULT_PRIORITY, function () {
            onWindowAdded(ws, win, retry + 1);
            return false;
        });
        return false;
    }

    retry = 3;
    GLib.idle_add(GLib.DEFAULT_PRIORITY, function () {
        let id = guessWindowXID(win);
        if (!id) {
            if (--retry) {
                return true;
            }

            WARN("Finding XID for window %s failed".format(win.title));
            return false;
        }

        LOG("onWindowAdded: " + win.get_title());
        changeTitleBar(win);
        return false;
    });

    return false;
}

let workspaces = [];

/**
 * Call if when a window is changed.
 * If the window is maximized, hide the title bar, otherwise show it.
 *
 * @param {Meta.Window} win the window that changed
 */
function onWindowChanged(win) {
    if (win.window_type === Meta.WindowType.DESKTOP) {
        return false;
    }
    changeTitleBar(win);
    return false;
}

/**
 * Callback for whenever focus changes.
 */
function onChangeFocus() {
    LOG("Focus changed");
    let focusWindow = global.display.focus_window;
    if (!focusWindow) return;
    GLib.idle_add(GLib.DEFAULT_PRIORITY, function () {
        return onWindowChanged(focusWindow);
    });
}

/**
 * Callback whenever window changes.
 */
function onChangeWindowSize() {
    LOG("Window size changed");
    let focusWindow = global.display.focus_window;
    if (!focusWindow) return;
    GLib.idle_add(GLib.DEFAULT_PRIORITY, function () {
        return onWindowChanged(focusWindow);
    });
}

/**
 * Callback whenever the number of workspaces changes.
 *
 * We ensure that we are listening to the 'window-added' signal on each of
 * the workspaces.
 *
 * @see onWindowAdded
 */
function onChangeNWorkspaces() {
    cleanWorkspaces();

    let i = Utils.DisplayWrapper.getWorkspaceManager().n_workspaces;
    while (i--) {
        let ws = Utils.DisplayWrapper.getWorkspaceManager().get_workspace_by_index(i);
        workspaces.push(ws);
        // we need to add a GLib.idle_add, or else in onWindowAdded the
        // window's maximized state is not correct yet.
        ws._pixelSaverWindowAddedId = ws.connect("window-added", function (ws, win) {
            GLib.idle_add(GLib.DEFAULT_PRIORITY, function () {
                return onWindowAdded(ws, win);
            });
        });
    }

    return false;
}

/**
 * Utilities
 */
function cleanWorkspaces() {
    // disconnect window-added from workspaces
    workspaces.forEach(function (ws) {
        ws.disconnect(ws._pixelSaverWindowAddedId);
        delete ws._pixelSaverWindowAddedId;
    });

    workspaces = [];
}

function forEachWindow(callback) {
    global
        .get_window_actors()
        .map(function (w) {
            return w.meta_window;
        })
        .filter(function (w) {
            return w.window_type !== Meta.WindowType.DESKTOP;
        })
        .forEach(callback);
}

function changeTitleBar(win) {
    if (ignoreWindow(win)) return;
    if (win.get_maximized()) {
        LOG("Hiding titlebar");
        hideTitlebar(win);
    } else {
        LOG("Showing titlebar");
        showTitlebar(win);
    }
}

function showTitlebar(win) {
    if (!win._decorationOFF) return;

    win._decorationOFF = false;
    setHideTitlebar(win, false);
}

function hideTitlebar(win) {
    if (win._decorationOFF) return;

    win._decorationOFF = true;
    setHideTitlebar(win, true);
}

/**
 * Decides if the window should be ignored.
 * It should be ignored if the window didn't have a titlebar in the first place.
 * @param {Meta.Window} win The window to check
 */
function ignoreWindow(win) {
    let state = getOriginalState(win);
    let ignore = state !== WindowState.DEFAULT;
    return ignore;
}

/**
 * Subextension hooks
 */
function init() {}

let changeWorkspaceID = 0;
let globWindowManagerID = 0;
let globDisplayID = 0;
function enable() {
    // Check xprop
    check_xprop();

    // Connect events
    changeWorkspaceID = Utils.DisplayWrapper.getWorkspaceManager().connect("notify::n-workspaces", onChangeNWorkspaces);
    globWindowManagerID = Utils.DisplayWrapper.getWindowManager().connect("size-change", onChangeWindowSize);
    globDisplayID = Utils.DisplayWrapper.getDisplay().connect("notify::focus-window", onChangeFocus);

    /**
     * Go through already-maximised windows & undecorate.
     * This needs a delay as the window list is not yet loaded
     * when the extension is loaded.
     * Also, connect up the 'window-added' event.
     * Note that we do not connect this before the onMaximise loop
     * because when one restarts the gnome-shell, window-added gets
     * fired for every currently-existing window, and then
     * these windows will have onMaximise called twice on them.
     */
    GLib.idle_add(GLib.DEFAULT_PRIORITY, function () {
        forEachWindow(function (win) {
            onWindowAdded(null, win);
            onWindowChanged(win);
        });

        onChangeNWorkspaces();
        return false;
    });
}

function disable() {
    if (changeWorkspaceID) {
        Utils.DisplayWrapper.getWorkspaceManager().disconnect(changeWorkspaceID);
        changeWorkspaceID = 0;
    }
    if (globWindowManagerID) {
        Utils.DisplayWrapper.getWindowManager().disconnect(globWindowManagerID);
        globWindowManagerID = 0;
    }
    if (globDisplayID) {
        Utils.DisplayWrapper.getDisplay().disconnect(globDisplayID);
        globDisplayID = 0;
    }

    cleanWorkspaces();

    forEachWindow(function (win) {
        let state = getOriginalState(win);
        LOG("stopUndecorating: " + win.title + " original=" + state);
        if (state == WindowState.DEFAULT) {
            setHideTitlebar(win, false);
        }

        delete win._pixelSaverOriginalState;
        delete win._decorationOFF;
    });
}

export { init, enable, disable };
