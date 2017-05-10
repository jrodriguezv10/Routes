let server = 'https://raw.githubusercontent.com/jrodriguezv10/Routes/master/linhas/route.json';
var colors = ["#378D3B", "#D22E2E", "#2F3E9E",
  "#1875D1", "#7A1EA1", "#d35400",
  "#16a085", "##666666"
];

var rutaImg = "https://raw.githubusercontent.com/jrodriguezv10/Routes/master/img/markers";
var markersUrl = [rutaImg + "/markerVerde.png", rutaImg + "/markerRojo.png", rutaImg + "/markerAzul.png",
  rutaImg + "/markerCeleste.png", rutaImg + "/markerMorado.png", rutaImg + "/markerNaranja.png",
  rutaImg + "/markerTurquesa.png", rutaImg + "/markerPlomo.png"
];
var map;
var loaderShape = [];
var loaderStops = [];
var shapeList = [];
var stopsList = [];
var linhasDivided = [];

function getRouteJson() {
  /*****/
  $.ajax({
    url: server,
    type: 'GET',
    dataType: "json",
    success: function(route) {
      $.each(route, function(i, item) {
        tmpLat = item.LAT;
        route[i].LAT = item.LON;
        route[i].LON = tmpLat;
      });
      getListOfLinhas(route);
    },
    error: function(response) {
      reject(Error("Problems getting Shape"));
    }
  });

}

function getListOfLinhas(route) {

  var linhas = [];
  $.each(route, function(i, item) {
    linhas.push(item.CODLINHA);
  });

  var deleteDuplicates = [];
  var linhaColor = [];

  //remove duplicates
  $.each(linhas, function(i, linha) {
    if ($.inArray(linha, deleteDuplicates) === -1) {
      deleteDuplicates.push(linha);
    }
  });

  console.log(deleteDuplicates);
  //set color and pos
  $.each(deleteDuplicates, function(i, linha) {
    linhaColor[linha] = i;
  });

  //Set pos
  $.each(route, function(i, item) {
    item.POS = linhaColor[item.CODLINHA];
  });

  linhasDivided = [];

  $.each(deleteDuplicates, function(i, linha) {
    linhasDivided.push([]);
  });

  $.each(route, function(i, item) {
    linhasDivided[item.POS].push(item);
  });

  console.log(linhasDivided);
  getJsonForEachLinha(linhasDivided);

}

function getJsonForEachLinha(linhasDivided) {

  loaderShape = [];
  loadedStops = [];
  $.each(linhasDivided, function(i, item) {
    loaderShape[i] = false;
    loadedStops[i] = false;
  });

  $.each(linhasDivided, function(i, item) {
    getByAjax(item[0].CODLINHA, i);
  });


}

function getByAjax(linha, index) {
  let server = 'https://raw.githubusercontent.com/jrodriguezv10/Routes/master/linhas';
  $.ajax({
    url: server + '/shapes/Shape' + linha + '.json',
    type: 'GET',
    dataType: "json",
    success: function(response) {
      shapeList[index] = response;
      loaderShape[index] = true;
      if (isCompleteShape() && isCompleteStops()) {
        filterLinhasAndStops();
      }
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
      stopsList[index] = response;
      loadedStops[index] = true;
      if (isCompleteStops() && isCompleteShape()) {
        filterLinhasAndStops()
      }
    },
    error: function(response) {
      reject(Error("Problems getting Stops (pontos)"));
    }
  });
}

