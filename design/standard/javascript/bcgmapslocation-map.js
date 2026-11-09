/**
 * bcgmapslocation 1.1: turns every .bcgmaps (design:bcgmapslocation/map.tpl) into a map of its points.
 * Google Maps (data-provider="google", data-key) or OpenStreetMap through Leaflet (data-provider="osm"). The points
 * are the list items of .bcgmaps-points (data-lat, data-lng, data-highlight); the highlighted one gets a bigger marker
 * and its info box open from the start. With data-center-lat/-lng/data-zoom the map opens there, else it fits every
 * point. The map script is loaded only when a map is on the page. No inline script or style is needed.
 *
 * @license GNU General Public License v2.0 (or any later version)
 */
(function () {
    'use strict';

    var loaded = {};

    function script(src) {
        if (!loaded[src]) {
            loaded[src] = new Promise(function (resolve, reject) {
                var s = document.createElement('script');
                s.src = src;
                s.async = true;
                s.onload = resolve;
                s.onerror = reject;
                document.head.appendChild(s);
            });
        }
        return loaded[src];
    }

    function stylesheet(href) {
        if (document.querySelector('link[href="' + href + '"]')) return;
        var l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        document.head.appendChild(l);
    }

    function points(el) {
        return Array.prototype.map.call(el.querySelectorAll('.bcgmaps-points li[data-lat]'), function (li) {
            return {
                lat: parseFloat(li.getAttribute('data-lat')),
                lng: parseFloat(li.getAttribute('data-lng')),
                html: li.innerHTML,
                title: li.textContent.replace(/\s+/g, ' ').trim(),
                highlight: li.getAttribute('data-highlight') === '1'
            };
        }).filter(function (p) { return isFinite(p.lat) && isFinite(p.lng); });
    }

    function center(el) {
        var lat = parseFloat(el.getAttribute('data-center-lat')), lng = parseFloat(el.getAttribute('data-center-lng'));
        var zoom = parseInt(el.getAttribute('data-zoom'), 10) || 4, small = parseInt(el.getAttribute('data-zoom-small'), 10);
        // a narrow map (a phone) may open one step further out, so the same area fits
        if (isFinite(small) && el.clientWidth < 600) zoom = small;
        return isFinite(lat) && isFinite(lng) ? { lat: lat, lng: lng, zoom: zoom } : null;
    }

    function leaflet(el, canvas, pts) {
        var base = 'https://unpkg.com/leaflet@' + (el.getAttribute('data-leaflet') || '1.9.4') + '/dist/';
        stylesheet(base + 'leaflet.css');
        return script(base + 'leaflet.js').then(function () {
            var L = window.L, c = center(el), open = null;
            // a narrow map (a phone): the open info box may move the map a little so it stays inside; a wide one keeps its view
            var narrow = canvas.clientWidth < 600;
            var map = L.map(canvas, { scrollWheelZoom: false });
            // the view first: markers can only be drawn (and brought to the front) on a map that has one
            if (c) map.setView([c.lat, c.lng], c.zoom);
            else map.fitBounds(pts.map(function (p) { return [p.lat, p.lng]; }), { padding: [30, 30], maxZoom: 10 });
            L.tileLayer(el.getAttribute('data-tiles') || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: el.getAttribute('data-attribution') || '&copy; OpenStreetMap contributors', maxZoom: 18
            }).addTo(map);
            pts.forEach(function (p) {
                var m = L.circleMarker([p.lat, p.lng], {
                    radius: p.highlight ? 12 : 7, weight: 2,
                    className: 'bcgmaps-marker' + (p.highlight ? ' bcgmaps-marker-highlight' : '')
                }).addTo(map).bindPopup(p.html, { autoPan: narrow, autoPanPadding: [12, 12], maxWidth: narrow ? Math.max(160, canvas.clientWidth - 90) : 300, className: 'bcgmaps-popup' });
                if (p.highlight) open = m;
            });
            if (open) { open.bringToFront(); open.openPopup(); }
        });
    }

    function google(el, canvas, pts) {
        var cb = '__bcgmapsReady';
        var ready = new Promise(function (resolve) {
            if (window.google && window.google.maps && window.google.maps.Map) { resolve(); return; }
            var previous = window[cb];
            window[cb] = function () { if (previous) previous(); resolve(); };
        });
        script('https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(el.getAttribute('data-key')) +
               '&loading=async&v=weekly&libraries=marker&callback=' + cb);
        return ready.then(function () {
            var g = window.google.maps, c = center(el), mapId = el.getAttribute('data-map-id') || '';
            var opts = { gestureHandling: 'cooperative', streetViewControl: false, mapTypeControl: false };
            if (mapId) opts.mapId = mapId;
            if (c) { opts.center = { lat: c.lat, lng: c.lng }; opts.zoom = c.zoom; }
            var map = new g.Map(canvas, opts), info = new g.InfoWindow({ disableAutoPan: true }), bounds = new g.LatLngBounds();
            pts.forEach(function (p) {
                var pos = { lat: p.lat, lng: p.lng }, marker;
                if (mapId && g.marker && g.marker.AdvancedMarkerElement) {
                    var pin = new g.marker.PinElement({ scale: p.highlight ? 1.5 : 1 });
                    marker = new g.marker.AdvancedMarkerElement({ map: map, position: pos, title: p.title, content: pin.element, zIndex: p.highlight ? 10 : 1 });
                    marker.addListener('click', function () { info.setContent(p.html); info.open({ map: map, anchor: marker }); });
                } else {
                    marker = new g.Marker({ map: map, position: pos, title: p.title, zIndex: p.highlight ? 10 : 1 });
                    marker.addListener('click', function () { info.setContent(p.html); info.open({ map: map, anchor: marker }); });
                }
                bounds.extend(pos);
                if (p.highlight) { info.setContent(p.html); info.open({ map: map, anchor: marker }); }
            });
            if (!c && pts.length) map.fitBounds(bounds, 30);
        });
    }

    function init() {
        Array.prototype.forEach.call(document.querySelectorAll('.bcgmaps[data-bcgmaps]'), function (el) {
            var canvas = el.querySelector('.bcgmaps-canvas'), pts = points(el);
            if (!canvas || !pts.length) return;
            var run = el.getAttribute('data-provider') === 'google' && el.getAttribute('data-key') ? google : leaflet;
            run(el, canvas, pts).then(function () { el.classList.add('bcgmaps-ready'); })
                .catch(function (e) { el.classList.add('bcgmaps-failed'); if (window.console) console.error('bcgmapslocation: the map could not be shown', e); });
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
