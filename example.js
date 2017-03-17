/**
* This Json is ideal to show the routes and the stops for the Cutitba's busses
* Basically, each point has the same info given by the URBS API. However we need
* to add some fields:
*   stop: Indicates that the point is an bus stop (e.g. Terminal Cabral)
*   disNext: The distance in meters between that point and the next point
*            (e.g. 550)
* READ: The most important part of this Json is the "order", this means that each
* point is exactly consecutive (as they must to appear on Maps), the ROUTE (given
* by the 'getShapeLinha()') is already order, the STOPS (given by 'getPontosLinha()')
* has a field called "seq" that shows the order of stops, becareful with the 'sentido'
* because it separates the "seq" (e.g. seq 1, sentido Boa vista; seq 2, sentido Boa Vista;
* seq 1, sentido Barrio Alto).    
**/

{
  "success": true, // request was ok
  "pontos": [
    {
      "stop": true,
      "nome": "Terminal Bairro Alto - 342 - Bairro Alto / Boa Vista",
      "num": "104005",
      "lat": -25.41291,
      "lng": -49.20507,
      "seq": "1",
      "grupo": "14476",
      "sentido": "Terminal Boa Vista",
      "tipo": "Plataforma",
      "disNext": 500
    },
    {
      "stop": false,
      "shp": "1875",
      "lat": -25.412958780056595,
      "lng": -49.205051721461075,
      "cod": "342",
      "disNext": 550
    },
    /** other points **/
    {
      "stop": false,
      "shp": "1875",
      "lat": -25.413019049907724,
      "lng": -49.20520813865778,
      "cod": "342",
      "disNext": 450
    },
    {
      "stop": true,
      "nome": "Rua Albino Kaminski, 423 - Bairro Alto",
      "num": "130192",
      "lat": -25.410306390921,
      "lng": -49.204293906746,
      "seq": "2",
      "grupo": "",
      "sentido": "Terminal Boa Vista",
      "tipo": "Chapéu chinês",
      "disNext": 600
    },
    {
      "stop": false,
      "shp": "1875",
      "lat": -25.412958780056595,
      "lng": -49.205051721461075,
      "cod": "342",
      "disNext": 550
    },
    {
      "stop": false,
      "shp": "1875",
      "lat": -25.413019049907724,
      "lng": -49.20520813865778,
      "cod": "342",
      "disNext": 450
    }
    /** other points **/
    /** ... **/
    /** last stop **/
  ]
}
