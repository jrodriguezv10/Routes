let server = 'https://raw.githubusercontent.com/jrodriguezv10/Routes/master/linhas/route.json';
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

    }
  });

  console.log("==========");
  console.log(stopsWithSentido);
  console.log(shapesWithSHP);

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









//
