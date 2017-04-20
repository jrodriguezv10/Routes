$(document).ready(function() {

    getJsonFromServer('307', false, 111).then(function(result) {
        parseJson(result); // "Stuff worked!"
    }, function(err) {
        console.log(err); // Error: "It broke"
    });
});


function getLinha() {

    var value = $("#linha").val().split("-");
    getJsonFromServer(value[0], (value[1] == "true"), 111).then(function(result) {
        parseJson(result); // "Stuff worked!"
    }, function(err) {
        console.log(err); // Error: "It broke"
    });
}

function parseJson(result) {

    var distance = 0;
    var newJson = [];

    $.each(result.points, function(i, item) {

        if (i == 0) { //first stop
            //distance += item.disStop;
            newJson.push(item);
            item.disStop = distance;
            console.log("(" + distance + "m) [" + item.sentido + "] " + item.nome);
        } else if (item.stop) {
            distance += item.disStop;
            var tmp = item.disStop;
            item.disStop = distance;
            newJson.push(item);
            console.log("(" + distance + "m) [" + item.sentido + "] " + item.nome);
            distance = tmp;
        } else {
            distance += item.disNext;
        }

    });

    console.log(newJson);
    $(".code").remove();
    var html = "<div class='code'><pre>" + JSON.stringify(newJson, undefined, 2) + "</pre>";
    $("#div-code").append(html)

}
