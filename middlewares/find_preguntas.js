var Pregunta = require("../models/preguntas");
var owner_check = require("./preguntas_permisos");

module.exports = function (req, res, next){
	Pregunta.findById(req.params.id)
		.populate("autor")
		.exec(function(err, preg){
		if(preg != null & owner_check(preg, req, res)){
			res.locals.pregunta = preg;
			next();
		}
		else{
			console.log("preg null");
			res.redirect("/app");
		}
	});
}