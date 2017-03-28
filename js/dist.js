var server = 'https://raw.githubusercontent.com/jrodriguezv10/Routes/master/tmp';
var loadedShape = false;
var loadedStops = false;
var shape;
var stops;
var map;
let colorGreen = "#4caf50";
let colorRed = "#ff9800";
var radius = 50; //meters -> could be the longest distance beetwen shapePoint / 2
var routeName;

google.maps.event.addDomListener(window, 'load', initialize);

function initialize() {
    var mapCanvas = document.getElementById('map');
    var mapOptions = {
        center: new google.maps.LatLng(-25.383948, -49.246980),
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        scrollwheel: false,
        styles: mapStylesGray
    }

    map = new google.maps.Map(mapCanvas, mapOptions);
    getJsonFromServer("BOA VISTA / BARREIRINHA");
}

function getJsonFromServer(routeNameReceived) {
    routeName = routeNameReceived.toLowerCase().trim();
    $.ajax({
        url: server + '/linha225.json',
        type: 'GET',
        dataType: "json",
        success: function(response) {
            shape = response;
            loadedShape = true;
            if (loadedShape && loadedStops) {
                createJson();
            }
        },
        error: function(response) {
            console.log("Problems getting Shape");
        }
    });

    $.ajax({
        url: server + '/pontos225.json',
        type: 'GET',
        dataType: "json",
        success: function(response) {
            stops = response;
            loadedStops = true;
            if (loadedShape && loadedStops) {
                createJson();
            }
        },
        error: function(response) {
            console.log("Problems getting Stops (pontos)");
        }
    });
}

function createJson() {
    var shapeSHP = shape[0].SHP;
    var stopsWay = stops[0].SENTIDO;

    var shapeGo = [];
    var stopsGo = [];
    var shapeBack = [];
    var stopsBack = [];

    $.each(shape, function(i, item) {
        item.LAT = item.LAT.replace(",", ".");
        item.LON = item.LON.replace(",", ".");
        if (shapeSHP == item.SHP) {
            shapeGo.push(item);
        } else {
            shapeBack.push(item);
        }
    });

    $.each(stops, function(i, item) {
        item.LAT = item.LAT.replace(",", ".");
        item.LON = item.LON.replace(",", ".");
        item.SEQ = parseInt(item.SEQ);
        if (stopsWay != item.SENTIDO) { //TODO change for ==
            stopsGo.push(item);
        } else {
            stopsBack.push(item);
        }
    });

    stopsGo.sort(compare);
    stopsBack.sort(compare);
    //console.log("shapeGo: " + shapeGo.length + " [" + shapeGo[0].SHP + "]");
    //console.log("stopsGo: " + stopsGo.length + " [" + stopsGo[0].SENTIDO + "]");
    //console.log("shapeBack: " + shapeBack.length + " [" + shapeBack[0].SHP + "]");
    //console.log("stopsBack: " + stopsBack.length + " [" + stopsBack[0].SENTIDO + "]");

    printShape(shapeGo, true);
    printStops(stopsGo, true);
    getReferentShapePoint(shapeGo, stopsGo);

    var p1 = new google.maps.LatLng(stops[0].LAT, stops[0].LON);
    var p2 = new google.maps.LatLng(stops[stops.length - 1].LAT, stops[stops.length - 1].LON);
    //console.log("distance: " + distanceBetweenPoints(p1, p2));
    //printShape(shapeBack, false);
    //printStops(stopsBack, false);

}

