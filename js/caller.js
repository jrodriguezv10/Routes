  var jsonResponsePontos = [];

  $(document).ready(function() {
      setDataRuta();
  })

  function addPonto(name, value, checked) {
      jsonResponsePontos.push({
          name: '[' + value + '] ' + name,
          value: value,
          checked: checked
      });

  }

  /*var codLinha = [];
  var nomeLinha = [];*/
  var cadenaSelect = "<select class='form-control' multiple id='linhaSelector' >";

  function setDataRuta() {
      var uri = "https://raw.githubusercontent.com/jrodriguezv10/Routes/master/linhas/getLinhas.json";

      $.ajax({
          type: 'GET',
          url: uri,
          dataType: 'json',
          success: function(response) {
              response.sort(compareLinhas);
              $.each(response, function(index, data) {
                  if(isSupported(data.COD)){
                    condicionIgual[index] = data.COD;
                    $("#linhaSelector").append(new Option("[" + data.COD + "] " + data.NOME, data.COD));
                    addPonto(data.NOME, data.COD, false);
                  }
              });

              $.each(response, function(index, data) {
                  if(!isSupported(data.COD)){
                    condicionIgual[index] = data.COD;
                    $("#linhaSelector").append(new Option("(Not) [" + data.COD + "] " + data.NOME, data.COD));
                    addPonto(data.NOME, data.COD, false);
                  }
              });

              //console.log(jsonResponsePontos);
              $('select[multiple]').multiselect('loadOptions', jsonResponsePontos);

          },
          error: function() {
              console.log("error");
          },

      });

  }


  function getDataRuta(linha, sent, identifier, pos) {
      return new Promise(function(done, reject) {
          done(getJsonFromServer(linha, sent, identifier, pos));
      })
  }

  function printLegend(jsonResponse, pos) {
      var html = "";
      var distanciaPontos = 0;

      fullNamePonto = " Linha " + jsonResponse.identifier;
      var id = "'" + jsonResponse.identifier + "'";
      html = '<div class="rem"><div id="btnPonto" class="btn-map" style="color: #fff;font-size: 18px;background:' + colores[jsonResponse.pos] + ';" onclick="hideTouteLegend(' + id + ')"><img src="img/bus.png" style="margin:5px;" width="25px"/> ' + fullNamePonto + '</div>';
      html += '<div id="r-' + jsonResponse.identifier + '" style="display: none;background: #fff; padding: 10px">';

      html += "<div class='form-group row'>";
      html += "<label for='distancia' class='col-2 col-form-label'><img src='img/busGris.png' width='25px'/>  </label>";
      html += "<div class='col-10'>";
      html += "<label id='distancia' style='color: #000000;font-size: 18px;font-weight: bold;'>" + jsonResponse.points[0].sentido.trim() + "</label>";
      html += "</div>";
      html += "</div>";
      //console.debug(jsonResponse);
      var flag = true;

      var firstTime = true;
      var distStop = 0;

      var totalSentido = jsonResponse.points[0].sentido;
      var totalGo = 0;
      var totalBack = 0;
      var totalTmp = 0;

      $.each(jsonResponse.points, function(i, point) {
          if (point.stop) {

            if(point.sentido == jsonResponse.points[0].sentido){
              totalGo += point.disStop + totalTmp;
            }else{
              totalBack += point.disStop + totalTmp;
            }

            totalTmp = point.disStop;

              if (point.sentido != jsonResponse.points[0].sentido && flag) {

                  flag = false;
                  html += "<div class='form-group row'>";
                  html += "<label for='distancia' class='col-2 col-form-label'><img src='img/busGris.png' width='25px'/>  </label>";
                  html += "<div class='col-10'>";
                  html += "<label id='distancia' style='color: #000000;font-size: 18px;font-weight: bold;'>" + point.sentido.trim() + "</label>";
                  html += "</div>";
                  html += "</div>";
                  distStop = point.disStop;
              }

              html += "<div class='form-group row'>";
              html += "<label for='distancia' class='col-2 col-form-label'>" + (distStop + point.disStop) + "m</label>";
              html += "<div class='col-10'><label id='distancia'>";
              html += point.nome;
              html += "</label></div>";
              html += "</div>";
              //console.log("-> [" + (distStop + point.disStop) + "m] " + point.nome);
              distStop = point.disStop;
          } else {
              distStop += point.disNext;
              totalTmp += point.disNext;
          }


      });


      html += "<br><div><strong>Total recorrido [" + jsonResponse.points[0].sentido + "]: " + totalGo + "m </strong><div>";
      html += "<div><strong>Total recorrido ["+ jsonResponse.points[jsonResponse.points.length-1].sentido +"]: " + totalBack + "m </strong><div>";
      console.log("totalGo: " + totalGo);
      console.log("totalBack: " + totalBack);

      $("#routes").append(html);
  }


  function closeSettings(close) {
      var distance = (close ? "-" + ($("#setting-container").width() + 20) : "0") + "px";
      $("#setting-container").animate({
          left: distance
      }, 300);
      $("#open-settings").css("display", close ? "inline-block" : "none");
      $("#close-settings").css("display", close ? "none" : "inline-block");
  }


  var r225 = false;

  function hideTouteLegend(id) {
      var idKey = "#r-" + id;

      if (!r225) {

          $(idKey).fadeIn("fast", function() {
              // Animation complete
              r225 = true;
          });
      } else {
          $(idKey).fadeOut("fast", function() {
              // Animation complete
              r225 = false;
          });
      }
  }


  function compareLinhas(a, b) {
      if (a.COD < b.COD)
          return -1;
      if (a.COD > b.COD)
          return 1;
      return 0;
  }

  function isSupported(linha) {
      switch (linha) {
          case "203": return false;
          case "222": return false;
          case "518": return false;
          case "010": return false;
          case "011": return false;
          case "020": return false;
          case "021": return false;
          case "022": return false;
          case "023": return false;
          case "030": return false;
          case "040": return false;
          case "167": return false;
          case "176": return false;
          case "188": return false;
          case "201": return false;
          case "205": return false;
          case "209": return false;
          case "214": return false;
          case "229": return false;
          case "231": return false;
          case "232": return false;
          case "236": return false;
          case "243": return false;
          case "270": return false;
          case "271": return false;
          case "302": return false;
          case "331": return false;
          case "340": return false;
          case "378": return false;
          case "385": return false;
          case "389": return false;
          case "393": return false;
          case "462": return false;
          case "466": return false;
          case "472": return false;
          case "474": return false;
          case "489": return false;
          case "500": return false;
          case "502": return false;
          case "507": return false;
          case "508": return false;
          case "513": return false;
          case "516": return false;
          case "519": return false;
          case "522": return false;
          case "532": return false;
          case "533": return false;
          case "536": return false;
          case "540": return false;
          case "550": return false;
          case "551": return false;
          case "552": return false;
          case "602": return false;
          case "607": return false;
          case "609": return false;
          case "610": return false;
          case "615": return false;
          case "616": return false;
          case "617": return false;
          case "632": return false;
          case "643": return false;
          case "646": return false;
          case "649": return false;
          case "650": return false;
          case "653": return false;
          case "655": return false;
          case "656": return false;
          case "659": return false;
          case "668": return false;
          case "679": return false;
          case "681": return false;
          case "683": return false;
          case "685": return false;
          case "689": return false;
          case "690": return false;
          case "701": return false;
          case "706": return false;
          case "710": return false;
          case "711": return false;
          case "714": return false;
          case "716": return false;
          case "788": return false;
          case "809": return false;
          case "815": return false;
          case "822": return false;
          case "823": return false;
          case "829": return false;
          case "875": return false;
          case "911": return false;
          case "913": return false;
          case "915": return false;
          case "924": return false;
          case "989": return false;
          case "X11": return false;
          case "X12": return false;
          case "X14": return false;
          case "X25": return false;
          case "X32": return false;
          case "Z01": return false;
          default:
              return true;
      }

  }
