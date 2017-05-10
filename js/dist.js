let server = 'https://raw.githubusercontent.com/jrodriguezv10/Routes/master/linhas';

function getJsonFromServer(linha, sent, identifier, pos) {
  var loadedShape = false;
  var loadedStops = false;
  var routeName;
  var shape;
  var stops;

  return new Promise(function(resolve, reject) {

    /*****/
    $.ajax({
      url: server + '/shapes/Shape' + linha + '.json',
      type: 'GET',
      dataType: "json",
      success: function(response) {
        shape = response;
        loadedShape = true;
        console.log("shape  loadedShape[" + loadedShape + "] loadedStops[" + loadedStops + "]");
        if (loadedShape && loadedStops) {
          cleanVars();
          console.log("on Shape [" + identifier + "]");
          console.log("----------------------");
          resolve(createJsonResponse(sent, identifier, shape, stops, linha, pos));
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
        stops = response;
        loadedStops = true;
        console.log("pontos loadedShape[" + loadedShape + "] loadedStops[" + loadedStops + "]");
        if (loadedShape && loadedStops) {
          cleanVars();
          console.log("on Ponto [" + identifier + "]");
          console.log("----------------------");
          resolve(createJsonResponse(sent, identifier, shape, stops, linha, pos));
          //createJsonResponse();
        }
      },
      error: function(response) {
        reject(Error("Problems getting Stops (pontos)"));
      }
    });
    /******/
  });

}

function cleanVars() {
  //shape = [];
  //stops = [];
  loadedShape = false;
  loadedStops = false;
  jsonResponse = {
    success: true,
    points: [],
    identifier: ''
  }
}

function createJsonResponse(sent, identifier, shape, stops, linha, pos) {
  var firstShapeSHP = shape[0].SHP;
  var firstStopsWay = stops[0].SENTIDO;
  var tmpStopWay = "";
  var secondGotten = false;

  var nShp = 0;
  var nStops = 0;

  var stopsA = [];
  var stopsB = [];
  var stopsC = [];

  var radius = 0;

  var shapeGo = [];
  var stopsGo = [];
  var shapeBack = [];
  var stopsBack = [];

  /**
   * Determinate number of SHP
   * Getting radius, if radius > 200, set 200m and show message
   **/
  $.each(shape, function(i, item) {
    item.LAT = item.LAT.replace(",", ".");
    item.LON = item.LON.replace(",", ".");
  });

  $.each(shape, function(i, item) {
    if (i < shape.length - 1) {
      var shapePoint = new google.maps.LatLng(item.LAT, item.LON);
      var nextShapePoint = new google.maps.LatLng(shape[i + 1].LAT, shape[i + 1].LON);
      var distance = distanceBetweenPoints(shapePoint, nextShapePoint);
      if (radius <= distance) {
        radius = distance;
      }
    }
  });

  radius = (radius / 2) + 20;

  if (radius > 150) {
    console.log("radius (" + radius + ") forced to be 150m: possible bug. Linha [" + linha + "]");
    radius = 150;

  }

  console.log("radius: " + radius);

  shape = divideSHP(shape);
  nShp = shape.length;
  shapeGo = shape[0];
  if (shape.length > 1) {
    shapeBack = shape[1];
  }

  /**
   * Separe stops
   **/
  $.each(stops, function(i, item) {
    item.LAT = item.LAT.replace(",", ".");
    item.LON = item.LON.replace(",", ".");
    item.SEQ = parseInt(item.SEQ);

    if (!secondGotten) {
      tmpStopWay = item.SENTIDO;
    }

    if (item.SENTIDO == firstStopsWay) {
      stopsA.push(item);
    } else if (!secondGotten || item.SENTIDO == tmpStopWay) {
      stopsB.push(item);
      secondGotten = true;
    } else {
      stopsC.push(item);
    }
  });

  if (stopsA.length > 0) {
    nStops = 1;
  }

  if (stopsB.length > 0) {
    nStops = 2;
  }

  if (stopsC.length > 0) {
    nStops = 3;
  }
  stopsA.sort(compare);
  stopsB.sort(compare);
  stopsC.sort(compare);

  console.log("nShp: " + nShp);
  console.log("nStops: " + nStops);

  /**
   * merge stops if needed
   **/
  if (nStops == 3) {
    if (stopsA[0].LAT == stopsB[0].LAT && stopsA[0].LON == stopsB[0].LON) {
      console.log("A==B [" + stopsA[0].LAT + "==" + stopsA[0].LON + "," + stopsB[0].LAT + "==" + stopsB[0].LON + "] \nSEQ: " + stopsA[0].SEQ + " - " + stopsB[0].SEQ);
      stopsA = mergeStops(stopsA, stopsB); //merge A and B
      stopsB = stopsC;
    } else if (stopsA[0].LAT == stopsC[0].LAT && stopsA[0].LON == stopsC[0].LON) {
      console.log("A==C [" + stopsA[0].LAT + "==" + stopsA[0].LON + "," + stopsC[0].LAT + "==" + stopsC[0].LON + "] \nSEQ: " + stopsA[0].SEQ + " - " + stopsC[0].SEQ);
      stopsA = mergeStops(stopsA, stopsC); //merge A and C
    } else {
      console.log("B==C [" + stopsB[0].LAT + "==" + stopsB[0].LON + "," + stopsC[0].LAT + "==" + stopsC[0].LON + "] \nSEQ: " + stopsB[0].SEQ + " - " + stopsC[0].SEQ);
      stopsB = mergeStops(stopsB, stopsC); //merge B and C
    }
  } else if (nShp == 1 && nStops == 2) {
    //it has one SHP and two Sentidos: possible use of shp (shape)
    //for go and back. ex. 222
    //So, duplicate an inverse shape
    var tmpShape = shape;
    for (var i = tmpShape.length - 1; i >= 0; i--) {
      shapeBack.push(tmpShape[i]);
    }
  }

  /**
   * Determinate 'Sentido'
   **/
  if (stopsB.length > 0) {
    var firstShape = new google.maps.LatLng(shapeGo[0].LAT, shapeGo[0].LON);
    var firstStopA = new google.maps.LatLng(stopsA[0].LAT, stopsA[0].LON);
    var firstStopB = new google.maps.LatLng(stopsB[0].LAT, stopsB[0].LON);

    var distanceToA = distanceBetweenPoints(firstShape, firstStopA);
    var distanceToB = distanceBetweenPoints(firstShape, firstStopB);

    console.log("Distance to A: " + distanceToA);
    console.log("Distance to B: " + distanceToB);

    stopsGo = distanceToA < distanceToB ? stopsA : stopsB;
    stopsBack = distanceToA < distanceToB ? stopsB : stopsA;
  } else {
    stopsGo = stopsA;
  }

  stopsGo.sort(compare);
  stopsBack.sort(compare);
  console.log("=====================");
  console.log("stopsGo: " + stopsGo.length);
  console.log("shapeGo: " + shapeGo.length);

  console.log("=====================");
  console.log("stopsBack: " + stopsBack.length);
  console.log("shapeBack: " + shapeBack.length);
  console.log("=====================");

  getReferentShapePoint(shapeGo, stopsGo, getCustomRadius(linha, radius));
  if (shapeBack.length > 0 && stopsBack.length > 0) {
    getReferentShapePoint(shapeBack, stopsBack, getCustomRadius(linha, radius));
  } else {
    console.log("can't handle back");
  }

  //TODO check out for possible duplicate on different threads
  jsonResponse.identifier = identifier;
  jsonResponse.pos = pos;
  return jsonResponse;
  //console.log(jsonResponse);
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

function getReferentShapePoint(shapeTmp, stopsTmp, radius) {
  var stopIndex = 0;
  var recluting = false;
  var distController = radius + 1;
  var indexController = -1;
  var retake = false;

  //$.each(shapeTmp, function(i, shapePoint) {
  for (var i = 0; i < shapeTmp.length; i++) {
    if (stopIndex < stopsTmp.length) {
      var shapePoint = shapeTmp[i];
      var shapePointLoc = new google.maps.LatLng(shapePoint.LAT, shapePoint.LON);
      var stopLoc = new google.maps.LatLng(stopsTmp[stopIndex].LAT, stopsTmp[stopIndex].LON);
      distShapeToStop = distanceBetweenPoints(shapePointLoc, stopLoc); //get distance between shape to next stop (stopsTmp[stopIndex])

      if (stopIndex == 0) { //begin
        addStop(stopsTmp[stopIndex], distShapeToStop);
        addShapePoint(shapePoint, distanceBetweenPoints(
          new google.maps.LatLng(shapePoint.LAT, shapePoint.LON),
          new google.maps.LatLng(shapeTmp[i + 1].LAT, shapeTmp[i + 1].LON),
          stopsTmp[stopIndex].NUM));
        stopIndex++; //next stop

      } else if (stopIndex == stopsTmp.length - 1 && i == shapeTmp.length - 1) { //last stop and last shape
        addShapePoint(shapePoint, 0, stopsTmp[stopIndex].NUM);
        addStop(stopsTmp[stopIndex], distShapeToStop);
      } else {
        if (!retake) {
          addShapePoint(shapePoint, distanceBetweenPoints(
            new google.maps.LatLng(shapePoint.LAT, shapePoint.LON),
            new google.maps.LatLng(shapeTmp[i + 1].LAT, shapeTmp[i + 1].LON),
            0));
        } else {
          retake = false;
        }

        if (distShapeToStop <= radius) { //radius in meters
          recluting = true;
          if (distShapeToStop < distController) {
            distController = distShapeToStop;
            indexController = i;
          }

        } else {
          if (recluting) {
            //make change
            var p1 = new google.maps.LatLng(shapeTmp[indexController].LAT, shapeTmp[indexController].LON);
            var p2 = new google.maps.LatLng(stopsTmp[stopIndex].LAT, stopsTmp[stopIndex].LON);

            distShapeToStop = distanceBetweenPoints(p1, p2); //get distance between shape to next stop (stopsTmp[stopIndex])
            addStop(stopsTmp[stopIndex], distShapeToStop);
            distController = radius + 1;
            indexController = -1;
            stopIndex++; //next stop
            i--;
            retake = true;
            recluting = false; //
          }
        }
      }
    } else {
      //console.log("no more stops");
    }
  }
  //});
}

function getNearestShapePoint(reclutedShapePoints) {
  var min = radius + 1;
  var index;
  $.each(reclutedShapePoints, function(i, shapePoint) {
    if (shapePoint.dis <= min) {
      min = shapePoint.dis;
      index = shapePoint.index;
    }
  });
  return index;
}

function addStop(stop, distance) {
  jsonResponse.points.push({
    stop: true,
    nome: stop.NOME,
    num: stop.NUM,
    lat: stop.LAT,
    lng: stop.LON,
    seq: stop.SEQ,
    grupo: stop.GRUPO,
    sentido: stop.SENTIDO,
    tipo: stop.TIPO,
    disStop: distance
  });
}

function addShapePoint(shapePoint, distance, stopNum) {
  jsonResponse.points.push({
    stop: false,
    shp: shapePoint.SHP,
    lat: shapePoint.LAT,
    lng: shapePoint.LON,
    cod: shapePoint.COD,
    disNext: distance
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

function mergeStops(firstStop, secondStop) {
  var stopsMerged = [];
  console.log("n firstStop: " + firstStop.length + "\nn secondStop: " + secondStop.length);
  var bigger = [];
  var smaller = [];
  if (firstStop.length >= secondStop.length) {
    bigger = firstStop;
    smaller = secondStop;
  } else {
    bigger = secondStop;
    smaller = firstStop;
  }


  $.each(bigger, function(i, stop) {
    stop.SENTIDO = bigger[i].SENTIDO + "/" + (i < smaller.length ? smaller[i].SENTIDO : "");
    stopsMerged.push(stop);
  });

  return stopsMerged;
}

function compare(a, b) {
  if (a.SEQ < b.SEQ)
    return -1;
  if (a.SEQ > b.SEQ)
    return 1;
  return 0;
}

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
