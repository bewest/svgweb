///////////////////////////
// global variables go here

var left = 0; // remembers last position if hidden

var maxRegion = 413; // number of electoral parishes

var district = { id:[], cd:[], hb:[], colL: [], colR:[] };	// this is where all the DOM nodes for each electoral district get saved 
															// id : district ID
															// cd: district ID of clones map
															// hb : corresponding histogram bar
															// colL: colour of district Left map (default)
															// colR: colour of district Right map (two map view)
										
var sortArray = new Array(maxRegion);

var equalDistBoundaries = new Array();
var quantileBoundaries = new Array();
var classBoundaries = new Array();

var min;
var max;

var selectedData;   // column in dataset on display in current map
var colorNr;

var idcd ='id';  // position of control panel in 2 map view
var col ='colL';

var selectedDataLeft;
var selectedDataRight;

var mapCloneRoot = null;
var draggingCloneElement = null;

var histogramLayer = null;
var mapRoot = null;
var svgMap = new Object;

var controls = null;
var wkrName = null;

var CDUkopf = null; 

var cduAKTproz = null;
var spdAKTproz = null;
var grueneAKTproz = null;
var linkeAKTproz = null;
var fdpAKTproz = null;

var cduVORPproz = null;
var spdVORPproz = null;
var grueneVORPproz = null;
var linkeVORPproz = null;
var fdpVORPproz = null;


// end global variables
///////////////////////
            

// Dynamically Populating Select Menus Client-Side
// http://www.devarticles.com/c/a/JavaScript/Dynamically-Populating-Select-Menus-Client-Side/

function fillItems( intStart ) {

var fTypes = document.getElementById('form1').types;
var fItems = document.getElementById('form1').items;
var a = arItems;
var b, c, d, intItem, intType;

if ( intStart > 0 ) {
	for ( b = 0; b < a.length; b++ ) {
		if ( a[b][1] == intStart ) {
		intType = a[b][0];
		}
		}
		for ( c = 0; c < fTypes.length; c++ ) {
		if ( fTypes.options[ c ].value == intType ) {
		fTypes.selectedIndex = c;
		}
	}
}

if ( intType == null ) {
intType = fTypes.options[ fTypes.selectedIndex ].value
}

fItems.options.length = 0;
	for ( d = 0; d < a.length; d++ ) {
		if ( a[d][0] == intType ) {
		fItems.options[ fItems.options.length ] = new Option( a[d][2], a[d][1] );
		}
		if ( a[d][1] == intStart ) {
		fItems.selectedIndex = fItems.options.length - 1;
		}
	}
}


var tmpColor = 'ffffff';  // used to temporarily store the histogram bar color while hovering over it

function tellHist(MyHistID)	{

	// fuction gets called from histogramm with ID of the histogramm bar
	// myDistID is the ID of the electoral district in the map and in the dataset
	var MyDistID = sortArray[MyHistID][1];
  	
    tmpColor = district.hb[MyHistID].getAttribute('stroke');
    district.hb[MyHistID].setAttribute('stroke-width', 10);    
    district.hb[MyHistID].setAttribute('stroke', colorScheme[colorNr][6]);
   	
   	district[idcd][MyDistID].setAttribute('fill', colorScheme[colorNr][6]);
   	
	document.getElementById('wkr-id').firstChild.data=('Mouseover Value: '+ sortArray[MyHistID][0]);
    var hoverName = euw09Data[MyDistID][1] + '  ' + euw09Data[MyDistID][2];
    wkrName.firstChild.data=hoverName;
    updateTable(MyDistID);

	}


function clearHist(MyHistID) {
	
   	district[idcd][sortArray[MyHistID][1]].setAttribute('fill', district[col][sortArray[MyHistID][1]]);
    district.hb[MyHistID].setAttribute('stroke-width', 1.3);    
    district.hb[MyHistID].setAttribute('stroke', tmpColor);

	}
	

