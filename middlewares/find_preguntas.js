var Pregunta = require("../models/preguntas");
var owner_check = require("./preguntas_permisos");

module.exports = function (req, res, next){
	Pregunta.findById(req.params.id)
		.populate("autor")
		.exec(function(err, preg){
		if(preg != null & owner_check(preg, req, res)){
			res.locals.pregunta = preg;
			return next();
		}
		else{
			//Colocar código para Finalizar el ciclo de solicitud/respuestas
			//Bug potencial aquí: solicitud colgada. CORREGIDO
			//https://expressjs.com/es/guide/routing.html
			console.log("preg null");
			res.redirect("/app");
		}
	});
}
