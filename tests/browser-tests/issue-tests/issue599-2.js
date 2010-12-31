var svgns="http://www.w3.org/2000/svg";var colorScheme=[['0andere','#f8fde6','#e4e5b8','#889780','#354f4f','#002a2d','#ffed2a'],['1cdu','#d3e9fe','#8db0fe','#405dff','#002ba5','#001654','#ffed2a'],['2spd','#ffceb8','#fe946a','#f83a1f','#bb0000','#7e0900','#ffed2a'],['3gruene','#e4de4d','#b5c213','#508229','#054d16','#062f00','#ff7d15'],['4linke','#fed0f5','#f3a3ff','#cb6cff','#952aea','#640390','#ffed2a'],['5fdp','#f9feae','#fff95e','#fee80c','#fecc12','#ffa900','#405dff'],['6npd','#fee284','#d3a936','#ab6c00','#714702','#492e00','#000000'],['7pirat','#d3d3d3','#a9a9a9','#4a4a4a','#131313','#ff8800','#ffed2a']];var district={id:[],hb:[],colL:[]};var sortArray=new Array(maxRegion);var hbdistArray=new Array(maxRegion);var equalDistBoundaries=new Array();var quantileBoundaries=new Array();var classBoundaries=new Array();var min;var max;var selectedData;var colorNr;var dataCol;var col='colL';var histogramLayer=null;var mapRoot=null;var svgMap=new Object;var origViewBox=null;var origWidth=0;var controls=null;var wkrName=null;var wkrID=null;var cduAKTproz=null;var spdAKTproz=null;var grueneAKTproz=null;var linkeAKTproz=null;var fdpAKTproz=null;var cduVORPproz=null;var spdVORPproz=null;var grueneVORPproz=null;var linkeVORPproz=null;var fdpVORPproz=null;function fillItems(intStart){var fTypes=document.getElementById('form1').types;var fItems=document.getElementById('form1').items;var a=arItems;var b,c,d,intItem,intType;if(intStart>0){for(b=0;b<a.length;b++){if(a[b][1]==intStart){intType=a[b][0];}}
for(c=0;c<fTypes.length;c++){if(fTypes.options[c].value==intType){fTypes.selectedIndex=c;}}}
if(intType==null){intType=fTypes.options[fTypes.selectedIndex].value}
fItems.options.length=0;for(d=0;d<a.length;d++){if(a[d][0]==intType){fItems.options[fItems.options.length]=new Option(a[d][2],a[d][1]);}
if(a[d][1]==intStart){fItems.selectedIndex=fItems.options.length-1;}}}
function tellHist(MyHistID){var MyDistID=sortArray[MyHistID][1];district.hb[MyHistID].setAttribute('stroke',colorScheme[colorNr][6]);district.id[MyDistID].setAttribute('fill',colorScheme[colorNr][6]);wkrID.firstChild.data=sortArray[MyHistID][0];var hoverName=st11data[MyDistID][0]+' '+st11data[MyDistID][1];wkrName.firstChild.data=hoverName;updateTable(MyDistID);}
function clearHist(MyHistID){var tmpColor=district.colL[sortArray[MyHistID][1]];district.id[sortArray[MyHistID][1]].setAttribute('fill',tmpColor);district.hb[MyHistID].setAttribute('stroke',tmpColor);}
var resetBarNr=0;function tellMe(MyDistID){district.hb[hbdistArray[MyDistID]].setAttribute('stroke',colorScheme[colorNr][6]);district.id[MyDistID].setAttribute('fill',colorScheme[colorNr][6]);wkrName.firstChild.data=st11data[MyDistID][0]+' '+st11data[MyDistID][1];updateTable(MyDistID);if(st11data[MyDistID][dataCol]==mssngVal){wkrID.firstChild.data='–';}else{wkrID.firstChild.data=st11data[MyDistID][dataCol];}}
function clearMe(MyDistID){district.id[MyDistID].setAttribute('fill',district.colL[MyDistID]);district.hb[hbdistArray[MyDistID]].setAttribute('stroke',district.colL[MyDistID]);}
function sort2dim(a,b){return((a[0]<b[0])?-1:((a[0]>b[0])?1:0));}
function statistics(selected){selectedData=selected;if(Math.abs(selected)!=99){if(selectedData<500){dataCol=Math.floor(selectedData);}else{dataCol=Math.floor(selectedData)-900;}
document.getElementById('option1').selected=true;metaData();for(i=0;i<maxRegion;i++){sortArray[i]=new Array(2);sortArray[i][0]=st11data[i][dataCol];sortArray[i][1]=i;}
sortArray.sort(sort2dim);min=sortArray[0][0];max=sortArray[maxRegion-1][0];var missing=0,j=0;while(sortArray[j][0]==mssngVal){j++}
min=sortArray[j][0];missing=j;var quantIncrement=Math.round((maxRegion-missing)/5);for(i=0;i<4;i++){quantileBoundaries[i]=sortArray[(i+1)*quantIncrement+missing][0];}
var increment=(max-min)/5;for(i=0;i<4;i++){if((max-min)<10){equalDistBoundaries[i]=Math.round((min+(i+1)*increment)*10)/10}else{equalDistBoundaries[i]=Math.round(min+(i+1)*increment)}}
for(i=0;i<missing;i++){district.hb[i].setAttribute('y1',0);district.hb[i].setAttribute('y2',0);}
var myY1=100*max/(max-min);for(i=missing;i<maxRegion;i++){if(min<0){var myY2=myY1-(sortArray[i][0]*100/(max-min));district.hb[i].setAttribute('y1',myY1+10);district.hb[i].setAttribute('y2',myY2+10);}else{district.hb[i].setAttribute('y1',100);district.hb[i].setAttribute('y2',100-(sortArray[i][0]/max*90));}}
for(j=0;j<maxRegion;j++){hbdistArray[sortArray[j][1]]=j}
document.getElementById('maxTick').firstChild.data=max;if(min<0){tickMin=min}else{tickMin=0}
document.getElementById('minTick').firstChild.data=tickMin;colorMap('default')}}
function colorMap(classMethod){if(classMethod=='default'){for(var i=0,ii=arItems.length;i<ii;i++){if(arItems[i][1]==selectedData){for(n=0;n<4;n++){classBoundaries[n]=arItems[i][3+n]}}}}
if(classMethod=='quantiles'){for(n=0;n<4;n++){classBoundaries[n]=quantileBoundaries[n]}}
if(classMethod=='equaldistance'){for(n=0;n<4;n++){classBoundaries[n]=equalDistBoundaries[n]}}
colorNr=Math.round((selectedData-Math.floor(selectedData))*10);for(i=0;i<5;i++){document.getElementById('color'+i).style.backgroundColor=colorScheme[colorNr][i+1];}
var frequencies=[0,0,0,0,0];for(i=0;i<(maxRegion);i++){var mapPerc=st11data[i][dataCol];if(mapPerc>=min&&mapPerc<classBoundaries[0]){district.id[i].setAttribute('fill',colorScheme[colorNr][1]);district.colL[i]=colorScheme[colorNr][1];frequencies[0]+=1;}
if(mapPerc>=classBoundaries[0]&&mapPerc<classBoundaries[1]){district.id[i].setAttribute('fill',colorScheme[colorNr][2]);district.colL[i]=colorScheme[colorNr][2];frequencies[1]+=1;}
if(mapPerc>=classBoundaries[1]&&mapPerc<classBoundaries[2]){district.id[i].setAttribute('fill',colorScheme[colorNr][3]);district.colL[i]=colorScheme[colorNr][3];frequencies[2]+=1;}
if(mapPerc>=classBoundaries[2]&&mapPerc<classBoundaries[3]){district.id[i].setAttribute('fill',colorScheme[colorNr][4]);district.colL[i]=colorScheme[colorNr][4];frequencies[3]+=1;}
if(mapPerc>=classBoundaries[3]){district.id[i].setAttribute('fill',colorScheme[colorNr][5]);district.colL[i]=colorScheme[colorNr][5];frequencies[4]+=1;}
if(mapPerc==mssngVal){district.id[i].setAttribute('fill','#fff');district.colL[i]='#fff';}}
for(i=0;i<5;i++){var tmpFreq='freq'+i;document.getElementById(tmpFreq).firstChild.data=frequencies[i];}
for(i=0;i<4;i++){document.getElementById('percClass'+i).firstChild.data=classBoundaries[i];document.getElementById('limit'+(i+1)+'a').firstChild.data=classBoundaries[i];}
document.getElementById('max').firstChild.data=max;document.getElementById('min').firstChild.data=min;for(i=0;i<(maxRegion);i++){if(sortArray[i][0]<classBoundaries[0]){district.hb[i].setAttribute('stroke',colorScheme[colorNr][1]);}
if(sortArray[i][0]>=classBoundaries[0]&&sortArray[i][0]<classBoundaries[1]){district.hb[i].setAttribute('stroke',colorScheme[colorNr][2]);}
if(sortArray[i][0]>=classBoundaries[1]&&sortArray[i][0]<classBoundaries[2]){district.hb[i].setAttribute('stroke',colorScheme[colorNr][3]);}
if(sortArray[i][0]>=classBoundaries[2]&&sortArray[i][0]<classBoundaries[3]){district.hb[i].setAttribute('stroke',colorScheme[colorNr][4]);}
if(sortArray[i][0]>=classBoundaries[3]){district.hb[i].setAttribute('stroke',colorScheme[colorNr][5]);}}
wkrName.firstChild.data=('Fahren Sie mit der Maus über die Karte');wkrID.firstChild.data='';}
function newClassInput(){var l1=document.forms['classification'].elements['limit1'].value;var l2=document.forms['classification'].elements['limit2'].value;var l3=document.forms['classification'].elements['limit3'].value;var l4=document.forms['classification'].elements['limit4'].value;classBoundaries=[l1,l2,l3,l4];for(i=0;i<4;i++){classBoundaries[i]=classBoundaries[i].replace(/,/,'.');classBoundaries[i]=classBoundaries[i].replace(/[^0-9\-.]/g,'');}
colorMap('userinput')
document.getElementById('option1').selected=true;}
function buildHistogram(){histogramLayer=document.getElementById('histogramlines');for(i=0;i<(maxRegion);i++){var newLine=document.createElementNS(svgns,'line');newLine.setAttribute('x1',barWidth*i+10);newLine.setAttribute('y1',100);newLine.setAttribute('x2',barWidth*i+10);newLine.setAttribute('y2',50);newLine.setAttribute('stroke-width',barWidth+0.1);newLine.setAttribute('stroke','green');district.hb[i]=newLine;district.hb[i].addEventListener('mouseover',function(){var ii=i;return function(){tellHist(ii)};}(),false);district.hb[i].addEventListener('mouseout',function(){var ii=i;return function(){clearHist(ii)};}(),false);histogramLayer.appendChild(newLine);}}
var nMouseOffsetX=0;var nMouseOffsetY=0;var dragx=0;var dragy=0;var rootctm;var irootctm;var p;function mouseDown(evt){svgMap.addEventListener("mousemove",mouseMove,false);p=mapRoot.createSVGPoint();p.x=evt.clientX;p.y=evt.clientY;rootctm=mapRoot.getScreenCTM();irootctm=rootctm.inverse();p=p.matrixTransform(irootctm);nMouseOffsetX=p.x-dragx;nMouseOffsetY=p.y-dragy;}
function mouseMove(evt){p=mapRoot.createSVGPoint();p.x=evt.clientX;p.y=evt.clientY;p=p.matrixTransform(irootctm);p.x-=nMouseOffsetX;p.y-=nMouseOffsetY;dragx=p.x;dragy=p.y;svgMap.setAttribute('transform','translate('+p.x+','+p.y+')');}
function mouseUp(evt){svgMap.removeEventListener("mousemove",mouseMove,false);nMouseOffsetX=0;nMouseOffsetY=0;}
function zoomHelp(){scrollZoom(1.8)}
function hookEvent(element,eventName,callback)
{if(typeof(element)=='string')
element=document.getElementById(element);if(element==null)
return;if(element.addEventListener)
{if(eventName=='mousewheel')
{mapRoot.addEventListener('DOMMouseScroll',callback,false);}
mapRoot.addEventListener(eventName,callback,false);}
else if(element.attachEvent)
element.attachEvent("on"+eventName,callback);}
function MouseWheel(e)
{e=e?e:window.event;var wheelData=e.detail?e.detail*-1:e.wheelDelta;if(wheelData>0){var scale=0.7}else{var scale=1.3}
scrollZoom(scale)}
function scrollZoom(scale){var myViewBox=mapRoot.getAttribute('viewBox');var viewboxes=myViewBox.split(' ');var ulXcorner=parseFloat(viewboxes[0]);var ulYcorner=parseFloat(viewboxes[1]);var myWidth=parseFloat(viewboxes[2]);var myHight=parseFloat(viewboxes[3]);var xCenter=ulXcorner+myWidth/2;var yCenter=ulYcorner+myHight/2;myWidth=myWidth/scale;myHight=myHight/scale;if(myWidth>origWidth/10&&myWidth<origWidth*2){ulXcorner=xCenter-myWidth/2;ulYcorner=yCenter-myHight/2;myViewBox=ulXcorner+' '+ulYcorner+' '+myWidth+' '+myHight;mapRoot.setAttribute('viewBox',myViewBox)}}
function resetZoom(){svgMap.setAttributeNS(null,'transform','translate( "0, 0")');var dragx=0;var dragy=0;mapRoot.setAttributeNS(null,'viewBox',origViewBox);}
function load(){if(top.location!=location){top.location.href=document.location.href;}
svgObject=document.getElementById('mapObject');mapRoot=svgObject.contentDocument.getElementById('st11');svgMap=svgObject.contentDocument.getElementById('wkr');origViewBox=mapRoot.getAttribute('viewBox');var vboxes=origViewBox.split(' ');origWidth=parseFloat(vboxes[2]);wkrInscript=svgObject.contentDocument.getElementById('wkr-inscript');controls=document.getElementById('controlsContainer');wkrName=document.getElementById('wkr-name');wkrID=document.getElementById('wkrid');cduAKTproz=document.getElementById('cduAKTproz');spdAKTproz=document.getElementById('spdAKTproz');grueneAKTproz=document.getElementById('grueneAKTproz');linkeAKTproz=document.getElementById('linkeAKTproz');fdpAKTproz=document.getElementById('fdpAKTproz');cduVORPproz=document.getElementById('cduVORPproz');spdVORPproz=document.getElementById('spdVORPproz');grueneVORPproz=document.getElementById('grueneVORPproz');linkeVORPproz=document.getElementById('linkeVORPproz');fdpVORPproz=document.getElementById('fdpVORPproz');hookEvent('map','mousewheel',MouseWheel);for(i=0;i<(maxRegion);i++){district.id[i]=svgObject.contentDocument.getElementById(i+1);district.id[i].addEventListener('mouseover',function(){var ii=i;return function(){tellMe(ii)};}(),false);district.id[i].addEventListener('mouseout',function(){var ii=i;return function(){clearMe(ii)};}(),false);}
svgMap.addEventListener("mousedown",mouseDown,false);svgMap.addEventListener("mouseup",mouseUp,false);svgMap.addEventListener("click",resultPage,false);buildHistogram();var param=window.location.href;if(param.split('?')[1]){var p=param.split('?')[1];var i=arItems.length;while(i--){if(arItems[i][2].search(p)!=-1){selectData=(arItems[i][1]);i=0;}}}
fillItems(selectData);statistics(selectData);wkrName.style.color='#313f7d';}