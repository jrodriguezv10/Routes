var server = 'https://raw.githubusercontent.com/jrodriguezv10/Routes/master/tmp';
var loadedShape = false;
var loadedStops = false;
var shape;
var stops;
var map;

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
    getJsonFromServer();
}

function getJsonFromServer() {
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
        if (stopsWay == item.SENTIDO) {
            stopsGo.push(item);
        } else {
            stopsBack.push(item);
        }
    });

    console.log("shapeGo: " + shapeGo.length + " [" + shapeGo[0].SHP + "]");
    console.log("stopsGo: " + stopsGo.length + " [" + stopsGo[0].SENTIDO + "]");
    console.log("shapeBack: " + shapeBack.length + " [" + shapeBack[0].SHP + "]");
    console.log("stopsBack: " + stopsBack.length + " [" + stopsBack[0].SENTIDO + "]");

    printShape(shapeGo, true);
    printStops(stopsGo, true);
    printShape(shapeBack, false);
    printStops(stopsBack, false);

}

/** For test **/
function printShape(shapeTmp, go) {
    var routeLine = [];
    $.each(shapeTmp, function(i, item) {
        routeLine.push({
            lat: parseFloat(item.LAT),
            lng: parseFloat(item.LON)
        });
    });

    var routePath = new google.maps.Polyline({
        path: routeLine,
        geodesic: true,
        strokeColor: go ? '#4caf50' : '#ff9800',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });
    routePath.setMap(map);
}

function printStops(stopsTmp, go) {
    $.each(stopsTmp, function(i, item) {
        createMarker(item, go).setMap(map);
    });
}

function createMarker(item, go) {
    var latLng = new google.maps.LatLng(item.LAT, item.LON);
    var iconURL = go ?
        "http://maps.google.com/mapfiles/ms/icons/red-dot.png" :
        "http://maps.google.com/mapfiles/ms/icons/green-dot.png";

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
