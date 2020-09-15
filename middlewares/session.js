var User = require("../models/user").User;

module.exports = function(req, res, next){
	//Valido si el usuario ya se logueo
	if(!req.session.user_id){
		res.redirect("/login");
	}
	else{
		User.findById(req.session.user_id, function(err, user_finded){
			if(err){
				console.log(err);
				res.redirect("/login");
			}
			else{
				res.locals = { user: user_finded};
				next(); //no altera el flujo de la petición
			}
		});
	}
}