function getReferentShapePoint(shapeTmp, stopsTmp) {
    var stopIndex = 0;
    var recluting = false;
    var distController = radius + 1;;
    var indexController = -1;

    $.each(shapeTmp, function(i, shapePoint) {
        var shapePointLoc = new google.maps.LatLng(shapePoint.LAT, shapePoint.LON);
        var stopLoc = new google.maps.LatLng(stopsTmp[stopIndex].LAT, stopsTmp[stopIndex].LON);
        distShapeToStop = distanceBetweenPoints(shapePointLoc, stopLoc); //get distance between shape to next stop (stopsTmp[stopIndex])

        if (stopIndex == 0) { //begin
            console.log("add: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
            console.log("shape [" + i + "] is on radius (" + distShapeToStop + "m) for: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
            console.log("---------");
            createMarker2(shapePoint).setMap(map);
            //TODO add first stop
            //TODO add shape
            //TODO mark shape as referente with number stop
            //TODO set distance from stop to shape reference
            //TODO set distance to next shape
            stopIndex++; //next stop
        } else if (stopIndex == stopsTmp.length - 1 && i == shapeTmp.length - 1) { //last stop and last shape
            console.log("add: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
            console.log("shape [" + i + "] is on radius (" + distShapeToStop + "m) for: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
            console.log("---------");
            createMarker2(shapePoint).setMap(map);
            //TODO add shape
            //TODO add last stop
            //TODO mark shape as referente with number stop
            //TODO set distance from shape reference to stop
        } else {
            if (distShapeToStop <= radius) { //radius in meters
                recluting = true;
                if(distShapeToStop < distController){
                  distController = distShapeToStop;
                  indexController = i;
                }
                //TODO add shapePoint
                console.log("shape [" + i + "] is on radius (" + distShapeToStop + "m) for: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
            } else {
                if (recluting) {
                    //make change
                    //TODO determinate nearest shapePoint
                    //TODO add shape
                    //TODO add stop
                    //TODO mark shape as referente with number stop
                    //TODO set distance from shape reference to stop
                    //TODO set distance to next shape
                    console.log("-> goes: " + indexController); //just index, get object
                    createMarker2(shapeTmp[indexController]).setMap(map);
                    distController = radius + 1;
                    indexController = -1;
                    console.log("add: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
                    console.log("---------");
                    stopIndex++; //next stop
                    recluting = false; //
                }
            }
        }
    });

}

/**
 * Calculates the distance between two latlng locations in km.
 * @see http://www.movable-type.co.uk/scripts/latlong.html
 *
 * @param {google.maps.LatLng} p1 The first lat lng point.
 * @param {google.maps.LatLng} p2 The second lat lng point.
 * @return {number} The distance between the two points in km.
 * @private
 */
function distanceBetweenPoints(p1, p2) {
    if (!p1 || !p2) {
        return 0;
    }

    var R = 6371000; // Radius of the Earth in km
    var dLat = (p2.lat() - p1.lat()) * Math.PI / 180;
    var dLon = (p2.lng() - p1.lng()) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return Math.round(d);
};

function compare(a, b) {
    if (a.SEQ < b.SEQ)
        return -1;
    if (a.SEQ > b.SEQ)
        return 1;
    return 0;
}

/** For test **/
function printShape(shapeTmp, go) {
    var routeLine = [];
    $.each(shapeTmp, function(i, item) {
        routeLine.push({
            lat: parseFloat(item.LAT),
            lng: parseFloat(item.LON)
        });
        //createMarker(item, false).setMap(map);
    });

    var routePath = new google.maps.Polyline({
        path: routeLine,
        geodesic: true,
        strokeColor: go ? colorGreen : colorRed,
        strokeOpacity: 1.0,
        strokeWeight: 2
    });
    routePath.setMap(map);
}

function printStops(stopsTmp, go) {
    $.each(stopsTmp, function(i, item) {
        createMarker(item, go).setMap(map);
        printArea(item, go);
    });
}

function createMarker(item, go) {
    var latLng = new google.maps.LatLng(item.LAT, item.LON);
    var iconURL = go ?
        "http://maps.google.com/mapfiles/ms/icons/green-dot.png" :
        "http://maps.google.com/mapfiles/ms/icons/red-dot.png";

    var marker = new google.maps.Marker({
        position: latLng,
        icon: iconURL
    });
    marker.addListener('click', function() {
        var contentString = '<strong>' + item.NOME + '</strong> <br> ' +
            item.SEQ + '<br>' + item.SENTIDO;
        var infowindow = new google.maps.InfoWindow({
            content: contentString
        });
        infowindow.open(map, marker);
    });

    return marker;
}

function printArea(item, go) {
    var cityCircle = new google.maps.Circle({
        strokeColor: go ? colorGreen : colorRed,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: go ? colorGreen : colorRed,
        fillOpacity: 0.35,
        map: map,
        center: {
            lat: parseFloat(item.LAT),
            lng: parseFloat(item.LON)
        },
        radius: radius
    });
}

function createMarker2(item) {
    var latLng = new google.maps.LatLng(item.LAT, item.LON);
    var iconURL = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";

    var marker = new google.maps.Marker({
        position: latLng,
        icon: iconURL
    });
    marker.addListener('click', function() {
        var contentString = '<strong>' + item.NOME + '</strong> <br> ' +
            item.SEQ + '<br>' + item.SENTIDO;
        var infowindow = new google.maps.InfoWindow({
            content: contentString
        });
        infowindow.open(map, marker);
    });

    return marker;
}



//
