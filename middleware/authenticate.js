module.exports = {
    validateRole: function(...roles){
        return function (req, res, next) {
            console.log("***********************************\n");
            console.log("Logging present user middlewre ....-dev\n");
            console.log("User\n");
            console.log(req.user.role);
            console.log("\n***********************************");
            if(req.user && req.user.role && roles.includes(req.user.role)){
                ////b/w comment remove in prod
                console.log("***********************************\n");
                console.log("Logging present user middlewre ....-dev\n");
                console.log("User\n");
                console.log(req.user.role);
                console.log("\n***********************************");
                ///remove in prod
                next();
            }else{
                return res.send(401);
            }
        }
    }
};