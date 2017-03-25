var server = 'https://raw.githubusercontent.com/jrodriguezv10/Routes/master/tmp';
var loadedShape = false;
var loadedStops = false;
var shape;
var stops;

$(document).ready(function() {
    $.ajax({
        url: server + '/linha225.json',
        type: 'GET',
        dataType: "json",
        success: function(response) {
            shape = response,
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

});

function createJson() {
    var shapeSHP = shape[0].SHP;
    var stopsWay = stops[0].SENTIDO;

    var shapeGo = [];
    var stopsGo = [];
    var shapeBack = [];
    var stopsBack = [];

    $.each(shape, function(i, item) {
      if(shapeSHP == item.SHP){
        shapeGo.push(item);
      }else{
        shapeBack.push(item);
      }
    });

    $.each(stops, function(i, item) {
      if(stopsWay == item.SENTIDO){
        stopsGo.push(item);
      }else{
        stopsBack.push(item);
      }
    });

    console.log("shapeGo: " + shapeGo.length + "["+shapeSHP+"]");
    console.log("stopsGo: " + stopsGo.length + "["+stopsWay+"]");
    console.log("shapeBack: " + shapeBack.length);
    console.log("stopsBack: " + stopsBack.length);
}
