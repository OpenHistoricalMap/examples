/*
 * Copyright (c) 2015, NA Websites
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the name of the <organization> nor the
 *      names of its contributors may be used to endorse or promote products
 *      derived from this software without specific prior written permission.

 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*
 * global variables
 */

var OSMOverpassURL='http://overpass-api.de/api/interpreter';

var OHMOverpassURL='http://overpass.openhistoricalmap.org/api/interpreter';

var mapboxAPIKey='Put MapBox API key here';

var ohmmap;			// global map object

var layerControl;

var styles = [ {"color":"#0000ff", "weight": 5, "opacity":0.65},
	       {"color":"#00cc00", "weight": 5, "opacity":0.65},
	       {"color":"#ff0000", "weight": 5, "opacity":0.65},
	       {"color":"#006699", "weight": 5, "opacity":0.65},
	       {"color":"#ff00ff", "weight": 5, "opacity":0.65},
	       {"color":"#669900", "weight": 5, "opacity":0.65},
	       {"color":"#6600ff", "weight": 5, "opacity":0.65},
	       {"color":"#cc6600", "weight": 5, "opacity":0.65},
	       {"color":"#9900ff", "weight": 5, "opacity":0.65},
	       {"color":"#990099", "weight": 5, "opacity":0.65},
	       {"color":"#cc3300", "weight": 5, "opacity":0.65},
	       {"color":"#ffaa00", "weight": 5, "opacity":0.65}
	     ];
var styleIndex = 0;

var addDate2 = true;

function initOHMv3( minlat, minlon, maxlat, maxlon, zoom, addDate, queryOSM){

    addDate2 = addDate;

    // doesn't work in places where there probably aren't race tracks
    var lat = (minlat + maxlat) / 2;
    var lon = (minlon + maxlon) / 2;

    var osmAttrib='Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, Historic data &copy; <a href="http://openhistoricalmap.org">OpenHistoricalMap</a> contributors';
    var mapboxAttrib=osmAttrib
         + ', Imagery <a href="http://www.mapbox.com/">Mapbox</a>';

    // Mapbox mapbox.streets-satellite
    var mapboxUrl='http://api.tiles.mapbox.com/v4/mapbox.streets-satellite/{z}/{x}/{y}.png?access_token='+mapboxAPIKey;

    // OSM base layer
    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';    

    var layerOSM = new L.TileLayer(osmUrl, {
		minZoom: 5,
		maxZoom: 19, 
		attribution: osmAttrib,
		opacity: 1
    });

    var layerMapbox = new L.TileLayer( mapboxUrl, {
                minZoom: 5,
                maxZoom: 19,
                attribution: mapboxAttrib,
                opacity: 1
    });
	
    // set the starting location for the centre of the map
    var start = new L.LatLng(lat,lon);	
	
    // create the map
    ohmmap = new L.Map('mapdiv', {
                          center: start,
                          zoom: zoom,
		          layers: [layerMapbox, layerOSM]
    });

    var baseMaps
    = { "Mapbox Satellite": layerMapbox, "OpenStreetMap": layerOSM };
    layerControl = L.control.layers( baseMaps, null).addTo( ohmmap);

    // build query and send it

    var OverpassQuery='?data=[out:json];(way[highway=raceway]('+minlat+','+minlon+','+maxlat+','+maxlon+');rel[type="circuit"]('+minlat+','+minlon+','+maxlat+','+maxlon+'););(._;>;);out;';

    var OHMOverpassQuery= OHMOverpassURL + OverpassQuery;
    var OSMOverpassQuery= OSMOverpassURL + OverpassQuery;

    // need to serialize the queries so that the colors used in the
    // labels are sure to match up with the courses
    jQuery.getJSON( OHMOverpassQuery,
                    launchQuery
    ).then(jQuery.getJSON( OSMOverpassQuery,
                           launchQuery));
}