function filterLinhasAndStops() {

  var stopsWithSentido = [];
  $.each(stopsList, function(i, stops) {
    stopsWithSentido.push([]);
  });

  $.each(stopsList, function(i, stops) {
    $.each(stops, function(j, stop) {
      if (stop.SENTIDO == linhasDivided[i][0].SENTIDO) {
        stopsWithSentido[i].push(stop);
      }
    });
  });

  $.each(stopsWithSentido, function(i, stops) {
    stops.sort(compare);
  });


  var shapesWithSHP = [];
  $.each(shapeList, function(i, shapes) {
    shapesWithSHP.push([]);
  });

  $.each(shapeList, function(i, shapes) {
    shapes = divideSHP(shapes);
    if (shapes.length == 1) {
      shapesWithSHP[i] = shapes;
    } else {

      console.log(stopsWithSentido[i][0].SENTIDO);
      var firstStop = new google.maps.LatLng(
        stopsWithSentido[i][0].LAT.replace(",", "."),
        stopsWithSentido[i][0].LON.replace(",", "."));

      var firstSHP = new google.maps.LatLng(
        shapes[0][0].LAT.replace(",", "."),
        shapes[0][0].LON.replace(",", "."));

      var secondSHP = new google.maps.LatLng(
        shapes[1][0].LAT.replace(",", "."),
        shapes[1][0].LON.replace(",", "."));

      var distanceToFirst = distanceBetweenPoints(firstStop, firstSHP);
      var distanceToSecond = distanceBetweenPoints(firstStop, secondSHP);

      shapesWithSHP[i] = distanceToFirst < distanceToSecond ?
        shapes[0] : shapes[1];
      console.log("distanceToFirst: " + distanceToFirst);
      console.log("distanceToSecond: " + distanceToSecond);
      console.log("Choose: " + (distanceToFirst < distanceToSecond ? "First" : "Second"));

    }
  });

  var radiuses = [];
  $.each(shapesWithSHP, function(i, shapes) {
    radiuses[i] = 0;
  });

  $.each(shapesWithSHP, function(i, shapes) {
    $.each(shapes, function(j, shape) {
      if (j < shapes.length - 1) {
        var shapePoint = new google.maps.LatLng(shape.LAT, shape.LON);
        var nextShapePoint = new google.maps.LatLng(shapes[i + 1].LAT, shapes[i + 1].LON);
        var distance = distanceBetweenPoints(shapePoint, nextShapePoint);
        if (radiuses[i] <= distance) {
          radiuses[i] = distance;
        }
      }
    });
  });

  $.each(radiuses, function(i, radius) {
    radius = (radius / 2) + 20;
    if (radius > 150) {
      console.log("radius (" + radius + ") forced to be 150m: possible bug. Linha [" + linha + "]");
      radius = 150;
    }
    radiuses[i] = getCustomRadius(shapesWithSHP[i][0].COD, radius);
  });

  console.log("=============");
  console.log(linhasDivided);
  console.log(shapesWithSHP);
  console.log(radiuses);

  getReferentShapePoint(linhasDivided, shapesWithSHP, radiuses)

}

function getReferentShapePoint(linhasDivided, shapesWithSHP, radiuses) {
  console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
  var colorsSHP = [];
  $.each(shapesWithSHP, function(index, shapeTmp) {
    colorsSHP.push([]);
  });


  $.each(shapesWithSHP, function(index, shapeTmp) {

    console.log("..........................................");
    var recluting = false;
    var radius = radiuses[index];
    var distController = radius + 1;
    var indexController = -1;
    var stopsTmp = linhasDivided[index];
    console.log(stopsTmp[0].NOME);
    console.log(shapeTmp.length);
    console.log(stopsTmp.length);

    var indexBegin = -1;
    var indexEnd = -1;
    var foundFirst = false;


    for (var i = 0; i < shapeTmp.length; i++) {
      var shapePoint = shapeTmp[i];
      var shapePointLoc = new google.maps.LatLng(shapePoint.LAT.replace(",", "."), shapePoint.LON.replace(",", "."));
      var stopLoc = new google.maps.LatLng(stopsTmp[0].LAT, stopsTmp[0].LON);
      let distShapeToStop = distanceBetweenPoints(shapePointLoc, stopLoc); //get distance between shape to next stop (stopsTmp[stopIndex])
      if (distShapeToStop <= radius) { //radius in meters
        recluting = true;
        if (distShapeToStop < distController) {
          distController = distShapeToStop;
          indexBegin = i;
        }

      }
    }

    recluting = false;
    indexController = -1;
    distController = radius + 1;

    for (var i = 0; i < shapeTmp.length; i++) {
      var shapePoint = shapeTmp[i];
      var shapePointLoc = new google.maps.LatLng(shapePoint.LAT.replace(",", "."), shapePoint.LON.replace(",", "."));
      var stopLoc = new google.maps.LatLng(stopsTmp[stopsTmp.length - 1].LAT, stopsTmp[stopsTmp.length - 1].LON);
      let distShapeToStop = distanceBetweenPoints(shapePointLoc, stopLoc); //get distance between shape to next stop (stopsTmp[stopIndex])

      if (distShapeToStop <= radius) { //radius in meters
        recluting = true;
        if (distShapeToStop < distController) {
          distController = distShapeToStop;
          indexEnd = i;
        }

      }
    }

    console.log(indexBegin + "->" + indexEnd);
    for (var i = indexBegin; i < indexEnd; i++) {
      colorsSHP[index].push(shapeTmp[i]);
    }

    for (var i = 0; i < stopsTmp.length; i++) {
      createMarker(stopsTmp[i], index).setMap(map);
    }

  });

  console.log(colorsSHP);
  $.each(colorsSHP, function(index, shapeTmp) {
    printShape(shapeTmp, index);
  });

  var html = '';
  $.each(linhasDivided, function(index, linha) {
    html += '<img src="' + markersUrl[index] + '" /><div id class="txt-legend">Cod Linha: <strong>' +
      linha[0].CODLINHA + '</strong><br>Sentido: <strong>' + linha[0].SENTIDO + '</strong></div><br>';
  });
  $("#console").append(html);

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

  return shapesDivided;

}

