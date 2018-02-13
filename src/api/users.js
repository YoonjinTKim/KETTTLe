
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
            if result.length == 0 {
                //insert this user into the database
            }
            else {
                //tell the user that the email slready exists
            }
        }
        console.log(response);

        //res.end(JSON.stringify(response));
    }
}


