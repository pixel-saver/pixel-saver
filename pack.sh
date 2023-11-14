#!/bin/bash

function pack {
    cd $1@deadalnix.me
    zip ../$1.zip -r *
    cd ..
    zip $1.zip -ur themes
}

pack pixel-saver
pack pixel-saver-g45
