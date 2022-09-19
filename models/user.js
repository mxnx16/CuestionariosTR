//Import the mongoose module
var mongoose = require('mongoose');

//Set up default mongoose connection
//var mongoDB = 'mongodb://localhost:27017/fotos';
//mongoose.connect(mongoDB);
//var uri = 'mongodb://localhost:27017/fotos';
//var uri = 'mongodb://localhost:27017/maleño';
//var uri = 'mongodb://localhost:27017/nessed';
//var uri = 'mongodb://localhost:27017/pablo';
var uri = 'mongodb://localhost:27017/deñ';

mongoose.connect(uri, {
  useMongoClient: true
  /* other options */
});
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

//--------------------------------------

//var mongoose = require("mongoose");
var Schema = mongoose.Schema;

//mongoose.connect("mongodb://localhost:27017/fotos");

// Colecciones => tablas
// Documentos  => filas

/*	TIPOS DE DATOS
	String, Number, Date, Buffer
	Boolean, Mixed, Objectid, Array
*/

var posibles_valores_sex = ["M","F"];
var email_match = [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,"Coloca un correo electrónico válido"];
var password_validation = {
	validator: function(p){
		return this.password_confirmation == p;
	},
	message: "Las contraseñas no son iguales"
};

var user_schema = new Schema({
	name: String,
	username: {
		type: String, 
		required: true, 
		maxlength:[50,"Username muy grande"]
	},
	password: {
		type: String,
		minlength:[1,"La contraseña es muy corta"],
		validate: password_validation
	},
	age: {
		type: Number, 
		min:[5,"La edad no puede ser menor que 5"], 
		max:[100,"La edad no puede ser mayor que 100"]
	},
	email: {
		type: String, 
		required: "El correo electrónico es obligatorio", 
		match: email_match,
		unique: true,
		index: true
	},
	date_of_birth: Date,
	sex: {
		type: String, 
		enum: {
			values: posibles_valores_sex, 
			message: "Opción no válida"
		}
	}
});

user_schema.virtual("password_confirmation").get(function(){
  return this.p_c;
}).set(function(password){
  this.p_c = password;
});

//La colección se define en plural: Users
module.exports.User = mongoose.model("User", user_schema);