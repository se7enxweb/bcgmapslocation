<?php /* #?ini charset="utf-8"?

[location_line]
Source=node/view/line.tpl
MatchFile=line/location.tpl
Subdir=templates
Match[class_identifier]=location

[location_event_schedule_line]
Source=node/view/line.tpl
MatchFile=line/location_event_schedule.tpl
Subdir=templates
Match[class_identifier]=location_event_schedule

[location_hours_line]
Source=node/view/line.tpl
MatchFile=line/location_hours.tpl
Subdir=templates
Match[class_identifier]=location_hours

[location_container_full]
Source=node/view/full.tpl
MatchFile=location_container.tpl
Subdir=templates
Match[class_identifier]=location_container

[location_full]
Source=node/view/full.tpl
MatchFile=location.tpl
Subdir=templates
Match[class_identifier]=location

# The original demo site showed its map page through object 164 ([location_gmaps_include], location_gmaps.tpl).
# Object 164 is an unrelated page on any other site, and the template is only in the admin design, so the rule
# logged "path 'location_gmaps.tpl' not found" on every front page. Point a page of your own at it like this,
# in your own siteaccess override.ini:
#[location_gmaps_include]
#Source=node/view/full.tpl
#MatchFile=location_gmaps.tpl
#Subdir=templates
#Match[object]=<your map page's object id>

#[locations_full]
#Source=node/view/full.tpl
#MatchFile=locations.tpl
#Subdir=templates
## Match[class_identifier]=folder
## Match[object]=164

*/ ?>