function tellMe(MyDistID)	{

	// fuction gets called from map with ID of the electoral district
	// myHistID is the ID of the corresponding Histogram bar

	district[idcd][MyDistID].setAttribute('fill', colorScheme[colorNr][6]);

    var hoverName = euw09Data[MyDistID][1] + '  ' + euw09Data[MyDistID][2];
    
    wkrName.firstChild.data=hoverName;
    updateTable(MyDistID);
    
    var hoverValue = euw09Data[MyDistID][Math.floor(selectedData)];
    document.getElementById('wkr-id').firstChild.data=('Mouseover Value: '+ hoverValue);
    
    if (controls.style.display == 'none') {
    	window.defaultStatus = hoverName+'   ||   '+document.getElementById('keyHead').firstChild.data+':  '+hoverValue;
		}
	}


function clearMe(MyDistID) {
	
	district[idcd][MyDistID].setAttribute('fill', district[col][MyDistID]);
	
	}


function sort2dim(a,b) {
    // this sorts the array using the first element    
    return ((a[0] < b[0]) ? -1 : ((a[0] > b[0]) ? 1 : 0));
	}


function statistics(selected) {
  
  if (Math.abs(selected) != 99) {
	selectedData= selected;
	var dataCol = Math.floor(selectedData);
  
  	document.getElementById('option1').selected = true; // reset classification dropdown

	// Check for 2-map-view and which side the control panel is on
	if (document.getElementById('2maps').checked == true && document.getElementById('LayoutControl').position[0].checked == true) {
	var clone='c'
	selectedDataRight = selectedData	// in 2 map view: save dataset selection for Map for later reuse in move(Right) and moveLeft()
	} else {
	var clone=''
	selectedDataLeft = selectedData
	}

	// Headline for Key and Map
	var year='';		
	for (i=0;i<arItems.length;i++) {
		if (arItems[i][1]==selectedData) {
			if (arItems[i][0]==1){year=' 2009'};
			if (arItems[i][0]==2){year=' 2004'};
			document.getElementById('keyHead').firstChild.data=(arItems[i][2]+year);
			document.getElementById('424'+clone).firstChild.data=(arItems[i][2]+year)
			}
		}
	
	for (i=0;i<maxRegion;i++){
	sortArray[i] = new Array(2);
	// two dim array: value (to be sorted), associated district ID
	sortArray[i][0] = euw09Data[i][dataCol];
	sortArray[i][1] = i;
	}

	// Sort numerically and ascending by value
	sortArray.sort(sort2dim);
	
	if (Math.abs(sortArray[0][0]) > 75 || Math.abs(sortArray[0][maxRegion-1]) > 75){
		min = Math.round(sortArray[0][0]);
		max = Math.round(sortArray[0][maxRegion-1]);
		} else {
		min = sortArray[0][0];
		max = sortArray[maxRegion-1][0];
		}

	// Quantiles
	var quantIncrement = Math.round(maxRegion/5);
		for (i=0;i<4;i++){
		quantileBoundaries[i]=sortArray[(i+1)*quantIncrement][0];
		}
	
	// Equal Distance Classification
	var increment = (max-min)/5;
		for (i=0;i<4;i++){
		if ((max-min)<10) {
			equalDistBoundaries[i]=Math.round((min+(i+1)*increment)*10)/10
			} else {
			equalDistBoundaries[i]=Math.round(min+(i+1)*increment)
			}
		}
		
	// change histogram bars
	var myY1 = 120*max/(max-min);
	for (i=0;i<(maxRegion);i++) {
	   if (min < 0) {
	   var myY2 = myY1 - (sortArray[i][0]*120/(max-min));
	   district.hb[i].setAttribute('y1', myY1+10); 
	   district.hb[i].setAttribute('y2', myY2+10);
	   } else {
	    district.hb[i].setAttribute('y1', 130);
	    district.hb[i].setAttribute('y2', 130-(sortArray[i][0]/max*120)); // scale max value to 90px
	   }
	 }
    
    // stick max value to the right y-axis (max-tick)
    document.getElementById('maxTick').firstChild.data=max;
	if (min<0) {
	tickMin=min
	} else {
	tickMin=0
	}
    document.getElementById('minTick').firstChild.data=tickMin;
    
    colorMap('default')        
  }

  if (selected == -99) {
  window.open('http://www.bundeswahlleiter.de/de/europawahlen/EU_BUND_09/strukturdaten/');
  fillItems(1)
  }
 
}