function isCompleteShape() {
  var total = 0;

  $.each(loaderShape, function(i, complete) {
    if (complete) {
      total++;
    }
  });

  return total == loaderShape.length;

}

function isCompleteStops() {
  var total = 0;
  $.each(loadedStops, function(i, complete) {
    if (complete) {
      total++;
    }
  });

  return total == loadedStops.length;

}

function compare(a, b) {
  if (a.SEQ < b.SEQ)
    return -1;
  if (a.SEQ > b.SEQ)
    return 1;
  return 0;
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

function getCustomRadius(linha, radius) {
  switch (linha) {
    case "170":
      console.log("Custom radius for " + linha + ": " + 70 + "m");
      return 70;
    case "623":
      console.log("Custom radius for " + linha + ": " + 100 + "m");
      return 100;
    case "628":
      console.log("Custom radius for " + linha + ": " + 100 + "m");
      return 100;
      break;
    case "642":
      console.log("Custom radius for " + linha + ": " + 70 + "m");
      return 70;
      break;
    case "801":
      console.log("Custom radius for " + linha + ": " + 100 + "m");
      return 100;
    case "821":
      console.log("Custom radius for " + linha + ": " + 90 + "m");
      return 90;
    case "636":
      console.log("Custom radius for " + linha + ": " + 60 + "m");
      return 60;
    case "913":
      console.log("Custom radius for " + linha + ": " + 25 + "m");
      return 25;
    case "270":
      console.log("Custom radius for " + linha + ": " + 50 + "m");
      return 50;
    case "271":
      console.log("Custom radius for " + linha + ": " + 50 + "m");
      return 50;
    case "340":
      console.log("Custom radius for " + linha + ": " + 20 + "m");
      return 20;
    case "610":
      console.log("Custom radius for " + linha + ": " + 150 + "m");
      return 150;
    case "822":
      console.log("Custom radius for " + linha + ": " + 30 + "m");
      return 30;
    case "519":
      console.log("Custom radius for " + linha + ": " + 150 + "m");
      return 150;
    case "214":
      console.log("Custom radius for " + linha + ": " + 200 + "m");
      return 200;
    case "209":
      console.log("Custom radius for " + linha + ": " + 180 + "m");
      return 180;
    case "303":
      console.log("Custom radius for " + linha + ": " + 80 + "m");
      return 80;
    default:
      return radius;
  }
}

function createMarker(item, i) {
  var latLng = new google.maps.LatLng(item.LAT, item.LON);
  var iconURL = markersUrl[i];

  var marker = new google.maps.Marker({
    position: latLng,
    icon: iconURL
  });
  marker.addListener('click', function() {
    var contentString = '<strong>' + item.NOME + '</strong> <br> ' +
      item.SEQ + '<br>' + item.SENTIDO + '<br>';
    var infowindow = new google.maps.InfoWindow({
      content: contentString
    });
    infowindow.open(map, marker);
  });

  return marker;
}

function createMarker2(item, i) {
  var latLng = new google.maps.LatLng(item.LAT.replace(",", "."), item.LON.replace(",", "."));
  //var iconURL = markersUrl[i];

  var marker = new google.maps.Marker({
    position: latLng
    //icon: iconURL
  });
  marker.addListener('click', function() {
    var contentString = '<strong>' + i + '</strong>';
    var infowindow = new google.maps.InfoWindow({
      content: contentString
    });
    infowindow.open(map, marker);
  });

  return marker;
}

/** For test **/
function printShape(shapeTmp, index) {
  var routeLine = [];
  $.each(shapeTmp, function(i, item) {
    routeLine.push({
      lat: parseFloat(item.LAT.replace(",", ".")),
      lng: parseFloat(item.LON.replace(",", "."))
    });
    //createMarker2(item, i).setMap(map);
  });

  var routePath = new google.maps.Polyline({
    path: routeLine,
    geodesic: true,
    strokeColor: colors[index],
    strokeOpacity: 1.0,
    strokeWeight: 2
  });
  routePath.setMap(map);
}

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
  getRouteJson();
}


//
