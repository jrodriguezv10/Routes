//let server = 'https://raw.githubusercontent.com/jrodriguezv10/Routes/master/tmp';

//let server = 'tmp';
//let server = 'https://jrodriguez.aerobatic.io/tmp'

//let colorGreen = "#4caf50";
//let colorRed = "#ff9800";
//let radius = 50; //meters

var colores = ["#378D3B", "#D22E2E", "#2F3E9E",
                "#1875D1",  "#7A1EA1", "#d35400",
                "#16a085", "##666666"];

var coloresBack = ["#4BAE4F", "#F34235", "#3E50B4",
                "#2095F2",  "#9B26AF", "#f39c12",
                "#16a085", "#CCCCCC"];

var rutaImg = "img/markers/";
//var rutaImg = "https://jrodriguez.aerobatic.io/img/markers";
var markersUrl = [rutaImg+"/markerVerde.png", rutaImg+"/markerRojo.png", rutaImg+"/markerAzul.png",
                 rutaImg+"/markerCeleste.png", rutaImg+"/markerMorado.png", rutaImg+"/markerNaranja.png",
                 rutaImg+"/markerTurquesa.png", rutaImg+"/markerPlomo.png"];

var markersUrlBack = [rutaImg+"/markerVerdeC.png", rutaImg+"/markerRojoC.png", rutaImg+"/markerAzulC.png",
                 rutaImg+"/markerCelesteC.png", rutaImg+"/markerMoradoC.png", rutaImg+"/markerNaranjaC.png",
                rutaImg+"/markerTurquesa.png", rutaImg+"/markerPlomo.png"];

var loadedShape = false;
var loadedStops = false;

var map;
var routeName;
var jsonResponse = {
    success: true,
    points: []
}


var shape;
var stops; 

var condicionIgual = [];
var condicionDiferente = [];
/*var condicionIgual = ["001", "002", "150", "169", "181", "182","208","216","256","260","265","303","308","322","332","335",
                        "338","342","343","365","366","373","380"];
var condicionDiferente = ["050", "160", "171", "183","204","205","210","211","212","213","225","236","266","285","304","305",
                            "309","336","360","370","372","385","386","387",
                            "307","311","341","375","040","165","166","167","168","170","175","201","203","226",
                            "232","244","270","271","272","274","280","224","233","334","010","011","020","021",
                            "022","023","024","164","176","180","184","188","189","207","209","222","229","231",
                            "242","243","245","302","306","331","340","378","389","393","323","060","321","361",
                            "371","374","030"];
*/


google.maps.event.addDomListener(window, 'load', initialize);

/*var parameters = getParameterByName('key');
var key = parameters.split(",");*/
       

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}


function initialize() {

     $('#linhaSelector').multiselect({
        columns: 1,
        placeholder: 'Selecionar linha de ônibus',
        search: true
    });
    
    var mapCanvas = document.getElementById('map');
    var mapOptions = {
        center: new google.maps.LatLng(-25.4497026,-49.2677798),
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        scrollwheel: false,
        styles: mapStylesGray
    }

    map = new google.maps.Map(mapCanvas, mapOptions);

}


function printStops(stopsTmp, go, contKey) {
    $.each(stopsTmp, function(i, item) {
        createMarker(item, go,contKey).setMap(map);
        printArea(item, go, contKey);
    });
}

$(document).keydown(function(event) {
    
    if(event.keyCode==13){
        redirecPage(); 
    }
});

var key;
var cantSelected = 0;
var maxSelected = 8;

function redirecPage(){
    $("#setting-container").fadeIn();
     cantSelected = $('#linhaSelector :selected').length;
    key = $('#linhaSelector').val();

    $('#routes').empty();

    var mapCanvas = document.getElementById('map');
    var mapOptions = {
        center: new google.maps.LatLng(-25.4497026,-49.2677798),
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        scrollwheel: false,
        styles: mapStylesGray
    }
    map = new google.maps.Map(mapCanvas, mapOptions);

    
    if (key == null || key.length==0) {
        $("#setting-container").fadeOut();
        swal("Selecione uma linha.","","warning");

    } else if (cantSelected > 0) {
    
       var contKey = 0;
       for ( contKey; contKey < key.length; contKey++) {
            
           getJsonFromPoint(contKey);
           getJsonFromRoute(contKey); 
        }

        for(var i=0; i< key.length; i++ ){
            var tipo = false;
            $.each(condicionIgual, function(j, item){

                if (item == key[i]) {
                    tipo = true;
                    return false;
                }
                
            });

            if (tipo != true) {
                $.each(condicionDiferente, function(j, item){
                    if (item == key[i]) {
                        tipo = false;
                        return false;
                    }
                    
                });
            }

            getDataRuta(key[i],tipo,key[i], i).then(function(response){
                printLegend(response, i);
            })
            .catch(function(err){

            })
        }
    
    
    }

    
}