function launchQuery( features, status){

    var nodes = {};
    var ways = {};
    var ways_in_relations = {};

    for ( var i = 0; i < features.elements.length; i++ ){
	if( features.elements[i].type == "node"){
	    nodeToCoordinate( features.elements[i], nodes);
	} else if ( features.elements[i].type == "way"){
	    wayToFeature( features.elements[i], ways, nodes);
	} else if( features.elements[i].type == "relation"){
	    relationToGeoJSONLayer( features.elements[i], ways, nodes, ways_in_relations, addDate2);
        };
    };
    for( var way_id in ways){
	if( !(ways.hasOwnProperty(way_id)
		&& ways_in_relations[way_id])){
	    addGeoJSONLayer( ways[way_id], addDate2);
	}
    }
}

function addGeoJSONLayer( feature, addDate){

    var name = feature.properties.name;
    var startDate = "";
    var endDate = "";
    if( addDate){
	if( feature.properties.start_date){
	    startDate = yearFromDate( feature.properties.start_date);
	}
	if( feature.properties.end_date){
	    endDate = yearFromDate( feature.properties.end_date);
        }
	name = name + " (" + startDate + "-" + endDate + ")";
	console.log(name);
    }
    
    var geojsonLayer
	 = L.geoJson( null,
                      { style: styles[styleIndex],
			onEachFeature:
			    function( feature, layer){
				if( feature.properties
				    && feature.properties.name){
				    layer.bindPopup(
					feature.properties.name);
				}
			    }
                       }
                    ).addTo(ohmmap);
    geojsonLayer.addData( feature, name);
    var color = styles[styleIndex].color;
    var label="<span style='color:"+color+"'>" + name+"</span>";

    layerControl.addOverlay( geojsonLayer, label);
    styleIndex++;
}

function yearFromDate( date){
    return date.substring( 0, 4);
}

function nodeToCoordinate( node, nodes){
    if( node.tags === undefined
	|| node.tags.name === undefined){
        nodes["node/"+node.id] = { "coordinates":[node.lon, node.lat]};
    } else {
        nodes["node/"+node.id] = { "coordinates":[node.lon, node.lat],
			           "name": node.tags.name  };
    }
}

function wayToFeature( way, ways, nodes){
    var way_nodes = [];
    for( var j = 0; j < way.nodes.length; j++){
	way_nodes[j] = nodes["node/"+way.nodes[j]].coordinates;
    }
    var geometry = {
	"type":"LineString",
		"coordinates": way_nodes
		   };
    var feature = {
	"type": "Feature",
	"id": "way/"+way.id,
	"properties":{
	    "@id": "way/"+way.id,
	     "highway":"raceway"
	},
	"geometry":geometry
    };
    if ( ! (way.tags.name === undefined)){
	feature.properties.name = way.tags.name;
    }

    ways["way/"+way.id] = feature;
}

function relationToGeoJSONLayer( relation, ways, nodes, ways_in_relations, addDate){
    console.log( relation);
    var rel_ways = [];
    var rel_ways_index = 0;
    var rel_nodes = [];
    var rel_nodes_index = 0;
    for( var j = 0; j < relation.members.length; j++){
        // TODO handle roles
	if( relation.members[j].type == "way"){
	    var way_id = "way/"+relation.members[j].ref;
	    rel_ways[rel_ways_index++] = ways[way_id];
	    ways_in_relations[way_id] = true;
	} else if( relation.members[j].type = "node"){
	    var node_id = "node/"+relation.members[j].ref;
	    rel_nodes[rel_nodes_index++] = nodes[node_id];
	}
    }
    var featureCollection = {
	"type":"FeatureCollection",
	"generator":"OHM-rt-v2.js",
	"copyright": "The data included in this document is from www.openhistoricalmap.org. The data is made available under ODbL.",
	"features": rel_ways,
	"properties":{
	    "name": relation.tags.name,
	    "end_date": relation.tags.end_date,
	    "start_date":relation.tags.start_date
	}
    };
    addGeoJSONLayer( featureCollection, addDate);
}