function colorMap(classMethod){

	if (classMethod=='default') {
		  	for (i=0;i<arItems.length;i++) {
			  if (arItems[i][1]==selectedData) {
			  for (n=0;n<4;n++) {
				classBoundaries[n]=arItems[i][3+n]
				}
			  }
			}
		  } 
	if (classMethod=='quantiles') {
		  //classBoundaries = quantileBoundaries;
   	      for (n=0;n<4;n++) {
				classBoundaries[n]=quantileBoundaries[n]
				}
	      } 
	if (classMethod=='equaldistance') {
		  //classBoundaries = equalDistBoundaries;
	      for (n=0;n<4;n++) {
				classBoundaries[n]=equalDistBoundaries[n]
				}
	      } 
	
	var mapVar = Math.floor(selectedData); 
	colorNr = Math.round((selectedData - mapVar)*10);
	
	// in 2 map view: colorize map opposite from control panel
	if (document.getElementById('2maps').checked == true && document.getElementById('LayoutControl').position[0].checked == true) {
    	var clone='c';
    	idcd ='cd';
    	col='colR'
    	} else {
    	var clone='';
    	idcd ='id'; 
    	col='colL'
    	}
	
	// colorize key
	for (i=0;i<5;i++){
	document.getElementById('color'+i).style.backgroundColor=colorScheme[colorNr][i+1];
	var key = document.getElementById((i+413)+clone);
	key.setAttribute('fill', colorScheme[colorNr][i+1]);
	}	
		
		var frequencies = [0,0,0,0,0];

		
		// colorize map
		
	    var suspendIDmap = mapRoot.suspendRedraw(5000);
		
		for (i=0;i<(maxRegion);i++){
			
			var mapPerc = euw09Data[i][mapVar];
			
			if (mapPerc < classBoundaries[0]) {
			district[idcd][i].setAttribute('fill', colorScheme[colorNr][1]);
			frequencies[0]+=1;
			}
			if (mapPerc >= classBoundaries[0] && mapPerc < classBoundaries[1]) {
			district[idcd][i].setAttribute('fill', colorScheme[colorNr][2]);
			frequencies[1]+=1;
			}
			if (mapPerc >= classBoundaries[1] && mapPerc < classBoundaries[2]) {
			district[idcd][i].setAttribute('fill', colorScheme[colorNr][3]);
			frequencies[2]+=1;
			}
			if (mapPerc >= classBoundaries[2] && mapPerc < classBoundaries[3]) {
			district[idcd][i].setAttribute('fill', colorScheme[colorNr][4]);
			frequencies[3]+=1;
			}
			if (mapPerc >= classBoundaries[3]) {
			district[idcd][i].setAttribute('fill', colorScheme[colorNr][5]);
			frequencies[4]+=1;
			}
			
			if (clone=='c') {
				district.colR[i] = district[idcd][i].getAttribute('fill');
				} else {
				district.colL[i] = district[idcd][i].getAttribute('fill');
				}
		}

	    mapRoot.unsuspendRedraw(suspendIDmap);


		for (i=0;i<5;i++){
			var tmpFreq = 'freq'+i;
			document.getElementById(tmpFreq).firstChild.data=frequencies[i];
			}

		// populate boundaries in key table
		for (i=0;i<4;i++){
		document.getElementById('percClass'+i).firstChild.data=classBoundaries[i];
		document.getElementById('limit'+(i+1)+'a').firstChild.data=classBoundaries[i];
		document.getElementById((i+419)+clone).firstChild.data=classBoundaries[i];
		}
		document.getElementById('max').firstChild.data=max;
		document.getElementById('min').firstChild.data=min;

		document.getElementById(418+clone).firstChild.data=min;
		document.getElementById(423+clone).firstChild.data=max;


		// colorize histogram
		
	    var suspendIDhist = histogramLayer.suspendRedraw(5000);
		
		for (i=0;i<(maxRegion);i++) {
        
		 if (sortArray[i][0] < classBoundaries[0]) {
	     district.hb[i].setAttribute('stroke', colorScheme[colorNr][1]);
	     }
	     if (sortArray[i][0] >= classBoundaries[0] && sortArray[i][0] < classBoundaries[1]) {
	     district.hb[i].setAttribute('stroke', colorScheme[colorNr][2]);
	     }
	     if (sortArray[i][0] >= classBoundaries[1] && sortArray[i][0] < classBoundaries[2]) {
	     district.hb[i].setAttribute('stroke', colorScheme[colorNr][3]);
	     }
	     if (sortArray[i][0] >= classBoundaries[2] && sortArray[i][0] < classBoundaries[3]) {
	     district.hb[i].setAttribute('stroke', colorScheme[colorNr][4]);
	     }
	     if (sortArray[i][0] >= classBoundaries[3]) {
	     district.hb[i].setAttribute('stroke', colorScheme[colorNr][5]);
	     }
		}
		
	    histogramLayer.unsuspendRedraw(suspendIDhist);
	    
	}