function getJsonFromPoint(contKey) {
     $.ajax({
        url: server + '/pontos/Pontos' + key[contKey] + '.json',
        type: 'GET',
        dataType: "json",
        success: function(response) {
            stops = response;
            if (stops) {
                createJsonPoint(contKey);
            }
        },
        error: function(response) {
            console.log("Problems getting Stops (pontos)");
        }
    });
}


function createJsonPoint(contKey) {
    
    var stopsWay = stops[0].SENTIDO;
    var stopsGo = [];
    var stopsBack = [];


    var tipo="";
    //Stops
    $.each(condicionIgual, function(i, item){
        if (item == key[contKey]) {
            tipo = "IGUAL";
            return false;
        }
        
    });

    if (tipo != "IGUAL") {
        $.each(condicionDiferente, function(i, item){
            if (item == key[contKey]) {
                tipo = "DIFERENTE";
                return false;
            }
            
        });
    }

    $.each(stops, function(i, item) {
        item.LAT = item.LAT.replace(",", ".");
        item.LON = item.LON.replace(",", ".");
        item.SEQ = parseInt(item.SEQ);

        if(tipo == "IGUAL"){
            if (stopsWay == item.SENTIDO) { 
                stopsGo.push(item);
            } else {
              stopsBack.push(item);
            }
        } else if (tipo == "DIFERENTE") {
             if (stopsWay != item.SENTIDO) { 
                stopsGo.push(item);
            } else {
                stopsBack.push(item);
            }
        }
    });


    if(stopsBack.length>0){
        stopsGo.sort(compare);
        stopsBack.sort(compare);
    }else{
         stopsGo.sort();
    }
    

    console.log("=====================");
    console.log("stopsGo: " + stopsGo.length);
    console.log("=====================");
    console.log("stopsBack: " + stopsBack.length);
    console.log("=====================");
 
    printStops(stopsGo, true, contKey);
    printStops(stopsBack, false,  contKey);
   
}

function getJsonFromRoute(contKey) {

    $.ajax({
        url: server + '/shapes/Shape' + key[contKey] + '.json',
        type: 'GET',
        dataType: "json",
        success: function(response) {
            shape = response;
            if (shape) {
                createJsonRoute(contKey);
            }
        },
        error: function(response) {
            console.log("Problems getting Shape");
        }
    });

}


function createJsonRoute(contKey) {
    var shapeSHP = shape[0].SHP;
    var shapeGo = [];
    var shapeBack = [];

    //Shapes
    $.each(shape, function(i, item) {
        item.LAT = item.LAT.replace(",", ".");
        item.LON = item.LON.replace(",", ".");
        if (shapeSHP == item.SHP) {
            shapeGo.push(item);
        } else {
            shapeBack.push(item);
        }
    });

    
    console.log("=====================");
    console.log("shapeGo: " + shapeGo.length);
    console.log("=====================");
    console.log("shapeBack: " + shapeBack.length);
    console.log("=====================");

    printShape(shapeGo, true, contKey);
    printShape(shapeBack, false, contKey);   
}



