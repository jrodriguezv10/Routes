let server = 'https://raw.githubusercontent.com/jrodriguezv10/Routes/master/linhas';
var map;
var colors = ["#378D3B", "#D22E2E", "#2F3E9E",
    "#1875D1", "#7A1EA1", "#d35400",
    "#16a085", "##666666"
];

var rutaImg = "https://raw.githubusercontent.com/jrodriguezv10/Routes/master/img/markers";
var markersUrl = [rutaImg + "/markerVerde.png", rutaImg + "/markerRojo.png", rutaImg + "/markerAzul.png",
    rutaImg + "/markerCeleste.png", rutaImg + "/markerMorado.png", rutaImg + "/markerNaranja.png",
    rutaImg + "/markerTurquesa.png", rutaImg + "/markerPlomo.png"
];
google.maps.event.addDomListener(window, 'load', initializedMap);
var controllerShape = -1;
var controllerStops = -1;
var showMarkersOnShape = false;
var showShape = true;
var showStops = true;

function initializedMap() {
    var mapCanvas = document.getElementById('map');
    var mapOptions = {
        center: new google.maps.LatLng(-25.383948, -49.246980),
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        scrollwheel: false,
        styles: mapStylesGray
    }

    map = new google.maps.Map(mapCanvas, mapOptions);

    //SETTINGS
    controllerShape = 0; //-1 shows all
    controllerStops = -1; //-1 shows all
    showMarkersOnShape = true; //if some controller is -1, it will be consider false
    showShape = true;
    showStops = false;
    getShapeOf("474");
}

function getShapeOf(linha) {
    $.ajax({
        url: server + '/shapes/Shape' + linha + '.json',
        type: 'GET',
        dataType: "json",
        success: function(response) {
            divideSHP(response);
        },
        error: function(response) {
            reject(Error("Problems getting Shape"));
        }
    });

    $.ajax({
        url: server + '/pontos/Pontos' + linha + '.json',
        type: 'GET',
        dataType: "json",
        success: function(response) {
            divideStops(response);
        },
        error: function(response) {
            reject(Error("Problems getting Stops"));
        }
    });

}

function divideSHP(shape) {
    //getting just the SHP
    var shapes = [];
    $.each(shape, function(i, item) {
        shapes.push(item.SHP);
    });

    var deleteDuplicates = [];
    var shpAndColors = [];

    //remove duplicates
    $.each(shapes, function(i, shp) {
        if ($.inArray(shp, deleteDuplicates) === -1) {
            deleteDuplicates.push(shp);
        }
    });

    console.log(deleteDuplicates);
    //set color and pos
    $.each(deleteDuplicates, function(i, shp) {
        shpAndColors[shp] = i;
    });

    //Set pos in shape SHPs
    $.each(shape, function(i, item) {
        item.POS = shpAndColors[item.SHP];
    });

    var shapesDivided = [];

    $.each(deleteDuplicates, function(i, shp) {
        shapesDivided.push([]);
    });

    $.each(shape, function(i, item) {
        shapesDivided[item.POS].push(item);
    });

    if (showShape) {
        printShape(shapesDivided);
    }

}

function divideStops(stop) {
    //getting just the SHP
    var stops = [];
    $.each(stop, function(i, item) {
        stops.push(item.SENTIDO);
    });


    var deleteDuplicates = [];
    var sentidoAndColors = [];

    //remove duplicates
    $.each(stops, function(i, sentido) {
        if ($.inArray(sentido, deleteDuplicates) === -1) {
            deleteDuplicates.push(sentido);
        }
    });

    console.log(deleteDuplicates);
    //set color and pos
    $.each(deleteDuplicates, function(i, sentido) {
        sentidoAndColors[sentido] = i;
    });



    //Set pos in pontos SENTIDOs
    $.each(stop, function(i, item) {
        item.POS = sentidoAndColors[item.SENTIDO];
    });



    var stopsDivided = [];

    $.each(deleteDuplicates, function(i, stop) {
        stopsDivided.push([]);
    });


    $.each(stop, function(i, item) {
        stopsDivided[item.POS].push(item);
    });


    if (showStops) {
        printStop(stopsDivided);
    }
}

function printShape(shapesDivided) {
    var routeLines = [];
    var routePaths = [];

    $.each(shapesDivided, function(i, shape) {
        routeLines.push([]);
        routePaths.push([]);
    });

    $.each(shapesDivided, function(i, shape) {
        $.each(shape, function(j, shapeUnique) {
            routeLines[shapeUnique.POS].push({
                lat: parseFloat(shapeUnique.LAT.replace(",", ".")),
                lng: parseFloat(shapeUnique.LON.replace(",", "."))
            });
        });
    });

    if (controllerShape == -1) {
        $.each(routeLines, function(testIndex, routeLine) {
            var routePath = new google.maps.Polyline({
                path: routeLines[testIndex],
                geodesic: true,
                strokeColor: colors[testIndex],
                strokeOpacity: 1.0,
                strokeWeight: 2
            });
            routePath.setMap(map);
        });
    } else {
        var routePath = new google.maps.Polyline({
            path: routeLines[controllerShape],
            geodesic: true,
            strokeColor: colors[controllerShape],
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        routePath.setMap(map);
        if(showMarkersOnShape){
          $.each(routeLines[controllerShape], function(i, routeLine) {
            var latLng = new google.maps.LatLng(routeLine.lat, routeLine.lng);
            var marker = new google.maps.Marker({position: latLng});
            marker.addListener('click', function() {
                var contentString = '<div>'+i+'</div>';
                var infowindow = new google.maps.InfoWindow({
                    content: contentString
                });
                infowindow.open(map, marker);
            });
            marker.setMap(map);
          });
        }

    }

}

function printStop(stopsDivided) {

    if (controllerStops == -1) {
        $.each(stopsDivided, function(testIndex, stop) {
            $.each(stopsDivided[testIndex], function(j, item) {
                var latLng = new google.maps.LatLng(
                    item.LAT.replace(",", "."),
                    item.LON.replace(",", ".")
                );
                var iconURL = markersUrl[item.POS];
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

                marker.setMap(map);
            });
        });
    } else {
        $.each(stopsDivided[controllerStops], function(j, item) {
            var latLng = new google.maps.LatLng(
                item.LAT.replace(",", "."),
                item.LON.replace(",", ".")
            );
            var iconURL = markersUrl[item.POS];
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

            marker.setMap(map);
        });
    }



}