// updates table for given electoral ward
function updateTable(wkr){

	if (euw09Data[wkr][1]/1000 > 9 && euw09Data[wkr][1]/1000 < 10) {  // Bundesland = Bayern
	CDUkopf.firstChild.data='CSU';
	} else {
	CDUkopf.firstChild.data='CDU';
	}
	
	cduAKTproz.firstChild.data=euw09Data[wkr][5]+'%';
	spdAKTproz.firstChild.data=euw09Data[wkr][7]+'%';
	grueneAKTproz.firstChild.data=euw09Data[wkr][9]+'%';
	linkeAKTproz.firstChild.data=euw09Data[wkr][11]+'%';
	fdpAKTproz.firstChild.data=euw09Data[wkr][13]+'%';
	
	cduVORPproz.firstChild.data=euw09Data[wkr][6]+'%';
	spdVORPproz.firstChild.data=euw09Data[wkr][8]+'%';
	grueneVORPproz.firstChild.data=euw09Data[wkr][10]+'%';
	linkeVORPproz.firstChild.data=euw09Data[wkr][12]+'%';
	fdpVORPproz.firstChild.data=euw09Data[wkr][14]+'%';

	}

  
function newClassInput() {
	var l1 = document.forms['classification'].elements['limit1'].value;
	var l2 = document.forms['classification'].elements['limit2'].value;
	var l3 = document.forms['classification'].elements['limit3'].value;
	var l4 = document.forms['classification'].elements['limit4'].value;
	classBoundaries = [l1,l2,l3,l4];
	for (i=0;i<4;i++) {
		classBoundaries[i]=classBoundaries[i].replace(/,/, '.');
		classBoundaries[i]=classBoundaries[i].replace(/[^0-9\-.]/g, '');
		}
	colorMap('userinput')
	document.getElementById('option1').selected = true;
	}


function buildHistogramFrag() {
			
	histogramLayer = document.getElementById('histogramlines');
	
	var frag = document.createDocumentFragment(true);

	for (i=0;i<(maxRegion);i++) {
	
		var newLine = document.createElementNS(svgns,'line');
	    newLine.setAttributeNS(null, 'x1', i+3);
	    newLine.setAttributeNS(null, 'y1', 100);
	    newLine.setAttributeNS(null, 'x2', i+3);
	    newLine.setAttributeNS(null, 'y2', 50);
	    newLine.setAttributeNS(null, 'stroke-width', 1.3);
	    newLine.setAttributeNS(null, 'stroke','green');
	    
		district.hb[i] = newLine;
		
		district.hb[i].addEventListener('mouseover', function() { var ii = i;
					return function() { tellHist(ii) }; }(), false); 

		district.hb[i].addEventListener('mouseout', function() { var ii = i;
					return function() { clearHist(ii) }; }(), false); 

		frag.appendChild(newLine);

	    }

    histogramLayer.appendChild(frag);

	}


