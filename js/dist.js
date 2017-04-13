  let server = 'https://raw.githubusercontent.com/jrodriguezv10/Routes/master/linhas/';
  let radius = 100; //meters


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
                  console.log(" shape loadedShape[" + loadedShape + "] loadedStops[" + loadedStops + "]");
                  if (loadedShape && loadedStops) {
                      cleanVars();
                      console.log("----------------------");
                      console.log("on Shape [" + identifier + "]");
                      resolve(createJsonResponse(sent, identifier, shape, stops));
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
                      console.log("----------------------");
                      console.log("on Ponto [" + identifier + "]");
                      resolve(createJsonResponse(sent, identifier, shape, stops));
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

  function createJsonResponse(sent, identifier, shape, stops) {
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
          if (sent) {
              if (stopsWay == item.SENTIDO) { //TODO improve condition
                  stopsGo.push(item);
              } else {
                  stopsBack.push(item);
              }
          } else {
              if (stopsWay != item.SENTIDO) { //TODO improve condition
                  stopsGo.push(item);
              } else {
                  stopsBack.push(item);
              }
          }
      });


      stopsGo.sort(compare);
      stopsBack.sort(compare);
      console.log("=====================");
      console.log("stopsGo: " + stopsGo.length);
      console.log("shapeGo: " + shapeGo.length);
      getReferentShapePoint(shapeGo, stopsGo);

      console.log("=====================");
      console.log("stopsBack: " + stopsBack.length);
      console.log("shapeBack: " + shapeBack.length);
      console.log("=====================");
      getReferentShapePoint(shapeBack, stopsBack);

      jsonResponse.identifier = identifier;
      return jsonResponse;
      //console.log(jsonResponse);
  }

  function getReferentShapePoint(shapeTmp, stopsTmp) {
      var stopIndex = 0;
      var recluting = false;
      var distController = radius + 1;
      var indexController = -1;

      $.each(shapeTmp, function(i, shapePoint) {

          var shapePointLoc = new google.maps.LatLng(shapePoint.LAT, shapePoint.LON);
          var stopLoc = new google.maps.LatLng(stopsTmp[stopIndex].LAT, stopsTmp[stopIndex].LON);
          distShapeToStop = distanceBetweenPoints(shapePointLoc, stopLoc); //get distance between shape to next stop (stopsTmp[stopIndex])

          if (stopIndex == 0) { //begin
              addStop(stopsTmp[stopIndex], distShapeToStop);
              addShapePoint(shapePoint, distanceBetweenPoints(
                  new google.maps.LatLng(shapePoint.LAT, shapePoint.LON),
                  new google.maps.LatLng(shapeTmp[i + 1].LAT, shapeTmp[i + 1].LON)));
              //TODO mark shape as referente with number stop
              //TODO set distance from stop to shape reference
              //TODO set distance to next shape
              stopIndex++; //next stop
          } else if (stopIndex == stopsTmp.length - 1 && i == shapeTmp.length - 1) { //last stop and last shape
              //console.log("add: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
              //console.log("shape [" + i + "] is on radius (" + distShapeToStop + "m) for: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
              //console.log("---------");
              //createMarker2(shapePoint).setMap(map);
              //TODO add shape
              addShapePoint(shapePoint, 0);
              //TODO add last stop
              addStop(stopsTmp[stopIndex], distShapeToStop);
              //TODO mark shape as referente with number stop
              //TODO set distance from shape reference to stop
          } else {
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

  function compare(a, b) {
      if (a.SEQ < b.SEQ)
          return -1;
      if (a.SEQ > b.SEQ)
          return 1;
      return 0;
  }
