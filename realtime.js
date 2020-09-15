module.exports = function(server, sessionMiddleware){
	var io = require("socket.io")(server);
	var redis = require("redis");
	var client = redis.createClient();

	//--------------------------
	//	Suscribirse al canal
	//--------------------------
	client.subscribe("new pregunta");
	client.subscribe("update grafica");

	io.setMaxListeners(100);

	//--------------------------
	//	Compartir session con express
	//--------------------------
	io.use(function(socket, next){
		sessionMiddleware(socket.request, socket.request.res, next);
	});

	//--------------------------
	//	Actuar ante cualquier 
	//	mensaje
	//--------------------------
	client.on("message", function(channel, message){
		//console.log("Recibimos un mensaje del canal: " + channel);
		switch(channel)
		{
			case "new pregunta":
				io.emit("new pregunta", message);
				break;
			case "update grafica":
				//console.log("update grafica, Recibimos un mensaje del canal: " + channel);
				io.emit("update grafica", message);
				break;
		}
	});

	io.sockets.once("connection", function(socket){
		console.log("User Connected: " + socket.request.session.user_id);
	});
};