function buildHistogram() {
			
	histogramLayer = document.getElementById('histogramlines');

	for (i=0;i<(maxRegion);i++) {
	
		var newLine = document.createElementNS(svgns,'line');
	    newLine.setAttributeNS(null, 'x1', i+3);
	    newLine.setAttributeNS(null, 'y1', 100);
	    newLine.setAttributeNS(null, 'x2', i+3);
	    newLine.setAttributeNS(null, 'y2', 50);
	    newLine.setAttributeNS(null, 'stroke-width', 1.3);
	    newLine.setAttributeNS(null, 'stroke','green');
	    
		district.hb[i] = histogramLayer.appendChild(newLine);
		
		district.hb[i].addEventListener('mouseover', function() { var ii = i;
					return function() { tellHist(ii) }; }(), false); 

		district.hb[i].addEventListener('mouseout', function() { var ii = i;
					return function() { clearHist(ii) }; }(), false); 

	    }

	}


function resultPage(evt) {

		// if (evt.shiftKey==1) { alert('shift') }

		if (evt.altKey==1) {
		
		var myAGS = evt.target.id;

			if (myAGS <10000) {
				var myAGSn = '0' + myAGS;
				var myL = '0' + Math.floor(myAGS/1000);
			} else {
				var myAGSn = myAGS
				var myL = Math.floor(myAGS/1000);
			}
			
			var baseURL='http://www.bundeswahlleiter.de/de/europawahlen/EU_BUND_09/ergebnisse/kreisergebnisse/l';
			
			var myURL = baseURL + myL + '/k' + myAGSn + '/';
			
			// 16/k16073/k_tabelle_16073.html
			// 06/k06433/k_tabelle_6433.html
			//alert(myURL);
			
			window.open(myURL);
		 }
	}


var nMouseOffsetX = 0;
var nMouseOffsetY = 0;
 
var dragx = 0;
var dragy = 0;

var rootctm;
var irootctm;
var p;
 
function mouseDown(evt) { 
 
    svgMap.addEventListener("mousemove", mouseMove, false);

    p = mapRoot.createSVGPoint();
    p.x = evt.clientX;
    p.y = evt.clientY;
     
    rootctm = mapRoot.getScreenCTM();
    irootctm = rootctm.inverse();

    p = p.matrixTransform(irootctm);
         
    nMouseOffsetX = p.x - dragx;
    nMouseOffsetY = p.y - dragy;

}

function mouseMove(evt) { 
    // hack because removeEventListener is not implemented
    if (nMouseOffsetX == 0)
       return;
    p = mapRoot.createSVGPoint();
    p.x = evt.clientX;
    p.y = evt.clientY;
  
    p = p.matrixTransform(irootctm);
    p.x -= nMouseOffsetX;
    p.y -= nMouseOffsetY;

    dragx = p.x;
    dragy = p.y;

    svgMap.setAttribute('transform', 'translate('+p.x + ',' + p.y+')');   
}


function mouseUp(evt) { 

    svgMap.removeEventListener("mousemove", mouseMove, false);
    nMouseOffsetX = 0;
    nMouseOffsetY = 0;
}


function zoomHelp(){
	
	alert('Zooming and panning works\njust like on Google Maps:\n\nZOOM the map using your mousewheel\nPAN the map by dragging\n\n[Alt]+click one of the districts\nto see detailed data (external website)');
	
	}


function resetZoom(){

	svgMap.setAttributeNS(null, 'transform','translate( "0, 0")');
	svgMap.setAttributeNS(null, 'dragx', 0);
	svgMap.setAttributeNS(null, 'dragy', 0);
	mapRoot.setAttributeNS(null, 'viewBox','-340431 -475036 672623 911401');
		if (mapCloneRoot){
		mapCloneRoot.setAttributeNS(null, 'viewBox', '-340431 -475036 672623 911401')
		}
		
	}


