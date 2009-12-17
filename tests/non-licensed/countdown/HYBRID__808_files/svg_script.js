window.onload=onLoad;
function onLoad(){
	getTimeDifference();
}

function getTimeDifference(){
	var myDate=new Date();
	var millesecToNewYear=Date.parse("Jan 1, 2010");
	var millesecToToday=myDate.getTime();
	var dif=millesecToNewYear-millesecToToday;
	dif/=1000;
	var days = Math.floor( dif / ( 60 * 60 * 24 ) );
	dif -= days * 60 * 60 * 24;
	updateDays(days.toString());
	var hours= Math.floor( dif / (60 * 60) );
	dif -= hours * 60 * 60;
	updateHours(hours);
	var mins = Math.floor( dif / 60 );
	dif -= mins * 60;
	updateMinutes(mins);
	var secs = dif;
	updateSeconds(secs);
	/*var daysLeft=Math.floor(millesecLeft/86400000);
	var hoursLeft=Math.floor((millesecLeft%86400000)/86400000*24);
	var minutesLeft=millesecLeft/3600000-Math.floor(millesecLeft/3600000);
	minutesLeft=Math.ceil((Math.round(minutesLeft*1000)/1000)*60);
	var secondsLeft=millesecLeft/60000-Math.floor(millesecLeft/60000);
	secondsLeft=60-Math.ceil((Math.round(secondsLeft*1000)/1000)*60);
	updateDays(daysLeft.toString());
	updateHours(hoursLeft);
	updateMinutes(minutesLeft);
	updateSeconds(secondsLeft);*/
	setTimeout(getTimeDifference, 1000);
}

function updateDays(days){
	var svg_day1=document.getElementById('day1');
	var svg_text_day1=svg_day1.getElementsByTagNameNS(svgns, 'text');
	var svg_day2=document.getElementById('day2');
	var svg_text_day2=svg_day2.getElementsByTagNameNS(svgns, 'text');
	if(days.length==1){
		svg_text_day1[0].childNodes[0].nodeValue=0;
		svg_text_day2[0].childNodes[0].nodeValue=days.charAt(0);
	}else{
		svg_text_day1[0].childNodes[0].nodeValue=days.charAt(0);
		svg_text_day2[0].childNodes[0].nodeValue=days.charAt(1);
	}
	
}

function updateHours(hours){
		var hoursLeft_str=hours.toString();
		var svg_hour1=document.getElementById('hour1');
		var svg_text_hour1=svg_hour1.getElementsByTagNameNS(svgns, 'text');
		var svg_hour2=document.getElementById('hour2');
		var svg_text_hour2=svg_hour2.getElementsByTagNameNS(svgns, 'text');
		if(hoursLeft_str.length==1){
			svg_text_hour1[0].childNodes[0].nodeValue=0;
			svg_text_hour2[0].childNodes[0].nodeValue=hoursLeft_str.charAt(0);
			
		}else{
			svg_text_hour1[0].childNodes[0].nodeValue=hoursLeft_str.charAt(0);
			svg_text_hour2[0].childNodes[0].nodeValue=hoursLeft_str.charAt(1);
		}
		
}

function updateMinutes(minutes){
		var minutesLeft_str=minutes.toString();
		var svg_minute1=document.getElementById('minute1');
		var svg_text_minute1=svg_minute1.getElementsByTagNameNS(svgns, 'text');
		var svg_minute2=document.getElementById('minute2');
		var svg_text_minute2=svg_minute2.getElementsByTagNameNS(svgns, 'text');
		if(minutesLeft_str.length==1){
			svg_text_minute1[0].childNodes[0].nodeValue=0;
			svg_text_minute2[0].childNodes[0].nodeValue=minutesLeft_str.charAt(0);
			
		}else{
			svg_text_minute1[0].childNodes[0].nodeValue=minutesLeft_str.charAt(0);
			svg_text_minute2[0].childNodes[0].nodeValue=minutesLeft_str.charAt(1);
		}
}

function updateSeconds(seconds){
	var secondsLeft_str=seconds.toString();
		var svg_second1=document.getElementById('second1');
		var svg_text_second1=svg_second1.getElementsByTagNameNS(svgns, 'text');
		var svg_second2=document.getElementById('second2');
		var svg_text_second2=svg_second2.getElementsByTagNameNS(svgns, 'text');
		if(seconds<10){
			svg_text_second1[0].childNodes[0].nodeValue=0;
			svg_text_second2[0].childNodes[0].nodeValue=secondsLeft_str.charAt(0);
			
		}else{
			svg_text_second1[0].childNodes[0].nodeValue=secondsLeft_str.charAt(0);
			svg_text_second2[0].childNodes[0].nodeValue=secondsLeft_str.charAt(1);
		}
}