function getReferentShapePointBack(shapeTmp, stopsTmp) {
    var stopIndex = 0;
    var recluting = false;
    var distController = radius + 1;
    var indexController = -1;

    $.each(shapeTmp, function(i, shapePoint) {
        
        var shapePointLoc = new google.maps.LatLng(shapePoint.LAT, shapePoint.LON);
        var stopLoc = new google.maps.LatLng(stopsTmp[stopIndex].LAT, stopsTmp[stopIndex].LON);
        distShapeToStop = distanceBetweenPoints(shapePointLoc, stopLoc); //get distance between shape to next stop (stopsTmp[stopIndex])

        if (stopIndex == stopsTmp.length - 1 && i == shapeTmp.length - 1) { //last stop and last shape
            //console.log("add: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
            //console.log("shape [" + i + "] is on radius (" + distShapeToStop + "m) for: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
            //console.log("---------");
            //createMarker2(shapePoint).setMap(map);
            //TODO add shape
            addShapePoint(shapePoint, 0);
            createMarker2(shapePoint, stopsTmp[stopIndex].NOME, distShapeToStop).setMap(map);
            //TODO add last stop
            addStop(stopsTmp[stopIndex], distShapeToStop);
            //TODO mark shape as referente with number stop
            //TODO set distance from shape reference to stop
        } else {
            if(shapeTmp.length<i)
            addShapePoint(shapePoint, distanceBetweenPoints(
                new google.maps.LatLng(shapePoint.LAT, shapePoint.LON),
                new google.maps.LatLng(shapeTmp[i + 1].LAT, shapeTmp[i + 1].LON)));

            if (distShapeToStop <= radius) { //radius in meters
                recluting = true;
                if (distShapeToStop < distController) {
                    distController = distShapeToStop;
                    indexController = i;
                }
                //console.log("shape [" + i + "] is on radius (" + distShapeToStop + "m) for: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
            } else {
                if (recluting) {
                    //make change
                    //TODO determinate nearest shapePoint
                    //TODO add shape
                    //addShapePoint(shapeTmp[indexController], 200);
                    //TODO add stop
                    var p1 = new google.maps.LatLng(shapeTmp[indexController].LAT, shapeTmp[indexController].LON);
                    var p2 = new google.maps.LatLng(stopsTmp[stopIndex].LAT, stopsTmp[stopIndex].LON);

                    distShapeToStop = distanceBetweenPoints(p1, p2); //get distance between shape to next stop (stopsTmp[stopIndex])
                    addStop(stopsTmp[stopIndex], distShapeToStop);
                    //TODO mark shape as referente with number stop
                    //TODO set distance from shape reference to stop
                    //TODO set distance to next shape
                    createMarker2(shapeTmp[indexController], stopsTmp[stopIndex].NOME, distShapeToStop).setMap(map);
                    //console.log("-> goes: " + getNearestShapePoint(reclutedShapePoints)); //just index, get object
                    //createMarker2(shapeTmp[getNearestShapePoint(reclutedShapePoints)]).setMap(map);
                    distController = radius + 1;
                    indexController = -1;
                    //console.log("add: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
                    //console.log("---------");
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

/** For test **/
function printShape(shapeTmp, go, contKey) {
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
        strokeColor: go ? colores[contKey]:coloresBack[contKey],
        strokeOpacity: go?1.0:0.5,
        strokeWeight: 5
    });
    routePath.setMap(map);
}

function printStops(stopsTmp, go, contKey) {
    $.each(stopsTmp, function(i, item) {
        createMarker(item, go,contKey).setMap(map);
        printArea(item, go, contKey);
    });
}

// crear markers de las ruta
function createMarker(item, go, contKey) {
    var latLng = new google.maps.LatLng(item.LAT, item.LON);
    var iconURL = go ? markersUrl[contKey]: markersUrlBack[contKey];
    
    var marker = new google.maps.Marker({
        position: latLng,
        icon: {
            url: iconURL, // url
            scaledSize: new google.maps.Size(30,30)
        } 

    });
    
    marker.addListener('click', function() {
        var contentString = '<strong>' + item.NOME + '</strong> <br> Seq: ' +
            item.SEQ + '<br> Sentido: ' + item.SENTIDO;
        var infowindow = new google.maps.InfoWindow({
            content: contentString
        });
        infowindow.open(map, marker);
    });

    return marker;
}


function printArea(item, go, contKey) {
    
    var cityCircle = new google.maps.Circle({
        strokeColor: go?colores[contKey]:coloresBack[contKey],
        strokeOpacity: 0.8,
        strokeWeight: 1,
        fillColor: go?colores[contKey]:coloresBack[contKey],
        fillOpacity: 0.35,
        map: map,
        center: {
            lat: parseFloat(item.LAT),
            lng: parseFloat(item.LON)
        },
        radius: 0
    });
}


