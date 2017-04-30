let server = 'https://raw.githubusercontent.com/jrodriguezv10/Routes/master/linhas';
var colors = ["#378D3B", "#D22E2E", "#2F3E9E",
    "#1875D1", "#7A1EA1", "#d35400",
    "#16a085", "##666666"
];
google.maps.event.addDomListener(window, 'load', initializedMap);

function initializedMap() {
    console.log("DotA");
    var mapCanvas = document.getElementById('map');
    var mapOptions = {
        center: new google.maps.LatLng(-25.383948, -49.246980),
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        scrollwheel: false,
        styles: mapStylesGray
    }

    map = new google.maps.Map(mapCanvas, mapOptions);

    getShapeOf("022");
}

function getShapeOf(linha) {
    $.ajax({
        url: server + '/shapes/Shape' + linha + '.json',
        type: 'GET',
        dataType: "json",
        success: function(response) {
            divideSHP(response);
        },
        error: function(response) {
            reject(Error("Problems getting Shape"));
        }
    });

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

    printShape(shapesDivided);

}

function printShape(shapesDivided) {

}
