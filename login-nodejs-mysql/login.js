const mysql = require("mysql");
const express = require("express");
const bodyParser = require("body-parser");
const encoder = bodyParser.urlencoded();
var path = require('path');
let alert = require('alert');

//const popup = require('node-popup');

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use("/assets", express.static("assets"));

const connection = require("./database");
const client = require("./Mqtt");


// connect to the database



app.get("/", function (req, res) {
    res.redirect('/index1');
})
// app.get('/register', (req, res) => {
//     res.sendFile(__dirname + "/register.html");
// });
app.get('/test', (req, res) => {
    res.render('test', {
        message: ''
    });
});
app.get('/index1', (req, res) => {
    res.render('index1', {
        message: ''
    });
});


app.post("/", encoder, function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    connection.query("select * from test where username = ? and password = ?", [username, password], function (error, results, fields) {
        var data
        if (results.length > 0) {

            // var sql='SELECT * FROM data   LIMIT 1 ';
            // connection.query(sql, function (err, d, fields) {
            //     console.log(d)
            //     data=d
            //     //  data.forEach(function(d){
            //     //     console.log(d.Temp)
            //     //  })
            //     console.log("test",data)


            //  })
            res.redirect("/dashboard")
            //  return res.redirect("dashnoard",{

            //     // uid :"1",
            //     // email : req.body.username,
            //     // creationTime : "5:50",
            //     // userData: ""               
            //     //message : "Password Does Not Match"


            // });           
        } else {
            res.render("index1", {
                message: "Password Does Not Match"
            });
        }
        res.end();
    })
})
app.post("/test", encoder, function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var repassword = req.body.repassword;
    if (password == repassword) {
        connection.query("INSERT INTO test (username, password) VALUES (?, ?);", [username, password], function (error, results, fields) {
            if (results.length > 0) {
                res.render("/")

            }
            else {
                res.redirect("/");

            }
            res.end();
        })
    }
    else {
        res.render("test", {
            message: "Password Does Not Match"
        });
    }


})
app.get("/dashboard", encoder, function (req, res) {
    var sql = 'SELECT * FROM data ORDER BY Date DESC , Time DESC Limit 1';
    // SELECT * FROM data ORDER BY Date ASC , Time DESC Limit 1
    //SELECT * FROM data ORDER BY Date DESC , Time DESC 


    connection.query(sql, function (err, d, fields) {
        console.log(d)
        data = d


         res.render("dashboard", {

            uid: "1",
            email: req.body.username,
            creationTime: "5:50",
            userData: data,

            //message : "Password Does Not Match"


        });

    })

})
client.on('message', (topic, payload) => {
    console.log("hiii")
    var sql = 'SELECT * FROM data ORDER BY Date DESC , Time DESC Limit 1';
    // SELECT * FROM data ORDER BY Date ASC , Time DESC Limit 1
    //SELECT * FROM data ORDER BY Date DESC , Time DESC 


    connection.query(sql, function (err, d, fields) {
        console.log(d)
        data = d


        app.render("dashboard", {

            uid: "1",
            email: "dk",
            creationTime: "5:50",
            userData: data,

            //message : "Password Does Not Match"


        });

    })

})
app.post("/dashboard", encoder, function (req, res) {
    var AirPumpON = req.body.AirPumpON;
    var AirPumpOFF = req.body.AirPumpOFF;
    client.publish("REEVA/HYDROPHONICS/34B4724F22C4/Action", "1", { qos: 0, retain: false }, (error) => {
        if (error) {
            console.error(error)
        }

    })
    setTimeout(function () {
        console.log(AirPumpON)
        if (AirPumpON) {
            console.log("t")
            client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/1", "ON:100", { qos: 0, retain: false }, (error) => {
                if (error) {
                    console.error(error)
                }
            })
        }
        if (AirPumpOFF) {
            client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/1", "OFF:0", { qos: 0, retain: false }, (error) => {
                if (error) {
                    console.error(error)
                }
            })
        }
        res.redirect("\dashboard")
    }, 500);



})



// when login is success
app.get("/welcome", function (req, res) {
    res.sendFile(__dirname + "/welcome.html")
})


// set app port 
app.listen(4000);