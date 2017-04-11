
$(document).ready(function() {
    getJsonFromServer('001', true, 111).then(function(result) {
        console.log(result); // "Stuff worked!"
    }, function(err) {
        console.log(err); // Error: "It broke"
    });

    getJsonFromServer('002', true, 222).then(function(result) {
        console.log(result); // "Stuff worked!"
    }, function(err) {
        console.log(err); // Error: "It broke"
    });

});
