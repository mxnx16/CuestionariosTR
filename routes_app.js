var express = require("express");
var Pregunta = require("./models/preguntas");
var User = require("./models/user").User;
var Pregunta_Contestada = require("./models/preguntas_contestadas");
var router = express.Router();
var redis = require("redis");
var mongoose = require("mongoose");
var fs = require("fs");
const os = require('os');

var client = redis.createClient();

var pregunta_finder_middleware = require("./middlewares/find_preguntas");

/* app.com/app/ */
router.get("/", function (req, res) {

	if (typeof res.locals.user == "undefined") {
		var errMessage = 'CuestionariosTR App: user not defined, regrese a href="/app">Inicio</a>';
		res.status(400);
		res.send(errMessage);
		return;
	}

	if (typeof res.locals.user._id == "undefined") {
		var errMessage = 'CuestionariosTR App: user._id not defined, regrese a href="/app">Inicio</a>';
		res.status(400);
		res.send(errMessage);
		return;
	}

	if (res.locals.user._id != null) {
		Pregunta.aggregate([
			{
				$lookup: {
					from: "pregunta_contestadas",
					let: {
						id_pregunta: "$_id"
					},
					pipeline: [
						{
							$match:
							{
								$expr:
								{
									$and:
										[
											{ $eq: ["$pregunta", "$$id_pregunta"] },
											{ $eq: ["$autor", res.locals.user._id] }
										]
								}
							}
						},
						{ $project: { puntos: 1, _id: 0 } } //campos que regresa
					],
					as: "pregunta_contestada"
				}
			}
		])
			.sort({ pregunta_contestada: 'asc', opcion4: 'desc' }) //-----ORDENAMIENTO AQUI  <<<<<<<<<<<<<<<<<<<<<<<<<----------
			.exec(function (err, pregs) {
				if (err) {
					console.log("error: " + err);
					return;
				}
				User.populate(pregs, { path: "autor" }, function (err, pregs) {
					if (err) {
						console.log("error: " + err);
						return err;
					}
					//console.log(pregs);
					try {
						res.status(200);
						return res.render("app/home", { preguntas: pregs });
					}
					catch (error) {
						console.log("Error: ", error);
						var errMessage = 'CuestionariosTR App: Intente nuevamente mostrar las preguntas, regrese a <a href="/app">Inicio</a>';
						res.status(400);
						res.send(errMessage);
					}

				});
			});
	}

	/*
	
	Pregunta.find({
				autor: res.locals.user._id
			}
			)
			.populate('preguntas_contestadas')


	Pregunta.aggregate([
				{$lookup:{
					from: "pregunta_contestadas",
					let: {
						id_pregunta: "$_id"
					 },
					pipeline: [
						  { $match:
							 { $expr:
								{ $and:
								   [
									 { $eq: [ "$pregunta",  "$$id_pregunta" ] },
									 { $eq: [ "$autor", res.locals.user._id ] }
								   ]
								}
							 }
						  },
						  { $project: { puntos: 1, _id: 0 } } //campos que regresa
					   ],
					as: "pregunta_contestada"
				}},
				{ $sort : { puntos: -1 } }
			])

	Pregunta.find(
		{})
		.populate("autor")
		.exec(function(err, pregs){
			if(err) console.log("error: " + err);
			res.render("app/home", {preguntas: pregs});
		});

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
}, function (req, res, next) { });

function next() {
	console.log(arguments)
}

/* REST */
/* CRUD */

//*******************************************
//	Formulario de Nueva Pregunta
//*******************************************
router.get("/preguntas/new", function (req, res) {
	res.render("app/preguntas/new");
});

router.all("/preguntas/:id*", pregunta_finder_middleware);

router.get("/preguntas/:id/edit", function (req, res) {
	res.render("app/preguntas/edit");
});

//*******************************************
//	Pregunta Individual
//*******************************************
router.route("/preguntas/:id")
	.get(function (req, res) {
		//**********************
		//	Mostrar pregunta
		//**********************
		//Buscar la pregunta (el middleware se encarga de eso)
		res.render("app/preguntas/show");
	})
	.put(function (req, res) {
		//**********************
		//	Actualizar pregunta
		//**********************
		var extension = "";

		if (req.files.imagen) {
			if ('name' in req.files.imagen) {
				extension = req.files.imagen.name.split(".").pop();
			}
		}

		res.locals.pregunta.pregunta = req.fields.pregunta;
		res.locals.pregunta.imagen = extension;
		res.locals.pregunta.opcion1 = req.fields.opcion1;
		res.locals.pregunta.opcion2 = req.fields.opcion2;
		res.locals.pregunta.opcion3 = req.fields.opcion3;
		res.locals.pregunta.opcion4 = req.fields.opcion4;
		res.locals.pregunta.respuesta = req.fields.respuesta;

		res.locals.pregunta.save(function (err) {
			if (!err) {
				if (extension != "") {
					fs.copyFile(req.files.imagen.path, "public/imagenes/" + res.locals.pregunta._id + "." + extension,
						function (err) {
							if (err) {
								var errMessage = 'CuestionariosTR App: La imagen no se pudo guardar';
								res.status(400);
								res.send(errMessage);
								return;
							}
							//console.log("Copy File Success!");
						});
				}
				res.render("app/preguntas/show");
			}
			else {
				var errMessage = '';
				// go through all the errors...
				for (var errName in err.errors) {
					errMessage += err.errors[errName].message + ". ";
				}
				res.status(400);
				res.send(errMessage);
				return;
			}
		});
	})
	.delete(function (req, res) {
		//**********************
		//	Eliminar pregunta
		//**********************
		/*
		Pregunta.findById(req.params.id, function(err, preg){
			// Hacer cosas antes de eliminar
			preg.remove();
		});
		*/
		Pregunta.findOneAndRemove({ _id: req.params.id }, function (err) {
			if (!err) {
				res.redirect("/app/preguntas");
			}
			else {
				console.log(err);
				res.redirect("app/preguntas/" + req.params.id);
			}
		});
	});

//*******************************************
//	Colección de preguntas
//*******************************************
router.route("/preguntas")
	.get(function (req, res) {
		//**********************
		//	Obtengo las preguntas 
		//	del autor logueado
		//**********************
		Pregunta.find({ autor: res.locals.user._id }, function (err, preguntas) {
			if (err) {
				res.redirect("/app");
				return;
			}
			res.render("app/preguntas/index", { preguntas: preguntas });
		});
	})
	.post(function (req, res) {
		//**********************
		//	Guardo una pregunta (insert)
		//**********************
		var extension = req.files.imagen.name.split(".").pop();
		var data = {
			pregunta: req.fields.pregunta,
			imagen: extension,
			opcion1: req.fields.opcion1,
			opcion2: req.fields.opcion2,
			opcion3: req.fields.opcion3,
			opcion4: req.fields.opcion4,
			respuesta: req.fields.respuesta,
			autor: res.locals.user._id
		};

		var objPregunta = new Pregunta(data);

		objPregunta.save(function (err) {
			if (!err) {
				if (extension != "") {
					fs.copyFile(req.files.imagen.path, "public/imagenes/" + objPregunta._id + "." + extension,
						function (err) {
							if (err) {
								var errMessage = 'CuestionariosTR App: La imagen no se pudo guardar';
								res.status(400);
								res.send(errMessage);
								return;
							}
							//console.log("Copy File Success!");
						});
				}
				var pregJSON = {
					"id": objPregunta._id,
					"pregunta": objPregunta.pregunta,
					"imagen": objPregunta.imagen,
					"opcion1": objPregunta.opcion1,
					"opcion2": objPregunta.opcion2,
					"opcion3": objPregunta.opcion3,
					"opcion4": objPregunta.opcion4,
					"respuesta": objPregunta.respuesta,
					"email": res.locals.user.email,
					"puntos": '-'
				};

				client.publish("new pregunta", JSON.stringify(pregJSON));
				res.redirect("/app/preguntas/" + objPregunta._id);
			}
			else {
				var errMessage = '';
				//console.log(err.errors);
				// go through all the errors...
				for (var errName in err.errors) {
					errMessage += err.errors[errName].message + ". ";
				}

				res.status(400);
				res.send(errMessage);
				return;
			}
		});
	});

//*******************************************
//	Formulario para contestar las preguntas
//*******************************************
router.get("/contestar/:id", function (req, res) {
	//Validar si el usuario ya contesto la pregunta
	//console.log("ID Pregunta:" + req.params.id);
	//console.log("ID User:" + res.locals.user._id.toString());
	if (typeof res.locals.user == "undefined") {
		var errMessage = 'CuestionariosTR App: Intente nuevamente contestar la pregunta, regrese a <a href="/app">Inicio</a>';
		res.status(400);
		return res.send(errMessage);
	}

	if (typeof req.params == "undefined") {
		var errMessage = 'CuestionariosTR App: Intente nuevamente contestar la pregunta, regrese a <a href="/app">Inicio</a>';
		res.status(400);
		return res.send(errMessage);
	}

	if (typeof res.locals.user._id != "undefined") {
		Pregunta_Contestada.find(
			{
				pregunta: req.params.id,
				autor: res.locals.user._id.toString()
			}
		)
			.exec(function (err, preg_cont) {
				//console.log("Validación ¿Pregunta Contestada?: " + preg_cont);
				if (!err) {
					if (preg_cont.length > 0) {
						//El usuario ya contesto la pregunta
						console.log("El usuario ya contestó la pregunta");
						res.status(200);
						return res.redirect("/app");
					}
					// Buscar pregunta y Mostrar al Usuario
					// para que la conteste
					Pregunta.findById(req.params.id)
						.exec(function (err, preg) {
							if (preg != null) {
								res.locals.pregunta = preg;
								res.status(200);
								return res.render("app/preguntas/contestar");
							}

							console.log("Preg null contestar");
							res.status(200);
							return res.redirect("/app");

						});
				}
				else {
					console.log("Err Pregunta_Contestada: " + err);
					res.status(200);
					res.redirect("/app");
				}
			});
	}
});

//*******************************************
//	Colección de Preguntas Contestadas
//*******************************************
router.route("/contestar")
	.post(function (req, res) {
		//**********************
		//	Guardo la pregunta 
		//	contestada (insert)
		//**********************

		//**********************
		// 0. Validar si la contesto con anterioridad
		//**********************
		var isPreguntaContestada = false;

		if (typeof res.locals.user == "undefined") {
			var errMessage = 'CuestionariosTR App: No se guardo su respuesta, regrese a la pregunta en <a href="/app">Inicio</a>';
			res.status(400);
			return res.send(errMessage);
		}

		if (typeof res.locals.user._id != "undefined") {
			Pregunta_Contestada.find(
				{
					pregunta: req.fields.id,
					autor: res.locals.user._id.toString()
				}
			)
				.exec(function (err, preg_cont) {
					//console.log("Validación ¿Pregunta Contestada?: " + preg_cont);
					if (!err) {
						if (preg_cont.length > 0) {
							//El usuario ya contesto la pregunta
							console.log("El usuario ya contestó la pregunta");
							isPreguntaContestada = true;
							//Error('El usuario ya contestó la pregunta');
							//res.status(400).json({err:"El usuario ya contestó la pregunta"});

							var errMessage = 'CuestionariosTR App: Ya contestó la pregunta, regrese a <a href="/app">Inicio</a>';
							res.status(400);
							res.send(errMessage);
							//return next(new Error("El usuario ya contestó la pregunta"));
							//return new Error("El usuario ya contestó la pregunta");
							//res.redirect("/app");
						}
						else {
							//**********************
							//	1. Determinar si la 
							//	respuesta es correcta
							//**********************
							var puntaje = 0;
							var bndIscorrecta = false;
							//console.log("isPreguntaContestada: " + isPreguntaContestada);

							if (isPreguntaContestada === false) {
								Pregunta.findById(req.fields.id)
									.exec(function (err, preg) {
										if (preg != null) {
											if (req.fields.respuesta == preg.respuesta) {
												//**********************
												//	Calcular puntaje
												//**********************
												bndIscorrecta = true;
												puntaje = 10;
												Pregunta_Contestada.aggregate(
													[
														{
															$match: {
																$and:
																	[
																		{ pregunta: { $in: [mongoose.Types.ObjectId(req.fields.id)] } },
																		{ iscorrecta: true }
																	]
															}
														},
														{
															$group: {
																_id: null,
																cantidad: { $sum: 1 }
															}
														}
													]
												)
													.exec(
														function (err, results) {
															if (!err) {
																//console.log("Resultados para obtener puntaje...");
																//console.log(results);
																for (var i = results.length - 1; i >= 0; i--) {
																	puntaje = 10 - results[i].cantidad;
																}
																if (puntaje < 0) { puntaje = 0 };

																var data = {
																	pregunta: req.fields.id,
																	autor: res.locals.user._id,
																	respuesta: req.fields.respuesta,
																	puntos: puntaje,
																	iscorrecta: bndIscorrecta
																};
																//console.log("Respuesta correcta de " + res.locals.user.name + ", " + puntaje + " pts.");
																console.log("Respuesta correcta, " + puntaje + " pts.");
																try {
																	GuardarPreguntaContestada(data, function (ft) {
																		if (ft == null) {
																			return res.redirect(200, "/app");
																		}
																		
																			const { status, ok, message } = ft //Destructuring ES6
																			//console.log('aqui 1 ' + status);
																			//res.status(401).location('/foo').end();
																			//res.redirect("/app");
																			//return res.redirect(status, "/app");
																			//res.status(status).location("/app").end(); //Tambien ...json({ok, message}) ES6
																			return res.redirect("/app");
																			
																		
																	});
																}
																catch (error) {
																	console.log("Error: ", error);
																	return res.status(500).json({ ok: false, err: error.message });
																}
															}
															else {
																console.log("Error al obtener puntaje: " + err);
																res.redirect("/app");
															}
														}
													);
											}
											else {
												//console.log("Respuesta incorrecta de " + res.locals.user.name + ", " + puntaje + " pts.");
												console.log("Respuesta incorrecta, " + puntaje + " pts.");
												var data = {
													pregunta: req.fields.id,
													autor: res.locals.user._id,
													respuesta: req.fields.respuesta,
													puntos: puntaje,
													iscorrecta: bndIscorrecta
												};
												try {
													GuardarPreguntaContestada(data, function (ft) {
														//console.log(ft);
														if (ft == null) {
															return res.redirect(200, "/app");
														}
														
															const { status, ok, message } = ft; //Destructuring ES6
															//console.log('aqui 3 ' + status);
															//return res.status(status).location("/app").end();
															//return res.redirect(status, "/app");
															//res.status(200).location("/app").end(); //Tambien ...json({ok, message}) ES6
															return res.redirect("/app");
															
														
													});
												}
												catch (error) {
													console.log("Error: ", error);
													return res.status(500).json({ ok: false, err: error.message }); //Tambien ...json({ok, err}) ES6
												}
											}
										}
										else {
											console.log("Pregunta no encontrada: " + req.fields.id);
											res.redirect("/app");
										}
									});
							}
						}
					}
					else {
						var errMessage = 'CuestionariosTR App: ' + + err;
						res.status(400);
						res.send(errMessage);
						return next(new Error("El usuario ya contestó la pregunta"));
					}
				});
		}
		else {
			console.log("No se pudo obtener el res.locals.user._id");
			return err;
		}

	});

function GuardarPreguntaContestada(data, callback) {
	var objPregunta_Contestada = new Pregunta_Contestada(data);

	objPregunta_Contestada.save(function (err) {
		if (!err) {
			MostrarGrafica(true, callback);
		}
		else {
			console.log("Error al guardar pregunta contestada: " + err.message);
			return callback({ status: 500, ok: false, err: err.message })
			//res.redirect("/app");
		}
	});
}

function MostrarGrafica(isRedirect, callback) {
	//**********************
	//	Obtener el puntaje 
	//	por usuario
	//**********************
	Pregunta_Contestada.aggregate(
		[
			{
				$lookup: {
					from: "users",
					let: {
						id: "$autor"
					},
					pipeline: [
						{
							$match:
							{
								$expr:
									{ $eq: ["$_id", "$$id"] }
							}
						}
					],
					as: "autor"
				}
			},
			{
				$group: {
					_id: "$autor",
					puntaje: { $sum: "$puntos" }
				}
			},
			{ $sort: { puntaje: -1 } }
			//{ $limit: 10 } 
		]
	)
		.exec(function (err, puntajes) {
			if (err) {
				console.log("Error al obtener puntaje de preguntas contestadas: " + err);
				return callback({ status: 500, ok: false, err: err.message })
				//if(isRedirect) res.redirect("/app");
			}
			//console.log(puntajes);
			if (puntajes != null) {
				var strJsonData = "[";
				for (var i = 0; i < puntajes.length; i++) {
					//console.log(puntajes[i]);
					//console.log(puntajes[i]._id[0].username);
					//console.log(puntajes[i].puntaje);
					strJsonData += "[\"" + puntajes[i]._id[0].username + "\"," + puntajes[i].puntaje + "]";
					if (i < puntajes.length - 1){
						strJsonData += ",";}
				}
				strJsonData += "]";

				var preg_contJSON = {
					//"data": "[[\"user1\",12],[\"user2\",7],[\"user3\",6],[\"user4\",6],[\"user5\",9]]"
					"data": strJsonData
				};

				try {
					client.publish("update grafica", JSON.stringify(preg_contJSON));
					if (isRedirect){ callback({ status: 200, ok: true, message: 'Se envió actualización de gráfica.' });}
					//return res.redirect("/app");
				}
				catch (error) {
					console.log("Error: ", error);
					return err;
				}
			}
			else {
				console.log("No se obtuvo el Puntaje por Usuario.");
				try {
					if (isRedirect){ return callback({ status: 500, ok: false, err: "No se obtuvo el Puntaje por Usuario" });} //return res.redirect("/app");
				}
				catch (error) {
					console.log("Error: ", error);
					return err;
				}
			}
		});
}

//*******************************************
//	Formulario de Gráficas
//*******************************************
module.exports = router.get("/grafica", function (req, res) {
	console.log("Mostrando Gráficas....")
	MostrarGrafica(true, (ft) => {
		if (ft.ok) {
			const { status, ok, message } = ft; //Destructuring ES6
			console.log('aqui 5 ' + status);
			//return res.status(200).location("/app").end();
			//res.status(200).location("/app").end(); //Tambien ...json({ok, message}) ES6
			return res.render("app/preguntas/grafica");
			
		} 
			const { status, ok, err } = ft; //Destructuring ES6
			console.log('aqui 6 ' + ft);
			return res.status(status).json({ ok: ok, err: err }); //Tambien ...json({ok, err}) ES6
		
	});
});