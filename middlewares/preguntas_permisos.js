var Pregunta = require("../models/preguntas");

module.exports = function(preg, req, res){
	// True  => Tiene permisos
	// False => No tiene permisos
	if(req.method == "GET" && req.path.indexOf("edit") < 0){
		//Ver la pregunta
		return true;
	}

	if(typeof preg.autor == "undefined"){ return false};

	if(preg.autor._id.toString() == res.locals.user._id){
		//Creó la pregunta
		return true;
	}

	return false;
};