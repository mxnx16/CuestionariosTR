var express = require("express");
var Pregunta = require("./models/preguntas");
var User = require("./models/user").User;
var Pregunta_Contestada = require("./models/preguntas_contestadas");
var router = express.Router();
var redis = require("redis");
var mongoose = require("mongoose");

var client = redis.createClient();

var pregunta_finder_middleware = require("./middlewares/find_preguntas");

/* app.com/app/ */
router.get("/", function(req, res){
	Pregunta.find({})
		.populate("autor")
		.exec(function(err, pregs){
			if(err) console.log("error: " + err);
			res.render("app/home", {preguntas: pregs});
		});

	/*
	Pregunta.aggregate([
			{$lookup:{
				from: "pregunta_contestadas",
				localField: "_id",
				foreignField: "pregunta",
				as: "pregunta_contestada"
			}},
			{ $redact: {
					$cond: {
						if: { $eq: [ "$pregunta_contestada.autor", mongoose.Types.ObjectId(res.locals.user._id.toString()) ] },
							then: "$$PRUNE",
							else: "$$DESCEND"
					}
				}
    	}
		])
		.exec(function(err, pregs){
			if(err) console.log("error: " + err);
			console.log(pregs);
			res.render("app/home", {preguntas: pregs});
		});

	
	Pregunta_Contestada.find({
			autor: res.locals.user._id.toString()
		})
		.populate("pregunta")
		.exec(function(err, pregs){
			if(err) console.log("error: " + err);
			res.render("app/home", {preguntas: pregs});
		});
	*/
});

/* REST */
/* CRUD */

//*******************************************
//	Formulario de Nueva Pregunta
//*******************************************
router.get("/preguntas/new", function(req, res){
	res.render("app/preguntas/new");
});

router.all("/preguntas/:id*", pregunta_finder_middleware);

router.get("/preguntas/:id/edit", function(req, res){
	res.render("app/preguntas/edit");
});

//*******************************************
//	Pregunta Individual
//*******************************************
router.route("/preguntas/:id")
	.get(function(req, res){
		//**********************
		//	Mostrar pregunta
		//**********************
		//Buscar la pregunta (el middleware se encarga de eso)
		res.render("app/preguntas/show");
	})
	.put(function(req, res){
		//**********************
		//	Actualizar pregunta
		//**********************
		res.locals.pregunta.pregunta = req.body.pregunta;
		res.locals.pregunta.opcion1 = req.body.opcion1;
		res.locals.pregunta.opcion2 = req.body.opcion2;
		res.locals.pregunta.opcion3 = req.body.opcion3;
		res.locals.pregunta.opcion4 = req.body.opcion4;
		res.locals.pregunta.respuesta = req.body.respuesta;

		res.locals.pregunta.save(function(err){
			if(!err)
				res.render("app/preguntas/show");
			else{
				console.log(err);
				res.render("app/preguntas/" + req.params.id + "/edit");
			}
		});
	})
	.delete(function(req, res){
		//**********************
		//	Eliminar pregunta
		//**********************
		/*
		Pregunta.findById(req.params.id, function(err, preg){
			// Hacer cosas antes de eliminar
			preg.remove();
		});
		*/
		Pregunta.findOneAndRemove({_id: req.params.id}, function(err){
			if(!err){
				res.redirect("/app/preguntas");
			}
			else{
				console.log(err);
				res.redirect("app/preguntas/" + req.params.id);
			}
		});
	});

//*******************************************
//	Colección de preguntas
//*******************************************
router.route("/preguntas")
	.get(function(req, res){
		//**********************
		//	Obtengo las preguntas 
		//	del autor logueado
		//**********************
		Pregunta.find({autor: res.locals.user._id}, function(err, preguntas){
			if(err){
				res.redirect("/app");
				return;
			}
			res.render("app/preguntas/index", {preguntas: preguntas});
		});
	})
	.post(function(req, res){
		//**********************
		//	Guardo una pregunta (insert)
		//**********************
		var data = {
			pregunta: req.body.pregunta,
			opcion1: req.body.opcion1,
			opcion2: req.body.opcion2,
			opcion3: req.body.opcion3,
			opcion4: req.body.opcion4,
			respuesta: req.body.respuesta,
			autor: res.locals.user._id
		};

		var objPregunta = new Pregunta(data);

		objPregunta.save(function(err){
			if(!err){
				var pregJSON = {
					"id": objPregunta._id,
					"pregunta": objPregunta.pregunta,
					"opcion1": objPregunta.opcion1,
					"opcion2": objPregunta.opcion2,
					"opcion3": objPregunta.opcion3,
					"opcion4": objPregunta.opcion4,
					"respuesta": objPregunta.respuesta,
					"email": res.locals.user.email
				};

				client.publish("new pregunta", JSON.stringify(pregJSON));
				res.redirect("/app/preguntas/" + objPregunta._id);
			}
			else{
				console.log(objPregunta);
				res.render(err);
			}
		});
	});

