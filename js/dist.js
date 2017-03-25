var server = 'https://raw.githubusercontent.com/jrodriguezv10/Routes/master/tmp';
var loadedShape = false;
var loadedStops = false;
var shape;
var stops;

$(document).ready(function() {
    $.ajax({
        url: '/linha225.json',
        type: 'GET',
        dataType: "json",
        success: function(response) {
            shape = response,
            loadedShape = true;
            if(loadedShape && loadedStops){
              createJson();
            }
        },
        error: function(response) {
            console.log("Problems getting Shape");
        }
    });

    $.ajax({
        url: '/pontos225.json',
        type: 'GET',
        dataType: "json",
        success: function(response) {
            stops = response;
            loadedStops = true;
            if(loadedShape && loadedStops){
              createJson();
            }
        },
        error: function(response) {
            console.log("Problems getting Stops (pontos)");
        }
    });

});

function createJson() {
  console.log("Let's go!");
}
