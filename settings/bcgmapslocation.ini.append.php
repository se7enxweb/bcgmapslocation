<?php /* #?ini charset="utf-8"?

[GMapsLocationSettings]

# Unique GMaps Key ID
GMapsKey=

# Default Class IDs
LocationClassID=43
LocationHoursClassID=48
LocationEventScheduleClassID=45

# Custom GMaps Location Point Icon
# LocationIconUrl=http://sfarchdiocese.org/media/images/mymaps-icons/parishes-gmarker.png
# LocationIconUrl=http://www.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png
LocationIconUrl=disabled

# Display Optional Location Hours Information
# LocationDisplayHours=enabled
LocationDisplayHours=disabled

# Display Additional Location Map Links
# LocationDisplayMapLinks=disabled
LocationDisplayMapLinks=enabled

# Default GMaps Zoom Level
DefaultMapZoomInt=10

# Default GMaps Click Zoom Level
DefaultMapClickZoomInt=11


[MapSettings]
# The map of many points (design:bcgmapslocation/map.tpl, javascript/bcgmapslocation-map.js).
# Provider: auto (Google Maps when [GMapsLocationSettings] GMapsKey is set, else OpenStreetMap), google or osm.
Provider=auto
# Google Maps: a Map ID (Google Cloud console) shows the current Advanced Markers; without one the classic markers.
GoogleMapId=
# OpenStreetMap through Leaflet: the tile address and the attribution its tile policy requires.
LeafletVersion=1.9.4
TileURL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
TileAttribution=&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors
*/ ?>