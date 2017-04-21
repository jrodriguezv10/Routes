  let server = 'https://raw.githubusercontent.com/jrodriguezv10/Routes/master/linhas';

  function getJsonFromServer(linha, sent, identifier) {
      var loadedShape = false;
      var loadedStops = false;
      var routeName;
      var shape;
      var stops;
      /*var jsonResponse = {
          success: true,
          points: [],
          identifier: ''
      }*/

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
                      resolve(createJsonResponse(sent, identifier, shape, stops, linha));
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
                      resolve(createJsonResponse(sent, identifier, shape, stops, linha));
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

  function createJsonResponse(sent, identifier, shape, stops, linha) {
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
          nShp = firstShapeSHP == item.SHP ? 1 : 2;
          if (firstShapeSHP == item.SHP) {
              shapeGo.push(item);
          } else {
              shapeBack.push(item);
          }
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

      radius = (radius / 2) + 1;

      if (radius > 100) {
          console.log("radius (" + radius + ") forced to be 100m: possible bug. Linha [" + linha + "]");
          radius = 100;

      }

      console.log("radius: " + radius);

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
      //console.log("shape: " + shape.length);
      //console.log("stops: " + stops.length);
      //console.log("[" + stopsA.length + "] A: " + firstStopsWay);
      //console.log("[" + stopsB.length + "] B: " + tmpStopWay);
      //console.log("[" + stopsC.length + "] C: " + stops[stops.length - 1].SENTIDO);

      /**
       * merge stops if needed
       **/
      if (nStops == 3) {
          if (stopsA[0].LAT == stopsB[0].LAT && stopsA[0].LON == stopsB[0].LON) {
              stopsA = mergeStops(stopsA, stopsB); //merge A and B
              stopsB = stopsC;
          } else if (stopsA[0].LAT == stopsC[0].LAT && stopsA[0].LON == stopsC[0].LON) {
              stopsA = mergeStops(stopsA, stopsC); //merge A and C
          } else {
              stopsB = mergeStops(stopsB, stopsC); //merge B and C
          }
      }else if (nShp == 1 && nStops == 2) {
          //it has one SHP and two Sentidos: possible use of shp (shape)
          //for go and back. ex. 222
          //So, duplicate an inverse shape
          var tmpShape = shape;
          for(var i = tmpShape.length - 1; i >=0; i--){
            shapeBack.push(tmpShape[i]);
          }
      }

      /**
       * Determinate 'Sentido'
       **/
      if(stopsB.length > 0){
        var firstShape = new google.maps.LatLng(shape[0].LAT, shape[0].LON);
        var firstStopA = new google.maps.LatLng(stopsA[0].LAT, stopsA[0].LON);
        var firstStopB = new google.maps.LatLng(stopsB[0].LAT, stopsB[0].LON);

        var distanceToA = distanceBetweenPoints(firstShape, firstStopA);
        var distanceToB = distanceBetweenPoints(firstShape, firstStopB);

        console.log("Distance to A: " + distanceToA);
        console.log("Distance to B: " + distanceToB);

        stopsGo = distanceToA < distanceToB ? stopsA : stopsB;
        stopsBack = distanceToA < distanceToB ? stopsB : stopsA;
      }else{
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
      printShape(shapeGo, true);
      printStops(stopsGo, true, radius);


      getReferentShapePoint(shapeGo, stopsGo, radius);
      if (shapeBack.length > 0 && stopsBack.length > 0) {
          //getReferentShapePoint(shapeBack, stopsBack, radius);
      }else{
        console.log("can't handle back");
      }

      //TODO check out for possible duplicate on different threads
      jsonResponse.identifier = identifier;
      return jsonResponse;
      //console.log(jsonResponse);
  }

  function getReferentShapePoint(shapeTmp, stopsTmp, radius) {
      var stopIndex = 0;
      var recluting = false;
      var distController = radius + 1;
      var indexController = -1;
      var retake = false;

      //$.each(shapeTmp, function(i, shapePoint) {
      for (var i = 0; i < shapeTmp.length; i++) {
          var shapePoint = shapeTmp[i];
          var shapePointLoc = new google.maps.LatLng(shapePoint.LAT, shapePoint.LON);
          var stopLoc = new google.maps.LatLng(stopsTmp[stopIndex].LAT, stopsTmp[stopIndex].LON);
          distShapeToStop = distanceBetweenPoints(shapePointLoc, stopLoc); //get distance between shape to next stop (stopsTmp[stopIndex])

          if (stopIndex == 0) { //begin
              addStop(stopsTmp[stopIndex], distShapeToStop);
              addShapePoint(shapePoint, distanceBetweenPoints(
                  new google.maps.LatLng(shapePoint.LAT, shapePoint.LON),
                  new google.maps.LatLng(shapeTmp[i + 1].LAT, shapeTmp[i + 1].LON)));
              stopIndex++; //next stop
              createMarker(shapePoint,false, shapePoint.NOME).setMap(map);
              console.log("-> goes: " + indexController); //just index, get object
              console.log("add: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
              console.log("---------");

          } else if (stopIndex == stopsTmp.length - 1 && i == shapeTmp.length - 1) { //last stop and last shape
              //console.log("add: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
              //console.log("shape [" + i + "] is on radius (" + distShapeToStop + "m) for: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
              //console.log("---------");
              //createMarker2(shapePoint).setMap(map);
              addShapePoint(shapePoint, 0);
              addStop(stopsTmp[stopIndex], distShapeToStop);
              createMarker(shapePoint,false, shapePoint.NOME).setMap(map);
              console.log("-> goes: " + indexController); //just index, get object
              console.log("add: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
              console.log("---------");
          } else {
              if (!retake) {
                  addShapePoint(shapePoint, distanceBetweenPoints(
                      new google.maps.LatLng(shapePoint.LAT, shapePoint.LON),
                      new google.maps.LatLng(shapeTmp[i + 1].LAT, shapeTmp[i + 1].LON)));
              } else {
                  retake = false;
              }

              console.log("shape [" + i + "] dist(" + distShapeToStop + "m) for: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME + " (" + stopsTmp[stopIndex].SENTIDO + ") " + stopsTmp[stopIndex].SEQ);
              //createMarker2(shapePoint).setMap(map);
              if (distShapeToStop <= radius) { //radius in meters
                  recluting = true;
                  if (distShapeToStop < distController) {
                      distController = distShapeToStop;
                      indexController = i;
                  }

                  //console.log("shape [" + i + "] is on radius (" + distShapeToStop + "m) for: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME + " (" + stopsTmp[stopIndex].SENTIDO + ") " + stopsTmp[stopIndex].SEQ);

              } else {
                  if (recluting) {
                      //make change
                      var p1 = new google.maps.LatLng(shapeTmp[indexController].LAT, shapeTmp[indexController].LON);
                      var p2 = new google.maps.LatLng(stopsTmp[stopIndex].LAT, stopsTmp[stopIndex].LON);

                      distShapeToStop = distanceBetweenPoints(p1, p2); //get distance between shape to next stop (stopsTmp[stopIndex])
                      addStop(stopsTmp[stopIndex], distShapeToStop);
                      createMarker(shapeTmp[indexController], false, indexController).setMap(map);
                      console.log("-> goes: " + indexController); //just index, get object
                      distController = radius + 1;
                      indexController = -1;
                      console.log("add: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
                      console.log("---------");
                      stopIndex++; //next stop
                      i--;
                      retake = true;
                      recluting = false; //
                  }
              }
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

  function addShapePoint(shapePoint, distance) {
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
      $.each(firstStop, function(i, stop) {
          stop.SENTIDO = firstStop[i].SENTIDO + "/" + secondStop[i].SENTIDO;
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







  var map;
  let colorGreen = "#4caf50";
  let colorRed = "#ff9800";

  /** For test **/
function printShape(shapeTmp, go) {
    var routeLine = [];
    $.each(shapeTmp, function(i, item) {
        routeLine.push({
            lat: parseFloat(item.LAT),
            lng: parseFloat(item.LON)
        });
        //createMarker(item, false, i).setMap(map);
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

function printStops(stopsTmp, go, radius) {
    $.each(stopsTmp, function(i, item) {
        createMarker(item, go).setMap(map);
        printArea(item, go, radius);
    });
}

function createMarker(item, go, num) {
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
            item.SEQ + '<br>' + item.SENTIDO + '<br>' + num;
        var infowindow = new google.maps.InfoWindow({
            content: contentString
        });
        infowindow.open(map, marker);
    });

    return marker;
}

function printArea(item, go, radius) {
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
