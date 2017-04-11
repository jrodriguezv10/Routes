
$(document).ready(function() {
    getJsonFromServer('225', true, 123).then(function(result) {
        console.log(result); // "Stuff worked!"
    }, function(err) {
        console.log(err); // Error: "It broke"
    });
});
