/*
 * global variables
 */
var ohmmap;			// global map object
var layerOSM;			// current OSM
var layerOHM;		        // OHM

function initOHM( lat, lon, zoom) {	
	// set up the jQuery UI slider
	$("#sliderohm").slider(
		{
			min:0,
			max:100,
			value:75,
			change:slideOhm
		});
	
	// base layers
	var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';    
	var osmAttrib='Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
	
	layerOSM = new L.TileLayer(osmUrl, {
		minZoom: 10,
		maxZoom: 19, 
		attribution: osmAttrib,
		opacity: 1
	});
	
        // Mapbox mapbox.satellite
        var mapboxAPIkey='Put MapBox API key here';
        var mapboxUrl='http://api.tiles.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=' + mapboxAPIkey;
        var mapboxAttrib=osmAttrib+ ', Imagery <a href="http://www.mapbox.com/">Mapbox</a>';
        // Mapbox base layer
        var layerMapbox = new L.TileLayer( mapboxUrl, {
                    minZoom: 5,
                    maxZoom: 19,
                    attribution: mapboxAttrib,
                    opacity: 1
        });


	// OHM layer
	var UrlOHM='http://www.openhistoricalmap.org/ohm_tiles/{z}/{x}/{y}.png';    
//	var AttribOHM='Map data &copy; <a href="http://openhistoricalmap.org">OpenHistoricalMap</a> contributors';
	var AttribOHM='<a href="http://openhistoricalmap.org">OpenHistoricalMap</a> contributors';
	
	layerOHM = new L.TileLayer(UrlOHM, {
		minZoom:13,
		maxZoom:19,
		attribution: AttribOHM,
		opacity: 0.75
	});
	
	// set the starting location for the centre of the map
//	var start = new L.LatLng(42.62179,-73.58084);	
	var start = new L.LatLng(lat,lon);	
	

	// create the map
	ohmmap = new L.Map('mapdiv', {		// use the div called mapdiv
		center: start,				// centre the map as above
		zoom: zoom,					// start up zoom level
		layers: [layerOHM, layerMapbox, layerOSM]	// layers to add 
	});
        var baseMaps
        = { "OpenStreetMap": layerOSM,"Mapbox Satellite": layerMapbox };
	var historicMaps = { "OHM": layerOHM};
        layerControl = L.control.layers( baseMaps, historicMaps).addTo( ohmmap);

	layerMapbox.setZIndex(0);
	layerOSM.setZIndex(1);
	layerOHM.setZIndex(2);


	// create the hash url on the browser address line
//	var hash = new L.Hash(ohmmap);
}

function slideOhm() {
	var v=$("#sliderohm").slider("value");
	var o=v/100;
	layerOHM.setOpacity(o);
}
