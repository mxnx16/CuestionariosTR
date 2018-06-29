var socket = io();

socket.on("new pregunta", function(data){
	data = JSON.parse(data);
	console.log(data);
	var container = document.querySelector("#preguntas");
	var source = document.querySelector("#pregunta-template").innerHTML;

	var template = Handlebars.compile(source);

	container.innerHTML = template(data) + container.innerHTML;
	//container.innerHTML += template(data);
});