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
});