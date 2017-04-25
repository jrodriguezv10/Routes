/*****************************************************
 * database will get de array with the alvaras info
 *****************************************************/
var markers = [];
/*****************************************************
 * Google Map we use in the front end
 *****************************************************/
var map;

/*****************************************************
 * Route line to show on Google Map
 *****************************************************/

/*****************************************************
 * Route line setting
 *****************************************************/
var routePath;
//var routePath342;
var routePath225;

/*****************************************************
 * Initialize the map, the clusters, the polygons,
 * the Slider for years range and the components
 *****************************************************/
google.maps.event.addDomListener(window, 'load', initializeIndex);


    


function initializeIndex() {
    $("option").prop("selected", false);
    var mapCanvas = document.getElementById('map');
    var mapOptions = {
        center: new google.maps.LatLng(-25.383948, -49.246980),
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        scrollwheel: false,
        styles: mapStylesGray
    }

    map = new google.maps.Map(mapCanvas, mapOptions);
    //setPoints();
    $('#linhaSelector').multiselect({
        columns: 1,
        placeholder: 'Selecionar linha de ônibus',
        search: true
    });
}

/*function setPoints() {

    database2.sort(compare);
    sentido = database2.length > 0 ? database2[0].SENTIDO : "";
    $.each(database2, function(i, point) {
        //routeLine.push({lat: parseFloat(point.LAT), lng: parseFloat(point.LON)});
        getMarker(point, i).setMap(map);
    });

    routePath = new google.maps.Polyline({
        path: routeLine,
        geodesic: true,
        strokeColor: '#1565c0',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });
    routePath.setMap(map);
}*/

/******/
function closeSettings(close) {
    var distance = (close ? "-" + ($("#setting-container").width() + 20) : "0") + "px";
    $("#setting-container").animate({
        left: distance
    }, 300);
    $("#open-settings").css("display", close ? "inline-block" : "none");
    $("#close-settings").css("display", close ? "none" : "inline-block");
}

function showLinhas() {

    cleaMap();

    var linhas = $('#linhaSelector').val();
    for (var i = 0; i < linhas.length; i++) {
        if (linhas[i] == "342") {
            var line342 = [];
            var distance = 0;
            var html = '<div class="rem"><div class="btn" onclick="dist2()">[342] Bairro Alto / Boa Vista</div>';
            html += '<div id="r-342">';
            html += '<div class="route-title"><strong>Sentido Terminal Bairro Alto</strong></div><br>';

            $.each(route342, function(i, point) {
                if (point.stop && point.sentido == "Terminal Bairro Alto") {
                    var space = distance < 100 ? "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" : "&nbsp;&nbsp;&nbsp;";
                    space = distance < 10 ? "&nbsp;&nbsp;&nbsp;" + space : space;
                    html += '<div class="route-row"><div class="route-distance">' + distance + 'm</div>' + space + '<div class="route-name">' + point.nome + '</div><br>';
                    distance = 0;
                    sentido = "Terminal Bairro Alto";
                    getMarker(point, i).setMap(map);
                } else {
                    distance += point.disnext;
                    if(!point.stop){
                      line342.push({
                          lat: parseFloat(point.lat),
                          lng: parseFloat(point.lon)
                      });
                    }
                }



            });

            html += '<br>';
            html += '<div class="route-title"><strong>Sentido Terminal Boa Vista</strong></div><br>';
            distance = 0;
            $.each(route342.reverse(), function(i, point) {

                if (point.stop && point.sentido == "Terminal Boa Vista") {
                    var space = distance < 100 ? "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" : "&nbsp;&nbsp;&nbsp;";
                    space = distance < 10 ? "&nbsp;&nbsp;&nbsp;" + space : space;
                    html += '<div class="route-row"><div class="route-distance">' + distance + 'm</div>' + space + '<div class="route-name">' + point.nome + '</div><br>';
                    distance = 0;
                    getMarker(point, i).setMap(map);
                } else {
                    distance += point.disnext;
                    if(!point.stop){
                      line342.push({
                          lat: parseFloat(point.lat),
                          lng: parseFloat(point.lon)
                      });
                    }
                }

            });
            html += "</div><br><br></div>";
            $("#routes").append(html);

            showPath(line342, true);
        } else {
            var line225 = [];
            var distance = 0;
            var html = '<div class="rem"><div class="btn" onclick="dist()">[225] Boa Vista / Barreirinha</div><br>';
            html += '<div id="r-225">';
            html += '<div class="route-title"><strong>Sentido Terminal Barrerinha</strong></div><br>';

            $.each(route225, function(i, point) {

                if (point.stop == "TRUE" && point.sentido == "Terminal Barrerinha") {
                    var space = distance < 100 ? "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" : "&nbsp;&nbsp;&nbsp;";
                    space = distance < 10 ? "&nbsp;&nbsp;&nbsp;" + space : space;
                    html += '<div class="route-row"><div class="route-distance">' + distance + 'm</div>' + space + '<div class="route-name">' + point.nome + '</div><br>';
                    distance = 0;
                    sentido = "Terminal Barrerinha";
                    getMarker(point, i).setMap(map);
                } else {
                    distance += point.disnext;
                    if(point.stop != "TRUE"){
                      line225.push({
                          lat: parseFloat(point.lat),
                          lng: parseFloat(point.lon)
                      });
                    }
                }

            });

            console.log("");
            console.log("cambio de sentido");
            html += '<br>';
            html += '<div class="route-title"><strong>Sentido Terminal Boa Vista</strong></div><br>';
            distance = 0;
            $.each(route225.reverse(), function(i, point) {

                if (point.stop == "TRUE" && point.sentido == "Terminal Boa Vista") {
                    var space = distance < 100 ? "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" : "&nbsp;&nbsp;&nbsp;";
                    space = distance < 10 ? "&nbsp;&nbsp;&nbsp;" + space : space;
                    html += '<div class="route-row"><div class="route-distance">' + distance + 'm</div>' + space + '<div class="route-name">' + point.nome + '</div><br>';
                    distance = 0;
                    getMarker(point, i).setMap(map);
                } else {
                    distance += point.disnext;
                    if(point.stop != "TRUE"){
                      line225.push({
                          lat: parseFloat(point.lat),
                          lng: parseFloat(point.lon)
                      });
                    }
                }

            });
            html += "</div><br><br></div>";
            $("#routes").append(html);
            showPath(line225, false);
        }
    }
}





function cleaMap(){
  if (routePath342 != null) {
      routePath342.setMap(null);
  }

  if (routePath225 != null) {
      routePath225.setMap(null);
  }

  $(".rem").remove();

  for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
  }
  markers = [];
}

/*
function showPath(route, r342) {
    if (r342) {
        routePath342 = new google.maps.Polyline({
            path: route,
            geodesic: true,
            strokeColor: '#1565c0',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        routePath342.setMap(map);
    } else {
        routePath225 = new google.maps.Polyline({
            path: route,
            geodesic: true,
            strokeColor: '#073855;',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        routePath225.setMap(map);
    }
}*/

var r225 = true;
var r342 = true;

function dist() {
    if (!r225) {
        $("#r-225").fadeIn("fast", function() {
            // Animation complete
            r225 = true;
        });
    } else {
        $("#r-225").fadeOut("fast", function() {
            // Animation complete
            r225 = false;
        });
    }
}

function dist2() {
    if (!r342) {
        $("#r-342").fadeIn("fast", function() {
            // Animation complete
            r342 = true;
        });
    } else {
        $("#r-342").fadeOut("fast", function() {
            // Animation complete
            r342 = false;
        });
    }
}








//
