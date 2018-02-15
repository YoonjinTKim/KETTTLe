
//we want to add affiliation later

var db = require('../db');

module.exports = {

    createUser: (req, res) => {
        console.log(req.body);
        response = {
            first_name:req.body.first_name,
            last_name:req.body.last_name,
            email:req.body.email,
            password:req.body.password
        };

        db.users.find({email: req.body.email} , (err, result) => {
            console.log(result);
            res.sent(result);
            if (result.length || result.length == 0) {
                //insert this user into the database
                db.users.insert({
                    email: req.body.email,
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    //might want to salt and hash the password eventually which
                    //would require us to also store the salt for each user
                    //BUT for now, just reverse the password
                    password: req.body.password.split('').reverse().join('')

                })
            }
            else {
                //tell the user that the email slready exists
                res.sent('That email is already associated with an account, please enter another email.');
            }
            });
        console.log(response);

        //res.end(JSON.stringify(response));
    }
}


