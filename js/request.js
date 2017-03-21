var dataServicio = {
    "c": "44de3"
};

$.ajax({
    url: 'http://transporteservico.urbs.curitiba.pr.gov.br/getLinhas.php',
    type: 'GET',
    dataType: "json",
    data: dataServicio,
    success: function(response) {
        console.log(response);
    },
    error: function(response) {
        console.log("can't get response");
    }
});