//*******************************************
//	Formulario para contestar las preguntas
//*******************************************
router.get("/contestar/:id", function(req, res){
	//Validar si el usuario ya contesto la pregunta
	console.log("ID Pregunta:" + req.params.id);
	console.log("ID User:" + res.locals.user._id.toString());
	Pregunta_Contestada.find(
			{pregunta: req.params.id,
			 autor: res.locals.user._id.toString()}
		)
		.exec(function(err, preg_cont){
			console.log("Validación ¿Pregunta Contestada?: " + preg_cont);
			if(!err){ 
				if(preg_cont.length > 0){
					//El usuario ya contesto la pregunta
					console.log("El usuario ya contesto la pregunta");
					res.redirect("/app");
				}
				else{
					// Buscar pregunta y Mostrar al Usuario
					// para que la conteste
					Pregunta.findById(req.params.id)
						.exec(function(err, preg){
						if(preg != null){
							res.locals.pregunta = preg;
							res.render("app/preguntas/contestar");
						}
						else{
							console.log("Preg null contestar");
							res.redirect("/app");
						}
					});
				}
			}
			else{
				console.log("Err Pregunta_Contestada: " + err);
				res.redirect("/app");
			}
		});
});

//*******************************************
//	Colección de Preguntas Contestadas
//*******************************************
router.route("/contestar")
	.post(function(req, res){
		//**********************
		//	Guardo la pregunta 
		//	contestada (insert)
		//**********************

		//**********************
		//	1. Determinar si la 
		//	respuesta es correcta
		//**********************
		var puntaje = 0;
		var bndIscorrecta = false;
		
		Pregunta.findById(req.body.id)
			.exec(function(err, preg){
			if(preg != null){
				if(req.body.respuesta == preg.respuesta){
					//**********************
					//	Calcular puntaje
					//**********************
					bndIscorrecta = true;
					puntaje = 10;
					Pregunta_Contestada.aggregate(
						[ 
							{$match: {$and: 
										[ 
											{pregunta:{ $in: [mongoose.Types.ObjectId(req.body.id)]} }, 
											{iscorrecta: true}
										] 
									}
							}, 
							{$group: {
								_id: null, 
								cantidad: {$sum:1}
							}} 
						], function(err, results){
							if(!err){
								console.log("Resultados para obtener puntaje...");
								console.log(results);
								for (var i = results.length - 1; i >= 0; i--) {
									puntaje = 10 - results[i].cantidad;
								}
								if(puntaje < 0) puntaje = 0;

								var data = {
									pregunta: req.body.id,
									autor: res.locals.user._id,
									respuesta: req.body.respuesta,
									puntos: puntaje,
									iscorrecta: bndIscorrecta
								};
								GuardarPreguntaContestada(data, res);
							}
							else{
								console.log("Error al obtener puntaje: " + err);
								res.redirect("/app");
							}
						});
				}
				else{
					console.log("Respuesta incorrecta.");
					var data = {
						pregunta: req.body.id,
						autor: res.locals.user._id,
						respuesta: req.body.respuesta,
						puntos: puntaje,
						iscorrecta: bndIscorrecta
					};
					GuardarPreguntaContestada(data, res);
				}				
			}
			else{
				console.log("Pregunta no encontrada: " + req.body.id);
				res.redirect("/app");
			}
		});

	});

function GuardarPreguntaContestada(data, res){
	var objPregunta_Contestada = new Pregunta_Contestada(data);

	objPregunta_Contestada.save(function(err){
		if(!err){
			//**********************
			//	Obtener el puntaje 
			//	por usuario
			//**********************
			Pregunta_Contestada.aggregate(
					[
						{$lookup:{
							from: "users",
							localField: "autor",
							foreignField: "_id",
							as: "autor"
						}},
						{$group: { 
							_id: "$autor", 
							puntaje: {$sum: "$puntos"} 
						}}, 
						{$sort: {puntaje: -1 }} 
					]
				)
				.exec(function(err, puntajes){
					if(err){
						console.log("Error al obtener puntaje de preguntas contestadas: " + err);
						res.redirect("/app");
					}
					//console.log(puntajes);
					if(puntajes != null){
						var strJsonData = "[";
						for (var i = 0; i < puntajes.length; i++) {
							//console.log(puntajes[i]);
							//console.log(puntajes[i]._id[0].username);
							//console.log(puntajes[i].puntaje);
							strJsonData += "[\"" + puntajes[i]._id[0].username + "\"," + puntajes[i].puntaje + "]";
							if(i < puntajes.length - 1)
								strJsonData += ",";
						}
						strJsonData += "]";

						var preg_contJSON = {
							//"data": "[[\"user1\",12],[\"user2\",7],[\"user3\",6],[\"user4\",6],[\"user5\",9]]"
							"data": strJsonData
						};

						client.publish("update grafica", JSON.stringify(preg_contJSON));
						res.redirect("/app");
					}
					else{
						console.log("No se obtuvo el Puntaje por Usuario.");
						res.redirect("/app");
					}
			});
		}
		else{
			console.log("Error al guardar pregunta contestada: " + err);
			res.redirect("/app");
		}
	});
}

//*******************************************
//	Formulario de Gráficas
//*******************************************
router.get("/grafica", function(req, res){
	res.render("app/preguntas/grafica");
});

module.exports = router;