// Mousewheel Scrolling thanks to
// http://blog.paranoidferret.com/index.php/2007/10/31/javascript-tutorial-the-scroll-wheel/

function hookEvent(element, eventName, callback)
{
  if(typeof(element) == 'string')
    element = document.getElementById(element);
  if(element == null)
    return;
  if(element.addEventListener)
  {
    if(eventName == 'mousewheel')
    {
      element.addEventListener('DOMMouseScroll', 
        callback, false);  
    }
    element.addEventListener(eventName, callback, false);
  }
  else if(element.attachEvent)
    element.attachEvent("on" + eventName, callback);
}


function MouseWheel(e)
{
  e = e ? e : window.event;
  var wheelData = e.detail ? e.detail * -1 : e.wheelDelta;
  //do something
  scrollZoom(wheelData)
}


function scrollZoom(wheeldata){
	if (wheeldata > 0) {
		var scale = 0.7 } else {
		var scale = 1.3
		};
	var myViewBox = mapRoot.getAttribute('viewBox');
    var viewboxes = myViewBox.split(' ');
    var ulXcorner = parseFloat(viewboxes[0]);
    var ulYcorner = parseFloat(viewboxes[1]);
	var myWidth = parseFloat(viewboxes[2]);
	var myHight = parseFloat(viewboxes[3]);
    var xCenter = ulXcorner + myWidth/2;
    var yCenter = ulYcorner + myHight/2;
	myWidth = myWidth/scale;
	myHight = myHight/scale;
	// limit zoom levels
	if (myWidth > 15000 && myWidth < 1000000) {
		ulXcorner = xCenter - myWidth/2;
		ulYcorner = yCenter - myHight/2;
		myViewBox = ulXcorner +' '+ ulYcorner +' '+ myWidth +' '+ myHight;
		mapRoot.setAttribute('viewBox', myViewBox)
			if (mapCloneRoot){
			mapCloneRoot.setAttribute('viewBox', myViewBox)
			}
		}
	}


function cloneMap(){
	mapRoot.setAttribute('viewBox','-377799 -525669 747359 1012668');
	mapRoot.setAttribute('width','471px');
	selectedDataRight = selectedData;
	selectedDataLeft = selectedData;

	var body = document.getElementsByTagName('body')[0];
	var mapContainer = document.getElementById('map');
	mapContainer.setAttribute('id', 'mapLeft');
	var cloneElement = mapContainer.cloneNode(true);
	cloneElement.setAttribute('id', 'mapRight');
	body.insertBefore(cloneElement,mapContainer);
	
	for (i=0;i<maxRegion;i++) {							   		
		district.cd[i] = document.getElementById(euw09Data[i][1]);

		district.cd[i].addEventListener('mouseover', function() { var ii = i;
					return function() { tellMe(ii) }; }(), false); 

		district.cd[i].addEventListener('mouseout', function() { var ii = i;
					return function() { clearMe(ii) }; }(), false); 

		}
		
	// color key on bottom of maps => id 413..417
	// key text (classification) + headline => 418..424 	
	for (i=maxRegion;i<425;i++) {									
	var changeID = document.getElementById(i);		
		changeID.setAttributeNS(null,'id', i+'c');
		}
		var changeCap = document.getElementById('capitals');		
		changeCap.setAttribute('id', 'capitalsc');
		var changeLB = document.getElementById('laenderboundaries');		
		changeLB.setAttribute('id', 'laenderboundariesc');

//	document.getElementById('svgroot').setAttribute('id', 'svgCloneRoot');
//	document.getElementById('Wahlkreiskarte').setAttribute('id', 'WahlkreiskarteClone');
//	mapCloneRoot = document.getElementById('svgCloneRoot');
//	draggingCloneElement = document.getElementById('WahlkreiskarteClone');
	
	var radiocontrols = document.getElementById('LayoutControl');
	radiocontrols.style.display = 'inline';
	radiocontrols.position[0].checked=true;
	moveLeft()
	}

	
