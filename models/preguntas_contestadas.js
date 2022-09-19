var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var posibles_valores_respuesta = [1, 2, 3, 4];

var preg_cont_schema = new Schema({
	pregunta: {type: Schema.Types.ObjectId, ref: "Pregunta"}, //Relación 1-N
	autor: {type: Schema.Types.ObjectId, ref: "User"}, //Relación 1-N
	respuesta: {
		type: Number, 
		enum: {
			values: posibles_valores_respuesta, 
			message: "Opción no válida"
		}},
	puntos: {type: Number, required: true},
	iscorrecta: {type: Boolean, required: true}
});

module.exports = mongoose.model("Pregunta_Contestada", preg_cont_schema);