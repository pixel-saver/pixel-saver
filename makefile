UUID = pixel-saver@deadalnix.me
SRC = ./$(UUID)
TARGET = ./bin
SCHEMAS = $(TARGET)/schemas/gschemas.compiled
TOLOCALIZE =  $(SRC)/prefs.js
MSG_SRC = $(SRC)/po/pixel-saver.pot
MESSAGES = $(wildcard $(SRC)/po/*.po)
TRANSLATIONS = $(patsubst $(SRC)/po/%.po,$(TARGET)/locale/%/LC_MESSAGES/pixel-saver.mo, $(wildcard $(SRC)/po/*.po))
INSTALLBASE = ~/.local/share/gnome-shell/extensions

.SUFFIXES:

all: bin


clean:
	rm -fR $(TARGET)


$(TARGET)/schemas/gschemas.compiled: $(SRC)/schemas/org.gnome.shell.extensions.pixel-saver.gschema.xml
	mkdir -p $(TARGET)/schemas
	glib-compile-schemas --strict $(SRC)/schemas/ --targetdir=$(TARGET)/schemas


$(TARGET)/locale/%/LC_MESSAGES/pixel-saver.mo: $(SRC)/po/%.po
	mkdir -p $(TARGET)/locale/$*/LC_MESSAGES/
	msgfmt -c $< -o $@


update-po:
	mkdir -p po
	xgettext -k_ -kN_ -o $(MSG_SRC) --no-location --copyright-holder "The Pixel Saver team" --package-name "Pixel Saver" --msgid-bugs-address "https://github.com/deadalnix/pixel-saver" $(TOLOCALIZE)
	@sed -i 's/SOME DESCRIPTIVE TITLE./Pixel Saver Localization/' $(MSG_SRC)
	@sed -i 's/Copyright (C) YEAR/Copyright (C) 2016/' $(MSG_SRC)
	@sed -i 's/charset=CHARSET/charset=UTF-8/' $(MSG_SRC)
	@sed -i 's/PACKAGE package/Pixel Saver package/' $(MSG_SRC)
	for l in $(MESSAGES); do \
		msgmerge -U --no-location $$l $(MSG_SRC); \
	done;


add-po:
ifdef lang
	msginit --no-translator --locale=$(lang).utf8 --output=$(SRC)/po/$(lang).po --input=$(SRC)/po/pixel-saver.pot
else
	@echo "You have to specify the language code for the new translation with lang=code\n"
	@echo "E.g.\n\n    $$ make addpo lang=de\n\n or\n\n    $$ make addpo lang=de_CH\n"
endif


install: bin uninstall
	mkdir -p $(INSTALLBASE)/$(UUID)
	cp -r $(TARGET)/* $(INSTALLBASE)/$(UUID)/
	-gnome-shell-extension-tool -e $(UUID)


uninstall:
	-@if [ -d $(INSTALLBASE)/$(UUID) ]; then gnome-shell-extension-tool -d $(UUID); fi
	rm -rf $(INSTALLBASE)/$(UUID)


archive: bin
	cd $(TARGET); zip -qr "$(UUID).zip" *.js metadata.json locale schemas themes


bin: $(SCHEMAS) $(TRANSLATIONS)
	mkdir -p $(TARGET)
	cp $(SRC)/*.js $(TARGET)
	cp $(SRC)/metadata.json $(TARGET)
	cp $(SRC)/schemas/*.xml $(TARGET)/schemas
	mkdir -p $(TARGET)/themes
	cp -r $(SRC)/themes/* $(TARGET)/themes/

