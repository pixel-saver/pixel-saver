Pixel Saver
===========

Pixel Saver is an extension for Gnome Shell that merge the activity bar and the
title bar of maximized window. It is especially interesting for small screens,
but MOAR pixels for your apps is always good!

The extension has no configuration. Its behavior is made to mimic the one of
the title bar and settings affecting the title bar should reflect in
Pixel Saver. It **Just Works**!

For applications using the modern GTK header bar, there are no space savings,
but the application title is still displayed in the top panel to achieve a
uniform appearance.

<table>
	<tr>
		<td><img src="https://raw.github.com/deadalnix/pixel-saver/master/resources/title.png" /></td>
		<td><img src="https://raw.github.com/deadalnix/pixel-saver/master/resources/icons.png" /></td>
	</tr>
	<tr>
		<td colspan="2">The title bar is completely gone and integrated to the activity bar.</td>
	</tr>
</table>

It is largely inspired by [bios and mathematicalcoffee's Window Buttons Extension](https://github.com/mathematicalcoffee/Gnome-Shell-Window-Buttons-Extension) and [mathematicalcoffee's maximus extension](https://bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension) and some code come from there. You may want to check theses out, especially if you want something more configurable.

Get it!
------------

| Gnome Shell version| Pixel saver version                                           | Recommended installation method  |
|-------------|----------------------------------------------------------------------|--------------|
| 3.38        | [1.24](https://github.com/deadalnix/pixel-saver/releases/tag/1.24)   | Manual   
| 3.36        | [1.24](https://github.com/deadalnix/pixel-saver/releases/tag/1.24)   | [GNOME extensions](https://extensions.gnome.org/extension/723/pixel-saver/)
| 3.34        | [1.24](https://github.com/deadalnix/pixel-saver/releases/tag/1.24)   | [GNOME extensions](https://extensions.gnome.org/extension/723/pixel-saver/)
| 3.32        | [1.20](https://github.com/deadalnix/pixel-saver/releases/tag/1.20)   | [GNOME extensions](https://extensions.gnome.org/extension/723/pixel-saver/)
| 3.30        | [1.18](https://github.com/deadalnix/pixel-saver/releases/tag/1.18)   | [GNOME extensions](https://extensions.gnome.org/extension/723/pixel-saver/)
| 3.26        | [1.14](https://github.com/deadalnix/pixel-saver/releases/tag/1.14)   | [GNOME extensions](https://extensions.gnome.org/extension/723/pixel-saver/)
| 3.24        | [1.12](https://github.com/deadalnix/pixel-saver/releases/tag/1.12)   | [GNOME extensions](https://extensions.gnome.org/extension/723/pixel-saver/)
| 3.15        | [1.10](https://github.com/deadalnix/pixel-saver/releases/tag/1.10)   | [GNOME extensions](https://extensions.gnome.org/extension/723/pixel-saver/)
| 3.14        | [1.5.1](https://github.com/deadalnix/pixel-saver/releases/tag/1.5.1) | [GNOME extensions](https://extensions.gnome.org/extension/723/pixel-saver/)
| 3.12        | [1.3](https://github.com/deadalnix/pixel-saver/releases/tag/1.3)     | [GNOME extensions](https://extensions.gnome.org/extension/723/pixel-saver/)

Pixel saver has been available for a long time on 
[GNOME Extensions website](https://extensions.gnome.org/extension/723/pixel-saver/) 
(so it is on 
[GNOME Software](https://wiki.gnome.org/Apps/Software), too),
but it has not been updated there since 2016.

*New* releases are in process of being [reviewed](https://extensions.gnome.org/review) (see #177).

In the meantime, you can install the extension manually.


### Manual install

#### From graphical interface

- (eventually) switch to the tag for your version from this page;
- download the repo's zip from the green button;
- navigate from your home to the gnome shell extension directory 
`.local/share/gnome-shell/extensions`;
- unzip the `pixel-saver@deadalnix.me` directory in extension directory;
- reload `gnome-shell` pressing <kbd>Alt</kbd> + <kbd>F2</kbd> and entering <kbd>r</kbd>;
- enable the extension using [GNOME Tweaks](https://wiki.gnome.org/Apps/Tweaks).

#### From terminal
 
```bash
    # Clone repository
    git clone https://github.com/deadalnix/pixel-saver.git

    # Enter cloned directory
    cd pixel-saver

    # Switch to the proper tag
    git checkout tags/1.24

    # copy to extensions directory
    cp -r pixel-saver@deadalnix.me -t ~/.local/share/gnome-shell/extensions

    # You may need to reload GNOME Shell to recognise new extension by
    # hitting Alt + F2 and entering "r"

    # activate 
    # GNOME <3.38
    gnome-shell-extension-tool -e pixel-saver@deadalnix.me
    # GNOME >= 3.38
    gnome-extensions enable pixel-saver@deadalnix.me

```

### Dependencies

Pixel Saver depends on Xorg's `xprop` and `xwininfo` utilities. If not already
present on your system, these can be installed using:

* Debian/Ubuntu: `apt install x11-utils`
* Fedora/RHEL: `dnf install xorg-x11-utils`
* Arch: `pacman -S xorg-xprop`

Configuration
-------------

Don't be silly!

Screenshots
-----------

If you want to see what the full desktop look like with this extension, you can check out what a [unmaximized window](https://raw.github.com/deadalnix/pixel-saver/master/resources/unmax.png) looks like, as well as a [maximized one](https://raw.github.com/deadalnix/pixel-saver/master/resources/max.png).

