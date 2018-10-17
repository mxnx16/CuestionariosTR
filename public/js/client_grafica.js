var socket = io();

socket.on("update grafica", function(data){
	data = JSON.parse(data);
	console.log(data);
	var container = document.querySelector("#grafica");
	
	var source = document.querySelector("#grafica-template").innerHTML;
	var template = Handlebars.compile(source);

	//container.innerHTML = container.innerHTML;
	//container.innerHTML = template(data) + container.innerHTML;
	container.innerHTML += template(data);

	updateChart();
});

function updateChart() {
	console.log('actualizando chart...');
	//$("#grafica label").last().addClass("highlight");
	var data = JSON.parse($("#grafica label").last().text().replace('&#39;', '&#34;'));
	console.log(data);
	var dataPoints = [];
	var i = 0;
	
	document.querySelector("#registro").innerHTML = "";
	var container = document.querySelector("#registro");
	var source = document.querySelector("#tabla-template").innerHTML;
	var template = Handlebars.compile(source);

	$.each(data, function(key, value){
		if(i<10)
			dataPoints.push({label: value[0], y: parseInt(value[1])});
		i++;
		var data1 = {no: i, alumno: value[0], puntos: parseInt(value[1])};
		container.innerHTML += template(data1);

	});

	chart = new CanvasJS.Chart("chartContainer",{
		animationEnabled: false,
		theme: "light2",
		title:{
			text:"Resultados"
		},
		axisY: {
			title: "Puntaje"
		},
		legend: {
			verticalAlign: "bottom",
			horizontalAlign: "center"
		},
		data: [{
			type: "column",  
			showInLegend: true, 
			legendMarkerColor: "grey",
			legendText: "Puntaje de alumnos",
			dataPoints : dataPoints,
		}]
	});
	chart.render();
}