function moveLeft() {

	    controls.style.left = '0px';
	    left = 1;
	    selectedData = selectedDataRight;
	    statistics(selectedData);

	}


function moveRight() {

		controls.style.left = '561px';
		left = 0;
	    selectedData = selectedDataLeft;
	    statistics(selectedData);

	}
	
	
function layoutControls(position){
	if(position=='right'){
		moveRight()
		} 
	if(position=='left') {
		moveLeft()
		}
	if(position=='hide') {
		controls.style.display = 'none';
		document.getElementById('actionIconG').style.display = 'inline';
		if (left == 1) {
			document.getElementById('LayoutControl').position[0].checked=true;
			} else {
			document.getElementById('LayoutControl').position[1].checked=true;
			}
		}
	}


function unhideControls(){
	controls.style.display = 'inline';
	document.getElementById('actionIconG').style.display = 'none';
	}


function uncloneMap(){
	mapRoot.setAttribute('viewBox','-340431 -475036 672623 911401');
	mapRoot.setAttribute('width','556px');
	var body = document.getElementsByTagName('body')[0];
	var mapContainer = document.getElementById('mapRight');
	body.removeChild(mapContainer);
	var origMap = document.getElementById('mapLeft');
	origMap.setAttribute('id', 'map');
	var radiocontrols = document.getElementById('LayoutControl');
	radiocontrols.style.display = 'none';
	controls.style.left = '561px';
	statistics(selectedDataLeft);	// see moveRight()
	fillItems(0)	
	}


function load(){

	if (top.location != location) {
    top.location.href = document.location.href ;
	}

    mapRoot = document.getElementById('svgroot');
    svgMap = document.getElementById('Wahlkreiskarte');
    hookEvent('map', 'mousewheel', MouseWheel);
    controls = document.getElementById('controlsContainer');
    wkrName = document.getElementById('wkr-name');
    
    CDUkopf = document.getElementById('CDUkopf');
   
  	cduAKTproz = document.getElementById('cduAKTproz');
	spdAKTproz = document.getElementById('spdAKTproz');
	grueneAKTproz = document.getElementById('grueneAKTproz');
	linkeAKTproz = document.getElementById('linkeAKTproz');
	fdpAKTproz = document.getElementById('fdpAKTproz');

	cduVORPproz = document.getElementById('cduVORPproz');
	spdVORPproz = document.getElementById('spdVORPproz');
	grueneVORPproz = document.getElementById('grueneVORPproz');
	linkeVORPproz = document.getElementById('linkeVORPproz');
	fdpVORPproz = document.getElementById('fdpVORPproz');
    
    
    for (i=0;i<(maxRegion);i++) {

        district.id[i] = document.getElementById(euw09Data[i][1]);  

		district.id[i].addEventListener('mouseover', function() { var ii = i;
					return function() { tellMe(ii) }; }(), false); 

		district.id[i].addEventListener('mouseout', function() { var ii = i;
					return function() { clearMe(ii) }; }(), false); 
    	  
   	  }
    	  
	svgMap.addEventListener("mousedown", mouseDown, false);
	svgMap.addEventListener("mouseup", mouseUp, false);
    
    svgMap.addEventListener("click", resultPage, false);
    
    buildHistogram();
    
    var selectData = 3.0 		// 3 = column in dataset (WahlBeteilig09), 0 = colorScheme (must match entry in arItems!!!)
    							// MUST CHANGE THIS CRAP
   
    fillItems(selectData); 	// populate dropdown menu  
    statistics(selectData)	// calculates Quantiles, min/max and calls the colorMap function
    
    var indicator = document.getElementById('wkr-id');
    indicator.firstChild.data=('Application is active');
    indicator.style.color = '#313f7d';

    }
    