UUID = pixel-saver@deadalnix.me
TOLOCALIZE =  prefs.js
MSGSRC = $(wildcard po/*.po)
MODULES = app_menu.js buttons.js convenience.js decoration.js extension.js metadata.json prefs.js util.js
INSTALLBASE = ~/.local/share/gnome-shell/extensions

all: extension

.PHONY: clean
clean:
	-rm -fR ./_build
	rm -f ./schemas/gschemas.compiled
	rm -f "$(UUID).zip"

extension: ./schemas/gschemas.compiled $(MSGSRC:.po=.mo)

./schemas/gschemas.compiled: ./schemas/org.gnome.shell.extensions.pixel-saver.gschema.xml
	glib-compile-schemas ./schemas/

potfile: ./po/pixel-saver.pot

.PHONY: addpo
addpo:
ifdef lang
	msginit --no-translator --locale=$(lang).UTF-8 --output=./po/$(lang).po --input=./po/pixel-saver.pot
else
	@echo "You have to specify the language code for the new translation with lang=code\n"
	@echo "E.g.\n\n    $$ make lang=de\n\n or\n\n    $$ make lang=de_CH\n"
endif

.PHONY: updatepo
updatepo: potfile
	@echo "merge"
	for l in $(MSGSRC); do \
		msgmerge -U $$l ./po/pixel-saver.pot; \
	done;

./po/pixel-saver.pot: $(TOLOCALIZE)
	@echo "create"
	mkdir -p po
	xgettext -k_ -kN_ -o po/pixel-saver.pot --package-name "pixel-saver" $(TOLOCALIZE)

./po/%.mo: ./po/%.po
	msgfmt -c $< -o $@

install: _build
	rm -rf $(INSTALLBASE)/$(UUID)
	mkdir -p $(INSTALLBASE)/$(UUID)
	cp -r ./_build/* $(INSTALLBASE)/$(UUID)/
	-rm -fR _build

archive: _build
	zip -qr "$(UUID).zip" $(MODULES) locale schemas themes

_build: all
	-rm -fR ./_build
	mkdir -p _build
	cp $(MODULES) _build
	mkdir -p _build/themes
	cp -r themes/* _build/themes/
	mkdir -p _build/schemas
	cp schemas/*.xml _build/schemas/
	cp schemas/gschemas.compiled _build/schemas/
	mkdir -p _build/locale
	for l in $(MSGSRC:.po=.mo) ; do \
		lf=_build/locale/`basename $$l .mo`; \
		mkdir -p $$lf; \
		mkdir -p $$lf/LC_MESSAGES; \
		cp $$l $$lf/LC_MESSAGES/pixel-saver.mo; \
	done;
#	sed -i 's/"version": -1/"version": "$(VERSION)"/'  _build/metadata.json;

#./po/%.mo: ./po/%.po
#	@echo "format " $@ $< $*
#	mkdir -p ./locale/$*/LC_MESSAGES
#	msgfmt -c $< -o ./locale/$*/LC_MESSAGES/pixel-saver.mo

