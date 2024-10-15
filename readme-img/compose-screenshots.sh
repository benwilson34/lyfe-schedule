#!/usr/bin/env bash

# must have ImageMagick installed
magick montage calendar-view_1b9291ce.png add-edit-dialog_1b9291ce.png -tile 2x1 -background "#00000000" -geometry +20+0 screenshots.png
