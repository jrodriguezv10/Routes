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
                  console.log(" shape loadedShape[" + loadedShape + "] loadedStops[" + loadedStops + "]");
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

      /**
       * Determinate number of SHP
       * Getting radius, if radius > 200, set 200m and show message
       **/
      $.each(shape, function(i, item) {
          item.LAT = item.LAT.replace(",", ".");
          item.LON = item.LON.replace(",", ".");
          nShp = firstShapeSHP == item.SHP ? 1 : 2;
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

      if (radius > 200) {
          radius = 200;
          console.log("radius forced to be 200m: possible bug. Linha [" + linha + "]");
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
              nStops = 1;
          } else if (!secondGotten || item.SENTIDO == tmpStopWay) {
              stopsB.push(item);
              secondGotten = true;
              nStops = 2;
          } else {
              stopsC.push(item);
              nStops = 3;
          }
      });

      stopsA.sort(compare);
      stopsB.sort(compare);
      stopsC.sort(compare);

      //console.log("nShp: " + nShp);
      //console.log("nStops: " + nStops);
      //console.log("shape: " + shape.length);
      //console.log("stops: " + stops.length);
      //console.log("[" + stopsA.length + "] A: " + firstStopsWay);
      //console.log("[" + stopsB.length + "] B: " + tmpStopWay);
      //console.log("[" + stopsC.length + "] C: " + stops[stops.length - 1].SENTIDO);

      /**
       * Determinate 'sentidos'
       **/
      /*if (nShp == 1 && nStops == 1) {
          console.log("nShp: 1 and nStops: 1 on linha[" + linha + "]");
          //it just has one SHP and one Sentido
          getReferentShapePoint(shape, stops, radius);
      } else if (nShp = 1 && nStops == 2) {
        console.log("nShp: 1 and nStops: 2 on linha[" + linha + "]");
          //it has one SHP and two Sentidos: possible use of shp (shape)
          //for go and back. ex. 222
          //So, duplicate an inverse shape
          var tmpShape = shape;
          tmpShape.reverse();
          $.each(tmpShape, function(i, item) {
              shape.push(item);
          });
          //Determinate wich Stops is first
          var firstShape = new google.maps.LatLng(shape[0].LAT, shape[0].LON);
          var firstStopA = new google.maps.LatLng(stopsA[0].LAT, stopsA[0].LON);
          var firstStopB = new google.maps.LatLng(stopsB[0].LAT, stopsB[0].LON);

          var distanceToA = distanceBetweenPoints(firstShape, firstStopA);
          var distanceToB = distanceBetweenPoints(firstShape, firstStopB);

          var sortedStops = [];

          if(distanceToA < distanceToB){
            sortedStops = getSortedStops(stopsA, stopsB, stopsC);
          }else{
            sortedStops = getSortedStops(stopsB, stopsA, stopsC);
          }

          //build Json
          getReferentShapePoint(shape, sortedStops, radius);
      } else if (nShp == 1 && nStops == 3) {
          //Unnormal state, report
          console.log("[unnormal state] nShp: 1 and nStops: 3 on linha[" + linha + "]");
      } else if (nShp == 2 && nStops == 1) {
          //Unnormal state, report
          console.log("[unnormal state] nShp: 2 and nStops: 1 on linha[" + linha + "]");
      } else if (nShp == 2 && nStops == 2){
        console.log("nShp: 2 and nStops: 2 on linha[" + linha + "]");
        //it jhas two SHP and two Sentido
        //Determinate wich Stops is first
        var firstShape = new google.maps.LatLng(shape[0].LAT, shape[0].LON);
        var firstStopA = new google.maps.LatLng(stopsA[0].LAT, stopsA[0].LON);
        var firstStopB = new google.maps.LatLng(stopsB[0].LAT, stopsB[0].LON);

        var distanceToA = distanceBetweenPoints(firstShape, firstStopA);
        var distanceToB = distanceBetweenPoints(firstShape, firstStopB);

        var sortedStops = [];

        if(distanceToA < distanceToB){
          sortedStops = getSortedStops(stopsA, stopsB, stopsC);
        }else{
          sortedStops = getSortedStops(stopsB, stopsA, stopsC);
        }

        //build Json
        getReferentShapePoint(shape, sortedStops, radius);
      }else if(nShp == 2 && nStops == 3){
        console.log("nShp: 2 and nStops: 3 on linha[" + linha + "]");
        //Determinate wich Stops is first
        var firstShape = new google.maps.LatLng(shape[0].LAT, shape[0].LON);
        var firstStopA = new google.maps.LatLng(stopsA[0].LAT, stopsA[0].LON);
        var firstStopB = new google.maps.LatLng(stopsB[0].LAT, stopsB[0].LON);
        var firstStopC = new google.maps.LatLng(stopsC[0].LAT, stopsC[0].LON);

        var distanceToA = distanceBetweenPoints(firstShape, firstStopA);
        var distanceToB = distanceBetweenPoints(firstShape, firstStopB);
        var distanceToc = distanceBetweenPoints(firstShape, firstStopC);

        //Determinate wich Stops is last
        var lastShape = new google.maps.LatLng(shape[shape.length - 1].LAT, shape[shape.length - 1].LON);
        var lastStopA = new google.maps.LatLng(stopsA[stopsA.length - 1].LAT, stopsA[stopsA.length - 1].LON);
        var lastStopB = new google.maps.LatLng(stopsB[stopsB.length - 1].LAT, stopsB[stopsB.length - 1].LON);
        var lastStopC = new google.maps.LatLng(stopsC[stopsC.length - 1].LAT, stopsC[stopsC.length - 1].LON);

        var distanceToLastA = distanceBetweenPoints(lastShape, lastStopA);
        var distanceToLastB = distanceBetweenPoints(lastShape, lastStopB);
        var distanceToLastc = distanceBetweenPoints(lastShape, lastStopC);

        var sortedStops = [];

        if(distanceToA < distanceToB && distanceToA < distanceToC){
          // stopsA is first
          if(distanceToLastB < distanceToLastC){
            //stopsB is the last one, stopsA can't be the last one
            sortedStops = getSortedStops(stopsA, stopsC, stopsB);
          }else{
            //stopsC is the last one
            sortedStops = getSortedStops(stopsA, stopsB, stopsC);
          }

        }else if(distanceToB < distanceToA && distanceToB < distanceToC){
          // stopsB is first
          if(distanceToLastA < distanceToLastC){
            //stopsA is the last one, stopsB can't be the last one
            sortedStops = getSortedStops(stopsB, stopsC, stopsA);
          }else{
            //stopsC is the last one
            sortedStops = getSortedStops(stopsB, stopsA, stopsC);
          }

        }else if(distanceToC < distanceToA && distanceToC < distanceToB){
          // stopsC is first
          if(distanceToLastA < distanceToLastB){
            //stopsA is the last one, stopsB can't be the last one
            sortedStops = getSortedStops(stopsC, stopsB, stopsA);
          }else{
            //stopsB is the last one
            sortedStops = getSortedStops(stopsC, stopsA, stopsA);
          }
        }else{
          console.log("Something went wrong :(, nShp:2 and nStops: 3 on linha["+linha+"]");
        }

        console.log("=====================");
        console.log("nStops: " + nStops);
        console.log("nShp: "   + nShp);
        console.log("stops: "  + stops.length);
        console.log("shape: "  + shape.length);
        //build Json
        getReferentShapePoint(shape, sortedStops, radius);

      }else{
        console.log("ah?");
      }*/

      if (nShp == 2 && nStops == 3) {
          //console.log("nShp: 2 and nStops: 3 on linha[" + linha + "]");
          //Determinate wich Stops is first
          var firstShape = new google.maps.LatLng(shape[0].LAT, shape[0].LON);
          var firstStopA = new google.maps.LatLng(stopsA[0].LAT, stopsA[0].LON);
          var firstStopB = new google.maps.LatLng(stopsB[0].LAT, stopsB[0].LON);
          var firstStopC = new google.maps.LatLng(stopsC[0].LAT, stopsC[0].LON);

          var distanceToA = distanceBetweenPoints(firstShape, firstStopA);
          var distanceToB = distanceBetweenPoints(firstShape, firstStopB);
          var distanceToC = distanceBetweenPoints(firstShape, firstStopC);

          //console.log("Distance to A: " + distanceToA);
          //console.log("Distance to B: " + distanceToB);
          //console.log("Distance to C: " + distanceToC);

          //Determinate wich Stops is last
          var lastShape = new google.maps.LatLng(shape[shape.length - 1].LAT, shape[shape.length - 1].LON);
          var lastStopA = new google.maps.LatLng(stopsA[stopsA.length - 1].LAT, stopsA[stopsA.length - 1].LON);
          var lastStopB = new google.maps.LatLng(stopsB[stopsB.length - 1].LAT, stopsB[stopsB.length - 1].LON);
          var lastStopC = new google.maps.LatLng(stopsC[stopsC.length - 1].LAT, stopsC[stopsC.length - 1].LON);

          var distanceToLastA = distanceBetweenPoints(lastShape, lastStopA);
          var distanceToLastB = distanceBetweenPoints(lastShape, lastStopB);
          var distanceToLastC = distanceBetweenPoints(lastShape, lastStopC);

          //console.log("Distance to Last A: " + distanceToLastA);
          //console.log("Distance to Last B: " + distanceToLastB);
          //console.log("Distance to Last C: " + distanceToLastC);

          var sortedStops = [];

          if (distanceToA < distanceToB && distanceToA < distanceToC) {
              // stopsA is first
              if (distanceToLastB < distanceToLastC) {
                  //stopsB is the last one, stopsA can't be the last one
                  sortedStops = getSortedStops(stopsA, stopsC, stopsB);
              } else {
                  //stopsC is the last one
                  sortedStops = getSortedStops(stopsA, stopsB, stopsC);
              }

          } else if (distanceToB < distanceToA && distanceToB < distanceToC) {
              // stopsB is first
              if (distanceToLastA < distanceToLastC) {
                  //stopsA is the last one, stopsB can't be the last one
                  sortedStops = getSortedStops(stopsB, stopsC, stopsA);
              } else {
                  //stopsC is the last one
                  sortedStops = getSortedStops(stopsB, stopsA, stopsC);
              }

          } else if (distanceToC < distanceToA && distanceToC < distanceToB) {
              // stopsC is first
              if (distanceToLastA < distanceToLastB) {
                  //stopsA is the last one, stopsB can't be the last one
                  sortedStops = getSortedStops(stopsC, stopsB, stopsA);
              } else {
                  //stopsB is the last one
                  sortedStops = getSortedStops(stopsC, stopsA, stopsA);
              }

          } else {
              //console.log("Something went wrong :(, nShp:2 and nStops: 3 on linha[" + linha + "]");
              //console.log("Takinf default: A->B->C");
              //taken default
              sortedStops = getSortedStops(stopsA, stopsB, stopsC);
          }

          //build Json
          getReferentShapePoint(shape, sortedStops, radius);
          console.log("=====================");


      } else {
          console.log("damm");
          //Determinate wich Stops is first
          var firstShape = new google.maps.LatLng(shape[0].LAT, shape[0].LON);
          var firstStopA = new google.maps.LatLng(stopsA[0].LAT, stopsA[0].LON);
          var firstStopB = new google.maps.LatLng(stopsB[0].LAT, stopsB[0].LON);

          var distanceToA = distanceBetweenPoints(firstShape, firstStopA);
          var distanceToB = distanceBetweenPoints(firstShape, firstStopB);

          console.log("Distance to A: " + distanceToA);
          console.log("Distance to B: " + distanceToB);

          var sortedStops = [];

          if (distanceToA < distanceToB) {
              console.log("go A first: " + stopsA[0].SENTIDO);
              sortedStops = getSortedStops(stopsA, stopsB, stopsC);
          } else {
              console.log("go B first: " + stopsB[0].SENTIDO);
              sortedStops = getSortedStops(stopsB, stopsA, stopsC);
          }
          getReferentShapePoint(shape, sortedStops, radius);
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
      var firstIndexRecluded = -1;

      //$.each(shapeTmp, function(i, shapePoint) {
      for (var i = 0; i < shapeTmp.length; i++) {
          var shapePoint = shapeTmp[i];

          var shapePointLoc = new google.maps.LatLng(shapePoint.LAT, shapePoint.LON);
          var stopLoc = new google.maps.LatLng(stopsTmp[stopIndex].LAT, stopsTmp[stopIndex].LON);
          distShapeToStop = distanceBetweenPoints(shapePointLoc, stopLoc); //get distance between shape to next stop (stopsTmp[stopIndex])

          if (stopIndex == 0) { //begin
              console.log("add: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
              console.log("shape [" + i + "] is on radius (" + distShapeToStop + "m) for: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME + " (" + stopsTmp[stopIndex].SENTIDO + ") " + stopsTmp[stopIndex].SEQ);
              console.log("---------");
              addStop(stopsTmp[stopIndex], distShapeToStop);
              addShapePoint(shapePoint, distanceBetweenPoints(
                  new google.maps.LatLng(shapePoint.LAT, shapePoint.LON),
                  new google.maps.LatLng(shapeTmp[i + 1].LAT, shapeTmp[i + 1].LON)));
              stopIndex++; //next stop
          } else if (stopIndex == stopsTmp.length - 1 && i == shapeTmp.length - 1) { //last stop and last shape
              console.log("add: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
              console.log("shape [" + i + "] is on radius (" + distShapeToStop + "m) for: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME + " (" + stopsTmp[stopIndex].SENTIDO + ") " + stopsTmp[stopIndex].SEQ);
              console.log("---------");
              addShapePoint(shapePoint, 0);
              addStop(stopsTmp[stopIndex], distShapeToStop);
          } else {
              //console.log("stopIndex: " + stopIndex + "["+(stopsTmp.length - 1)+"]");
              //console.log("i: " + i + "["+(shapeTmp.length - 1)+"]");
              addShapePoint(shapePoint, distanceBetweenPoints(
                  new google.maps.LatLng(shapePoint.LAT, shapePoint.LON),
                  new google.maps.LatLng(shapeTmp[i + 1].LAT, shapeTmp[i + 1].LON)));

              console.log("shape [" + i + "] dist(" + distShapeToStop + "m) for: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME + " (" + stopsTmp[stopIndex].SENTIDO + ") " + stopsTmp[stopIndex].SEQ);

              if (distShapeToStop <= radius) { //radius in meters
                  if (distShapeToStop < distController) {
                      distController = distShapeToStop;
                      indexController = i;
                      if(!recluting){
                        firstIndexRecluded = i;
                      }
                  }
                  recluting = true;
                  //console.log("shape [" + i + "] is on radius (" + distShapeToStop + "m) for: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME + " ("+stopsTmp[stopIndex].SENTIDO+") " + stopsTmp[stopIndex].SEQ);
              } else {
                  if (recluting) {
                      //make change
                      var p1 = new google.maps.LatLng(shapeTmp[indexController].LAT, shapeTmp[indexController].LON);
                      var p2 = new google.maps.LatLng(stopsTmp[stopIndex].LAT, stopsTmp[stopIndex].LON);

                      distShapeToStop = distanceBetweenPoints(p1, p2); //get distance between shape to next stop (stopsTmp[stopIndex])
                      addStop(stopsTmp[stopIndex], distShapeToStop);
                      //console.log("-> goes: " + indexController); //just index, get object
                      distController = radius + 1;
                      indexController = -1;
                      //console.log("add: [" + stopIndex + "]" + stopsTmp[stopIndex].NOME);
                      //console.log("---------");

                      if(stopsTmp[stopIndex].SEQ > stopsTmp[stopIndex + 1].SEQ){
                        i = firstIndexRecluded;
                      }else{
                        i--;
                        firstIndexRecluded = -1;
                      }
                      stopIndex++; //next stop
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

  function getSortedStops(firstStops, secondStops, thirdStops) {

      var sortedStops = [];
      $.each(firstStops, function(i, stop) {
          sortedStops.push(stop);
      });

      $.each(secondStops, function(i, stop) {
          sortedStops.push(stop);
      });

      $.each(thirdStops, function(i, stop) {
          sortedStops.push(stop);
      });

      return sortedStops;

  }

  function compare(a, b) {
      if (a.SEQ < b.SEQ)
          return -1;
      if (a.SEQ > b.SEQ)
          return 1;
      return 0;
  }
