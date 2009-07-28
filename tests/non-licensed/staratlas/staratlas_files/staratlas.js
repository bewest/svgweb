var SA = {};
	
//var svgns = 'http://www.w3.org/2000/svg';
//var xlinkns = 'http://www.w3.org/1999/xlink';
 
 
 
var svgroot = null;

SA.chart = null;


SA.cr = 400; // Chart radius
SA.cx = 420; // Chart center, x-coord
SA.cy = 420; // Chart center, y-coord

SA.fontstring = "Andale Mono, Andale Mono IPA, Lucida Console";



//setcookie adapted from web.blazonry examples
SA.setcookie = function (name, value) {
	var exp = new Date();	    //set new date object	
	exp.setTime(exp.getTime() + (1000 * 60 * 60 * 24 * 30));     //set it 30 days ahead 
	document.cookie = name + "=" + escape(value) + "; path=/" + ((exp == null) ? "" : "; expires=" + exp.toGMTString()); 
}

//getcookie adapted from elated.com tutorial
SA.getcookie = function (name) {
	var results = document.cookie.match ( '(^|;) ?' + name + '=([^;]*)(;|$)' );

  	if ( results )
    	return ( unescape ( results[2] ) );
  	else
    	return null;
}


SA.julianDate = function(unix_time) {
	return (unix_time/86400000 + 2440587.5);
}

SA.normalize = function(value) {
	if (value < 0) return (Math.PI*2 + value%(Math.PI*2));
	else return value%(Math.PI*2);
}
	



//Degrees to radians
SA.deg2rad = function(degrees) {
	return ((degrees * Math.PI)/180);
}

//Radians to degrees
SA.rad2deg = function(rads) {
	return ((rads * 180)/Math.PI);
}

SA.polar2xy = function(alt, az) {
	var z = (.5*Math.PI - alt)/2;
	z = Math.tan(z);
	

	

	var y = Math.cos(az) * z;
	var x = Math.sin(az) * z;

	// 

	// Transform x, y 
	x = SA.cx - x * SA.cr;		
	y = SA.cy - y * SA.cr;
	return [x, y];
}

SA.radec2altaz = function(ra, dec) {

	var ha = SA.normalize(SA.lmst - ra); //Hour angle
	var alt; //Altitude
	var az; //Azimuth
	
	var lat = SA.latitude;
	


	alt = Math.asin(Math.sin(dec)*Math.sin(lat) 
		+ Math.cos(dec)*Math.cos(lat)*Math.cos(ha));

	az = Math.acos((Math.sin(dec)-Math.sin(alt)*Math.sin(lat)) / (Math.cos(alt)*Math.cos(lat))); // Long equation
			

	if ((Math.sin(ha))>0) {
		az= 2*Math.PI - az;
	}

	return [alt, az];
}


SA.plotstar = function(x, y, mag) {
	//Set size based on magnitude
	var r = null;
	if (mag < 0) { r = 4;}
	else { 
		r = (6 - mag)/2;
	}
	if (r < 0) { r = 0.5; }
		
	
	var cir = null;
	

	
	cir = document.createElementNS(svgns, 'circle');
	cir.setAttributeNS(null, 'cx',x);
	cir.setAttributeNS(null, 'cy', y);
	cir.setAttributeNS(null, 'r', r);
	cir.setAttributeNS(null, 'stroke', 'none');
	cir.setAttributeNS(null, 'fill', '#fff');
		
	return cir;
	
}

SA.plotline = function(x1,y1,x2,y2) {
	var line = document.createElementNS(svgns, 'line');
	line.setAttributeNS(null, 'x1', x1);
	line.setAttributeNS(null, 'x2', x2);
	line.setAttributeNS(null, 'y1', y1);
	line.setAttributeNS(null, 'y2', y2);
	line.setAttributeNS(null, 'stroke', '#94bee5');
	line.setAttributeNS(null, 'opacity', '0.3');
	
	return line;
}


SA.plotstars = function() {
	//Plot all visible stars
	var a;
	var xy;
	for (var i = 0; i < stars.length; i++) {

		a = SA.radec2altaz(stars[i][0],stars[i][1]);

		if ((a[0] > 0) && (stars[i][2] <= 5.5)) {  //Above horizon?
			xy=SA.polar2xy(a[0],a[1]);
			svgroot.appendChild(SA.plotstar(xy[0], xy[1], stars[i][2]));

		}
	}
}

SA.plotconstellations = function() {
	//Plot constellation lines
	var a;
	var b;

	var xy1;
	var xy2;
	var m;  //slope
	for (var i = 0; i < constellations.length; i++) {
		a = SA.radec2altaz(constellations[i][0], constellations[i][1]);
		b = SA.radec2altaz(constellations[i][2], constellations[i][3]);
		
		if ((a[0] > 0) && (b[0] > 0)) {
			xy1 = SA.polar2xy(a[0], a[1]);
			xy2 = SA.polar2xy(b[0], b[1]);
			
			svgroot.appendChild(SA.plotline(xy1[0], xy1[1], xy2[0], xy2[1]));
		}

	}
}

