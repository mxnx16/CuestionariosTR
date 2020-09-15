var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var posibles_valores_respuesta = [1, 2, 3, 4];

var preg_schema = new Schema({
	pregunta: {type: String, required: "Capture la pregunta"},
	imagen: {type: String, required: false},
	opcion1: {type: String, required: "Capture la opción 1"},
	opcion2: {type: String, required: "Capture la opción 2"},
	opcion3: {type: String, required: "Capture la opción 3"},
	opcion4: {type: String, required: "Capture la opción 4"},
	respuesta: {
		type: Number, 
		enum: {
			values: posibles_valores_respuesta, 
			message: "Opción no válida"
		}},
	autor: {type: Schema.Types.ObjectId, ref: "User"} //Relación 1-N
});

var Pregunta = mongoose.model("Pregunta", preg_schema);

module.exports = Pregunta;


