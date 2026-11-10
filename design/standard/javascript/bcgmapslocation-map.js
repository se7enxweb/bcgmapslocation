/**
 * bcgmapslocation 1.2: turns every .bcgmaps (design:bcgmapslocation/map.tpl) into a map of its points.
 * Google Maps (data-provider="google", data-key) or OpenStreetMap through Leaflet (data-provider="osm"). The points
 * are the list items of .bcgmaps-points (data-lat, data-lng, data-highlight); the highlighted one gets a bigger marker
 * and its info box open from the start. With data-center-lat/-lng/data-zoom the map opens there, else it fits every
 * point. Options (map.tpl): data-numbered (each marker shows its place in the list), data-route (a line through the
 * points in their order), data-panel (the list stays visible as a panel: a click on an item flies the map to its
 * point and opens its box, a click on a marker marks its item). An element [data-bcgmaps-distance] inside the map
 * (in the map or next to it: its parent) gets the route's length in miles. The map script is loaded only when a map is on the page; no inline script or
 * style is needed.
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
        return Array.prototype.map.call(el.querySelectorAll('.bcgmaps-points li[data-lat]'), function (li, i) {
            return {
                li: li,
                n: i + 1,
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
        if (isFinite(small) && el.querySelector('.bcgmaps-canvas').clientWidth < 600) zoom = small;
        return isFinite(lat) && isFinite(lng) ? { lat: lat, lng: lng, zoom: zoom } : null;
    }

    /** The route's length in miles (great-circle legs between consecutive points) */
    function miles(pts) {
        var r = 3958.8, total = 0, rad = Math.PI / 180;
        for (var i = 1; i < pts.length; i++) {
            var a = pts[i - 1], b = pts[i];
            var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
            var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
            total += 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
        }
        return Math.round(total);
    }

    /** The panel: an item click opens its point; the opened point marks its item */
    function panel(el, pts, open) {
        var on = el.getAttribute('data-panel') === '1';
        function mark(p) {
            pts.forEach(function (q) { q.li.classList.toggle('is-active', q === p); });
            if (on && p.li.scrollIntoView && el.classList.contains('bcgmaps-ready')) {
                var list = p.li.parentNode, top = p.li.offsetTop - list.offsetTop;
                if (top < list.scrollTop || top > list.scrollTop + list.clientHeight - p.li.offsetHeight) list.scrollTop = top - 8;
            }
        }
        if (on) {
            pts.forEach(function (p) {
                p.li.setAttribute('tabindex', '0');
                p.li.setAttribute('role', 'button');
                function go(e) {
                    if (e.target.closest && e.target.closest('a')) return; // a link in the item still navigates
                    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    open(p, true);
                    mark(p);
                }
                p.li.addEventListener('click', go);
                p.li.addEventListener('keydown', go);
            });
        }
        return mark;
    }

    function leaflet(el, canvas, pts) {
        // the copy of Leaflet the extension ships (data-leaflet-base, bcgmapslocation.ini [MapSettings] LeafletSource=local),
        // else the public CDN (LeafletSource=cdn)
        var base = el.getAttribute('data-leaflet-base') || ('https://unpkg.com/leaflet@' + (el.getAttribute('data-leaflet') || '1.9.4') + '/dist/');
        stylesheet(base + 'leaflet.css');
        return script(base + 'leaflet.js').then(function () {
            var L = window.L, c = center(el), first = null, markers = [];
            var numbered = el.getAttribute('data-numbered') === '1';
            // a narrow map (a phone): the open info box may move the map a little so it stays inside; a wide one keeps its view
            var narrow = canvas.clientWidth < 600;
            var map = L.map(canvas, { scrollWheelZoom: false });
            // the view first: markers can only be drawn (and brought to the front) on a map that has one
            if (c) map.setView([c.lat, c.lng], c.zoom);
            else map.fitBounds(pts.map(function (p) { return [p.lat, p.lng]; }), { padding: [30, 30], maxZoom: 10 });
            L.tileLayer(el.getAttribute('data-tiles') || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: el.getAttribute('data-attribution') || '&copy; OpenStreetMap contributors', maxZoom: 18
            }).addTo(map);
            if (el.getAttribute('data-route') === '1' && pts.length > 1) {
                L.polyline(pts.map(function (p) { return [p.lat, p.lng]; }), { className: 'bcgmaps-route', weight: 3, dashArray: '6 8' }).addTo(map);
            }
            var popupOptions = { autoPan: narrow, autoPanPadding: [12, 12], maxWidth: narrow ? Math.max(160, canvas.clientWidth - 90) : 300, className: 'bcgmaps-popup' };
            var mark = panel(el, pts, function (p, fly) {
                var m = markers[pts.indexOf(p)];
                if (fly) map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 6), { duration: 0.8 });
                m.openPopup();
            });
            pts.forEach(function (p) {
                var m;
                if (numbered) {
                    m = L.marker([p.lat, p.lng], {
                        title: p.title, riseOnHover: true, zIndexOffset: p.highlight ? 1000 : 0,
                        icon: L.divIcon({ className: 'bcgmaps-pin' + (p.highlight ? ' bcgmaps-pin-highlight' : ''),
                                          html: '<span>' + p.n + '</span>', iconSize: p.highlight ? [38, 38] : [28, 28] })
                    });
                } else {
                    m = L.circleMarker([p.lat, p.lng], { radius: p.highlight ? 12 : 7, weight: 2,
                        className: 'bcgmaps-marker' + (p.highlight ? ' bcgmaps-marker-highlight' : '') });
                }
                m.addTo(map).bindPopup(p.html, popupOptions).on('popupopen', function () { mark(p); });
                markers.push(m);
                if (p.highlight && !first) first = m;
            });
            if (first) { if (first.bringToFront) first.bringToFront(); first.openPopup(); }
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
            var numbered = el.getAttribute('data-numbered') === '1', markers = [];
            var opts = { gestureHandling: 'cooperative', streetViewControl: false, mapTypeControl: false };
            if (mapId) opts.mapId = mapId;
            if (c) { opts.center = { lat: c.lat, lng: c.lng }; opts.zoom = c.zoom; }
            var map = new g.Map(canvas, opts), info = new g.InfoWindow({ disableAutoPan: canvas.clientWidth >= 600 }), bounds = new g.LatLngBounds();
            if (el.getAttribute('data-route') === '1' && pts.length > 1) {
                new g.Polyline({ map: map, path: pts.map(function (p) { return { lat: p.lat, lng: p.lng }; }), strokeOpacity: 0,
                                 icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.9, scale: 3 }, offset: '0', repeat: '14px' }] });
            }
            var mark = panel(el, pts, function (p, fly) {
                var m = markers[pts.indexOf(p)];
                if (fly) { map.panTo({ lat: p.lat, lng: p.lng }); if (map.getZoom() < 6) map.setZoom(6); }
                info.setContent(p.html);
                info.open({ map: map, anchor: m });
                mark(p);
            });
            pts.forEach(function (p) {
                var pos = { lat: p.lat, lng: p.lng }, marker;
                if (mapId && g.marker && g.marker.AdvancedMarkerElement) {
                    var pin = new g.marker.PinElement({ scale: p.highlight ? 1.5 : 1, glyph: numbered ? String(p.n) : undefined });
                    marker = new g.marker.AdvancedMarkerElement({ map: map, position: pos, title: p.title, content: pin.element, zIndex: p.highlight ? 10 : 1 });
                } else {
                    marker = new g.Marker({ map: map, position: pos, title: p.title, zIndex: p.highlight ? 10 : 1, label: numbered ? String(p.n) : undefined });
                }
                marker.addListener('click', function () { info.setContent(p.html); info.open({ map: map, anchor: marker }); mark(p); });
                markers.push(marker);
                bounds.extend(pos);
            });
            if (!c && pts.length) map.fitBounds(bounds, 30);
            pts.forEach(function (p, i) { if (p.highlight) { info.setContent(p.html); info.open({ map: map, anchor: markers[i] }); mark(p); } });
        });
    }

    function init() {
        Array.prototype.forEach.call(document.querySelectorAll('.bcgmaps[data-bcgmaps]'), function (el) {
            var canvas = el.querySelector('.bcgmaps-canvas'), pts = points(el);
            if (!canvas || !pts.length) return;
            // the route's length, for an element next to the map (the map's parent) or inside it
            Array.prototype.forEach.call((el.parentNode || el).querySelectorAll('[data-bcgmaps-distance]'), function (d) { d.textContent = miles(pts).toLocaleString('en-US'); });
            var run = el.getAttribute('data-provider') === 'google' && el.getAttribute('data-key') ? google : leaflet;
            run(el, canvas, pts).then(function () { el.classList.add('bcgmaps-ready'); })
                .catch(function (e) { el.classList.add('bcgmaps-failed'); if (window.console) console.error('bcgmapslocation: the map could not be shown', e); });
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
