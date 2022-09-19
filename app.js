var express = require("express");
//var bodyParser = require("body-parser");
var User = require("./models/user").User;
var session = require("express-session");
var router_app = require("./routes_app");
var session_middleware = require("./middlewares/session");
var RedisStore = require("connect-redis")(session);
var http = require("http");
var realtime = require("./realtime");
var formidable = require("express-formidable");

var methodOverride = require("method-override");

var app = express();
var server = http.Server(app);

var sessionMiddleware = session({
	store: new RedisStore({}),
	secret: "super ulta secret word",
	resave: false,
	saveUninitialized: false
});

realtime(server, sessionMiddleware);

//funcion que retorna el middelware necesario que permite servir
//archivo staticos (imagenes, css, javascript, entre otros que no tienen compilacion de parte del servidor)
app.use("/public",express.static("public"));
//app.use(bodyParser.json());//para perticiones que tengan el formato application/json
//app.use(bodyParser.urlencoded({extended: true}));//define con que hacer el parsing la libreria, true -> permite arreglos

app.use(methodOverride("_method"));

app.use(sessionMiddleware);

app.use(formidable({ encoding: 'utf-8', multiples: true // esta almacena archivos
}));

/*
app.use(session({
	secret: "super ultra key",
	resave: false,
	saveUninitialized: false
	//genid: function(req)...
}));
*/

app.set("view engine", "pug");


app.get("/", function(req, res){
	//console.log("raiz: " + req.session.user_id);
	res.render("index");
});

app.get("/signup", function(req, res){
	User.find(function(err, users){
		//console.log(users);
		res.render("signup");
	});
});

app.get("/login", function(req, res){
	res.render("login");
});

app.post("/users", function(req, res){

	var user = new User({
		email: req.fields.email,
		password: req.fields.password,
		password_confirmation: req.fields.password_confirmation,
		username: req.fields.username
	});

	//console.log(user.password_confirmation);

	//Ahora - Promises
	user.save().then(function(user_saved){
		//res.send("Se guardo el usuario");
		res.redirect("/login");
	}, function(err){
		if(err){
			console.log(String(err));
			var errMessage = 'CuestionariosTR App: no se pudo guardar el usuario';
			res.status(400);
			res.send(errMessage);}
	});

	/* Antes
	user.save(function(err, user_saved, numero){
		if(err)
			console.log(String(err));
		res.send("Recibimos tus datos");
	});
	*/

});

app.post("/sessions", function(req, res){

	// find("filtro", function...), findById("id" function...)
	User.findOne(
		{email: req.fields.email, password: req.fields.password},
		function(err, user){
			//console.log(user);
			if(err){
				console.log("Error al intentar loguerse: " + err);

				var errMessage = 'CuestionariosTR App: error al intentar loguerse';
				res.status(400);
				res.send(errMessage);

				//res.redirect("/login");
			}
			if(user != null){
				req.session.user_id = user._id;
				res.redirect("/app");
			}
			else{
				console.log("Error al obtener usuario en login: " + err);

				var errMessage = 'CuestionariosTR App: error al obtener usuario en login';
				res.status(400);
				res.send(errMessage);

				//res.redirect("/login");
			}
	});

});

/* /app */
/* / */
app.use("/app", session_middleware);
app.use("/app", router_app);

// handle not specified routes
/*
app.all('*', (req, res, next) => {
  var err = new Error('Not found');
  err.status = 404;
  next(err);
});
*/

// error handlers
app.use(errorLogger);
app.use(errorhandler);

function errorLogger(err, req, res, next) {
  console.log('ErrorLogger: ', err);
  next(err);
}

function errorhandler(err, req, res, next) {
  console.log('ErrorHandler: ', err);
  try{
  	res.status(err.status || 500).json({
	    message: err.message || 'An error has ocurred'
	  });
  }
  catch(error){
  	console.log("Error en handler: " + error.message);
  }
}

function next() {
  console.log(arguments)
}

server.listen(8080);
