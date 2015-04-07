/*********************************************************************\
*                                                                     *
* MeetMeMidway                                       by Monik Pamecha *
*                                                 monik[at]etiole.com *
***********************************************************************
*                                                                     *
* Version 1.0       6-May-2014                                        *
*                                                                     *
\*********************************************************************/

var markers = new Array(2);
var directionsDisplay;
var selectedMode="DRIVING";
var polyline = null;

		function initialize() {
  var mapOptions = {
    center: new google.maps.LatLng(40.8667, -34.5667),
    zoom: 2,
    mapTypeControl : false,
  };
  var map = new google.maps.Map(document.getElementById('map-canvas'),
    mapOptions);

  var infowindow = new google.maps.InfoWindow({maxWidth: 200});

  var input_one = document.getElementById('loc-1');
  var input_two = document.getElementById('loc-2');
  var autocomplete_one = new google.maps.places.Autocomplete(input_one);
  var autocomplete_two = new google.maps.places.Autocomplete(input_two);

  for(var i = 0; i<2; i++)
  {
    markers[i] = new google.maps.Marker({
    map: map,
    draggable:true,
    anchorPoint: new google.maps.Point(0, -29)
  });
  }


  polyline = new google.maps.Polyline({
    path: [],
    strokeColor: '#FF0000',
    strokeWeight: 3
    });

// listeners to capture updated location
google.maps.event.addListener(autocomplete_one, 'place_changed', function() {
  var objLocation = autocomplete_one.getPlace();
  autoComplete_Update(objLocation, 0);
});
google.maps.event.addListener(autocomplete_two , 'place_changed', function() {
  var objLocation = autocomplete_two.getPlace();
  autoComplete_Update(objLocation, 1);
});


function autoComplete_Update( objLocation, i ) {
  

    markers[i].setVisible(false);
    var place = objLocation;
    if (!place.geometry) {
      return;
    }

    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);  // Why 17? Because it looks good.
    }
    markers[i].setIcon(/** @type {google.maps.Icon} */({
      url: "http://maps.gstatic.com/mapfiles/place_api/icons/geocode-71.png",
      size: new google.maps.Size(71, 71),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(17, 34),
      scaledSize: new google.maps.Size(35, 35)
    }));



    markers[i].setPosition(place.geometry.location);


    markers[i].setVisible(true);

    hidePath();

}

$('#lock-options').click(function() {fitmap();});

$('.mode-select').click(function(){ selectedMode = $(this).attr("value") });

$('.locate').click(function(){ displayRoute(selectedMode);  });

$('.select-options input').click(function() {
  var add = $(this).attr('value');

})
function disableDragging()
{
  markers[0].setDraggable(false);
  markers[1].setDraggable(false);
}

function enableDragging()
{
  markers[0].setDraggable(true);
  markers[1].setDraggable(true);
}



function displayRoute(selectedMode) {

    hidePath();
    directionsService = new google.maps.DirectionsService();

    var start = markers[0].getPosition();
    var end = markers[1].getPosition();

    var rendererOptions = {
      map: map,
    }


    directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);// also, constructor can get "DirectionsRendererOptions" object
    // directionsDisplay.setMap(map);
    directionsDisplay.setOptions( { suppressMarkers: true } ); // map should be already initialized.

    var request = {
        origin : start,
        destination : end,
        travelMode : google.maps.TravelMode[selectedMode]
    };
    directionsService.route(request, function(response, status) {


      if (status == google.maps.DirectionsStatus.OK) {
        polyline.setPath([]);
        var bounds = new google.maps.LatLngBounds();
        startLocation = new Object();
        endLocation = new Object();
        directionsDisplay.setDirections(response);
        var route = response.routes[0];

        // For each route, display summary information.
    var path = response.routes[0].overview_path;
    var legs = response.routes[0].legs;
        for (i=0;i<legs.length;i++) {
          if (i == 0) { 
            startLocation.latlng = legs[i].start_location;
            startLocation.address = legs[i].start_address;
          }
          endLocation.latlng = legs[i].end_location;
          endLocation.address = legs[i].end_address;
          var steps = legs[i].steps;
          for (j=0;j<steps.length;j++) {
            var nextSegment = steps[j].path;
            for (k=0;k<nextSegment.length;k++) {
              polyline.getPath().push(nextSegment[k]);
              bounds.extend(nextSegment[k]);
            }
          }
        }

        // polyline.setMap(map);
        $(".panel-box").hide("fast");
        disableDragging();
        $(".results-box").show("fast");

        computeTotalDistance(response);
      } else {
        alert("directions response "+status);
      }

    });
}


function createMarker(latlng, label, html, iconimg) {
    var contentString = '<b>'+label+'</b><br>'+html;
    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title: label,
        zIndex: Math.round(latlng.lat()*-100000)<<5,
        icon : 'mapicons/'+iconimg+'.png',
        });
        marker.myname = label;

       
    google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(contentString); 
        infowindow.open(map,marker);
        });
    return marker;
}

var totalDist = 0;
var totalTime = 0;
      function computeTotalDistance(result) {
      totalDist = 0;
      totalTime = 0;
      var myroute = result.routes[0];
      for (i = 0; i < myroute.legs.length; i++) {
        totalDist += myroute.legs[i].distance.value;
        totalTime += myroute.legs[i].duration.value;      
      }
      putMarkerOnRoute(50);

      totalDist = totalDist / 1000.
      }

      function putMarkerOnRoute(percentage) {
        var distance = (percentage/100) * totalDist;
        var time = ((percentage/100) * totalTime/60).toFixed(2);

        middle = polyline.GetPointAtDistance(distance);

        createMarker(middle,"Hey,","<p>You're MidWay!</p>","half");
        placeSearch(middle, totalDist/10);
      }

  

function hidePath() {
  try { directionsDisplay.setMap(); } catch(err) { }
}

function placeSearch(latLng, dist)
{
  var typeList = [['restaurant'],['cafe'],['shopping_mall'],['movie_theater'],['night_club'],['park'],['bar']];
  for(i=0; i<typeList.length; i++)
  {
        request = {
            location: latLng,
            radius: dist,
            types: [typeList[i]],
        }

        var bindFunc = function (i) {
            return function (results, status) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    $("div.gm-style-cc").css("display", "none");
                  
                    var len = results.length;

                    lim = 5;
                    if (len != 0) {

                      if(lim>len)
                      {
                        lim=len;
                      }
                        for (j = 0; j < lim; j++) {
                            var name = results[j].name;

                            var lat2 = results[j].geometry.location.lat();
                            var lon2 = results[j].geometry.location.lng();

                            content = results[j].vicinity;

                            if(results[j].photos != undefined)
                            {
                            for(k=0; k<1; k++)
                             {
                               content += "<br/><br/><img src='"+results[j].photos[k].getUrl({'maxWidth': 200, 'maxHeight': 200})+"' /><br/>";
                          
                             }
                            }

                            if(results[j].rating!= undefined)
                            {
                              content+="<br/> Rating : "+results[j].rating;
                            }

                            createMarker(results[j].geometry.location,name,content,typeList[i]);
                        }

                        $('.'+typeList[i]+'-count').html(len);
                    }

                }
            }
        }

         service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, bindFunc(i));

    }

}

function fitmap()
{
    var bounds = new google.maps.LatLngBounds();
   if(markers[0]) { bounds.extend(markers[0].getPosition()); }
   if(markers[1]) {bounds.extend(markers[1].getPosition()); }
    map.fitBounds(bounds);

}

}

google.maps.event.addDomListener(window, 'load', initialize);

   
