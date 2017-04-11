

$(document).ready(function() {

    getJsonFromServer('225', false, 111).then(function(result) {
        console.log(result); // "Stuff worked!"
    }, function(err) {
        console.log(err); // Error: "It broke"
    });

    getJsonFromServer('001', true, 222).then(function(result) {
        console.log(result); // "Stuff worked!"
    }, function(err) {
        console.log(err); // Error: "It broke"
    });

    getJsonFromServer('002', true, 333).then(function(result) {
        console.log(result); // "Stuff worked!"
    }, function(err) {
        console.log(err); // Error: "It broke"
    });

    getJsonFromServer('160', false, 444).then(function(result) {
        console.log(result); // "Stuff worked!"
    }, function(err) {
        console.log(err); // Error: "It broke"
    });

    getJsonFromServer('050', false, 555).then(function(result) {
        console.log(result); // "Stuff worked!"
    }, function(err) {
        console.log(err); // Error: "It broke"
    });

    getJsonFromServer('182', true, 666).then(function(result) {
        console.log(result); // "Stuff worked!"
    }, function(err) {
        console.log(err); // Error: "It broke"
    });

    getJsonFromServer('208', true, 777).then(function(result) {
        console.log(result); // "Stuff worked!"
    }, function(err) {
        console.log(err); // Error: "It broke"
    });

    getJsonFromServer('216', true, 888).then(function(result) {
        console.log(result); // "Stuff worked!"
    }, function(err) {
        console.log(err); // Error: "It broke"
    });

    getJsonFromServer('256', true, 999).then(function(result) {
        console.log(result); // "Stuff worked!"
    }, function(err) {
        console.log(err); // Error: "It broke"
    });

});