SA.plotconstnames = function() {
	//Plot constellation names
	
	var a;
	var xy;
	
	for (var i = 0; i < constnames.length; i++) {
		a = SA.radec2altaz(constnames[i][0], constnames[i][1]);
		
		if (a[0] > (.0415*Math.PI)) {  //Name is 7.5 degrees above horizon
			var text = document.createElementNS(svgns, "text");
			var textstr = document.createTextNode(constnames[i][2], true);
			xy = SA.polar2xy(a[0], a[1]);
			text.setAttributeNS(null, 'x', xy[0]);
			text.setAttributeNS(null, 'y', xy[1]);
			text.setAttributeNS(null, 'font-family', SA.fontstring);
			text.setAttributeNS(null, 'font-size', '11px');
			text.setAttributeNS(null, 'fill', '#f7941d');
			text.setAttributeNS(null, 'opacity', '.50');
			text.appendChild(textstr);
			svgroot.appendChild(text);
		}
	}
}

SA.plotcompasspoint = function(letter, x, y) {
	var text = document.createElementNS(svgns, "text");
	var textstr = document.createTextNode(letter, true);
	
	text.setAttributeNS(null, "x", x);
	text.setAttributeNS(null, "y", y);
	text.setAttributeNS(null, "font-family", SA.fontstring);
	text.setAttributeNS(null, "font-size", "14px");
	text.setAttributeNS(null, "fill", "#f7941d");
	text.appendChild(textstr);
	return text;
	

}

SA.plotchartcircle = function() {
	var cir = null;
	var strokeColor = 'white';
	var strokeWidth = '0.5';
	

	
	cir = document.createElementNS(svgns, 'circle');
	cir.setAttributeNS(null, 'cx', SA.cx);
	cir.setAttributeNS(null, 'cy', SA.cy);
	cir.setAttributeNS(null, 'r', SA.cr);
	cir.setAttributeNS(null, 'stroke', strokeColor);
	cir.setAttributeNS(null, 'stroke-width', strokeWidth);
	
	
	return cir;
	}
	
SA.locationPrompt = function () {
	var lat;
	var lng;
	geocoder = new GClientGeocoder();
	
	var addr = prompt("Enter a zip code or 'city, state' or 'city, country'.", "Huber Heights, OH");

	if ((addr) && (geocoder)) {
		geocoder.getLatLng(addr,
			function(point) {
				if (!point) {
					alert(addr + " not located.");
				} else {
					//Stop current animation
					clearInterval(SA.interval);

					lat = point.lat();
					lng = point.lng();
					
					//Set cookies for addr, lat and lng
					SA.setcookie("address", addr );
					SA.setcookie("lat",lat);
					SA.setcookie("lng",lng);
					
					SA.generateChart(addr, lat, lng, SA.date);
					SA.interval = setInterval(function () {SA.animate(addr,lat,lng);}, 1000);
				}
			}
		);
	}
}

SA.printlocation = function(addr, lat, lng) {
		var text=addr.toLowerCase() + "<br/>lat=" + lat.toFixed(3) + ", lng=" + lng.toFixed(3) + "  <a href='javascript:void(0)' onclick='SA.locationPrompt()'>[set]</a>";
		document.getElementById("location").innerHTML = text;

}
			
SA.printtime = function(date) {
		var text=date.toGMTString().toLowerCase();
		document.getElementById("time").innerHTML = text;		
}

SA.generateChart = function (addr, lat, lng, date) {

	SA.longitude = SA.deg2rad(lng);
	SA.latitude = SA.deg2rad(lat);

	//Greenwich Mean Sidereal Time, low-precision formula
	SA.gmst = SA.normalize(SA.deg2rad(280.46061837 + 360.98564736629 * (SA.julianDate(date) - 2451545.0)));
	//Local Mean Sidereal Time
	SA.lmst = SA.normalize(SA.gmst + SA.longitude);

	//Plot bounding circle
	svgroot.appendChild(SA.plotchartcircle());
	
	//Plot compass points
	svgroot.appendChild(SA.plotcompasspoint("n",420, 12));
	svgroot.appendChild(SA.plotcompasspoint("e",7,420));
	svgroot.appendChild(SA.plotcompasspoint("w",830,420));
	svgroot.appendChild(SA.plotcompasspoint("s",420,832));
	
	//Plot location text
	SA.printlocation(addr, lat, lng);
	
	SA.printtime(date);
	
	SA.plotstars();
	SA.plotconstellations();
	SA.plotconstnames();
	
}

window.onload = function () {
	svgroot=document.getElementById("canvas");
	

	//Default observer coords
	var addr = "Huber Heights, OH";	
	var lng = -84.1917;
	var lat = 39.7589;
	
	SA.date = new Date();
	
	if (SA.getcookie("address")) {
		addr = SA.getcookie("address");
		lat = parseFloat(SA.getcookie("lat"));
		lng = parseFloat(SA.getcookie("lng"));
		
		
		//Reset expiration date for cookie to 60 days in the future
		SA.setcookie("address",addr);
		SA.setcookie("lat", lat);
		SA.setcookie("lng",lng);
	} 
	// commented out by bradneuberg
	/*else if (google.loader.ClientLocation) {
		var cl = google.loader.ClientLocation;
		lat = cl.latitude;
		lng = cl.longitude;

		addr = cl.address.city + ", " + cl.address.country;
		
	}*/
	// added by bradneuberg
  lat = 37.687;
  lng = -122.407;
  
	SA.generateChart(addr, lat, lng, SA.date);

};
