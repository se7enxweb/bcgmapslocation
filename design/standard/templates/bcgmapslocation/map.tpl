{* A map of many points (bcgmapslocation 1.2). The points are a plain list (readable without JavaScript and by screen
   readers); javascript/bcgmapslocation-map.js turns it into a map: Google Maps when bcgmapslocation.ini
   [GMapsLocationSettings] GMapsKey is set (and [MapSettings] Provider is auto or google), else OpenStreetMap through
   Leaflet. One point may be highlighted: it gets a bigger marker and its info box is open from the start.

   Params:
     map_points  array of hash( 'lat', 'lng', 'title', 'url' (optional), 'text' (optional), 'highlight' (optional),
                 'html' (optional: the item's own markup, escaped by the calling template, instead of title/url/text) )
     map_center  hash( 'lat', 'lng' ) (optional; default: fit every point)
     map_zoom    int (optional, with map_center)
     map_zoom_small  int (optional): the zoom on a narrow map (under 600 px wide), e.g. one step out
     map_label   the map's accessible name (default "Map")
     map_class   extra class names (optional)
     map_numbered  true(): each marker shows its place in the list (1, 2, 3 ...)
     map_route     true(): a line through the points in their order (a tour route)
     map_panel     true(): the list stays visible as a panel; a click on an item flies the map to it and opens its box
   An element with data-bcgmaps-distance next to the map (in its parent) gets the route's length in miles.

   Example: a point of a node's bcgmapslocation attribute:
     hash( 'lat', $node.data_map.location.content.latitude, 'lng', $node.data_map.location.content.longitude,
           'title', $node.name, 'url', $node.url_alias|ezurl( 'no' ), 'highlight', true() ) *}
{def $bm_ini_key = ezini( 'GMapsLocationSettings', 'GMapsKey', 'bcgmapslocation.ini' )
     $bm_provider = ezini( 'MapSettings', 'Provider', 'bcgmapslocation.ini' )
     $bm_points = cond( is_set( $map_points ), $map_points, array() )}
{if $bm_provider|eq( 'auto' )}{set $bm_provider = cond( $bm_ini_key|ne( '' ), 'google', 'osm' )}{/if}
{* Leaflet from the copy this extension ships (design/standard/lib/leaflet-<LeafletVersion>/), unless LeafletSource=cdn:
   its folder, found through the design like any other file (the address of leaflet.js less the file name) *}
{def $bm_leaflet_base = ''}
{if and( $bm_provider|ne( 'google' ), ezini( 'MapSettings', 'LeafletSource', 'bcgmapslocation.ini' )|ne( 'cdn' ) )}{set $bm_leaflet_base = concat( 'lib/leaflet-', ezini( 'MapSettings', 'LeafletVersion', 'bcgmapslocation.ini' ), '/leaflet.js' )|ezdesign( 'no' )}{set $bm_leaflet_base = $bm_leaflet_base|extract_left( sub( $bm_leaflet_base|count_chars, 10 ) )}{/if}
{if and( $bm_provider|eq( 'google' ), $bm_ini_key|eq( '' ) )}{set $bm_provider = 'osm'}{/if}
<div class="bcgmaps{if is_set( $map_class )} {$map_class|wash}{/if}" data-bcgmaps="1" data-provider="{$bm_provider|wash}"{if and( is_set( $map_numbered ), $map_numbered )} data-numbered="1"{/if}{if and( is_set( $map_route ), $map_route )} data-route="1"{/if}{if and( is_set( $map_panel ), $map_panel )} data-panel="1"{/if}
     {if $bm_provider|eq( 'google' )}data-key="{$bm_ini_key|wash}" data-map-id="{ezini( 'MapSettings', 'GoogleMapId', 'bcgmapslocation.ini' )|wash}"{else}data-tiles="{ezini( 'MapSettings', 'TileURL', 'bcgmapslocation.ini' )|wash}" data-attribution="{ezini( 'MapSettings', 'TileAttribution', 'bcgmapslocation.ini' )|wash}" data-leaflet="{ezini( 'MapSettings', 'LeafletVersion', 'bcgmapslocation.ini' )|wash}"{if $bm_leaflet_base} data-leaflet-base="{$bm_leaflet_base|wash}"{/if}{/if}
     {if and( is_set( $map_center ), is_set( $map_center.lat ), is_set( $map_center.lng ) )}data-center-lat="{$map_center.lat|wash}" data-center-lng="{$map_center.lng|wash}" data-zoom="{cond( is_set( $map_zoom ), $map_zoom, 4 )|wash}"{if is_set( $map_zoom_small )} data-zoom-small="{$map_zoom_small|wash}"{/if}{/if}>
    <div class="bcgmaps-canvas" role="region" aria-label="{cond( is_set( $map_label ), $map_label, 'Map' )|wash}"></div>
    <ul class="bcgmaps-points">
    {foreach $bm_points as $bm_p}
        {if and( is_set( $bm_p.lat ), is_set( $bm_p.lng ), $bm_p.lat|ne( '' ), $bm_p.lng|ne( '' ) )}
        <li data-lat="{$bm_p.lat|wash}" data-lng="{$bm_p.lng|wash}"{if and( is_set( $bm_p.highlight ), $bm_p.highlight )} data-highlight="1"{/if}>{if is_set( $bm_p.html )}{$bm_p.html}{else}{if and( is_set( $bm_p.url ), $bm_p.url )}<a href="{$bm_p.url|wash}">{$bm_p.title|wash}</a>{else}<strong>{$bm_p.title|wash}</strong>{/if}{if and( is_set( $bm_p.text ), $bm_p.text )}<span class="bcgmaps-text">{$bm_p.text|wash}</span>{/if}{/if}</li>
        {/if}
    {/foreach}
    </ul>
</div>
{run-once}
<link rel="stylesheet" href={'stylesheets/bcgmapslocation-map.css'|ezdesign}>
<script src={'javascript/bcgmapslocation-map.js'|ezdesign} defer></script>
{/run-once}
{undef $bm_ini_key $bm_provider $bm_points $bm_leaflet_base}
