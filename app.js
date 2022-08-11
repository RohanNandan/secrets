//jshint esversion:6
require("dotenv").config()
const express = require("express")
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

//for encryption using keys
//const encrypt = require("mongoose-encryption")


//for encryption using hashing
//const md5 = require("md5")


//encryption using bcrypt i.e salting rounds + hashing
    //const bcrypt = require("bcrypt")
//saltrounds make it harder for a hacker to guess the password
    //const saltRounds = 10

//using passport for creating cookies and session
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

//google oauth2.0
const GoogleStrategy = require('passport-google-oauth20').Strategy;

//
const findOrCreate = require("mongoose-findorcreate")


const app = express();

app.use(express.static("public"))
app.set('view engine','ejs')
app.use(bodyParser.urlencoded({extended:true}));



//The following three app.use should be made in the same order before connecting to the DB
//for express-session module
app.use(session({
    secret: process.env.SECRET_FOR_COOKIE,
    resave: false,
    saveUninitialized: false,
  }))

app.use(passport.initialize())
app.use(passport.session())



mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
})

//console.log(process.env.SECRET) is used to access secret info from .env file


//mongoose encrypts the password when user is created i.e save() methood
//and decrypts teh password when using find() method


// the below line uses basic encryption using a secret key with the help of thee mongoose-encryption module
    //userSchema.plugin(encrypt,{secret: process.env.SECRET , encryptedFields:  ['password']})


//this is used for passport module
    userSchema.plugin(passportLocalMongoose)
//for oauth 2.0
    userSchema.plugin(findOrCreate)

const User = new mongoose.model("User",userSchema)

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id)
  });
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err,user){
        done(err,user)
    })
  });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));





app.get("/",function(req,res){
    res.render("home")
})

app.get("/auth/google",passport.authenticate('google',{scope: ["profile"]}))

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login",function(req,res){
    res.render("login")
})

app.get("/register",function(req,res){
    res.render("register")
})

app.get("/secrets",function(req,res){

   //To see secrets page only after logging in.
//    if(req.isAuthenticated()){
//     res.render("secrets")

//    }
//    else{
//     res.redirect("/login")
//    }
    
   
    //This secret page can be viewwed by anyone without logging in as well.
    User.find({"secret": {$ne:null}},function(err,foundUsers){
        if(err)
        {
            console.log(err);
        }
        else{
            if(foundUsers){
                res.render("secrets",{usersWithSecrets: foundUsers})
            }
        }
    })
})

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit")
    }
    else{
        res.redirect("/login")
    }
})



app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret
    User.findById(req.user.id,function(err,foundUser){
        if(err){
            console.log(err);
        }
        else{
            if(foundUser){
                foundUser.secret = submittedSecret
                foundUser.save(function(){
                    res.redirect("/secrets")
                })
            }
        }
    })
})
app.get("/logout",function(req,res){
    req.logout(function(err){
        if(err){
            console.log(err)
        }
        else{
            res.redirect("/")
        }
    });
    
})


app.post("/register",function(req,res){
    
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     // Store hash in your password DB.
    //     const newUser = new User({
    //         email: req.body.username,         
    //         password: hash
    //     })
    //     newUser.save(function(err){
    //         if(err)
    //         {
    //             console.log(err)
    //         }
    //         else{
    //             res.render("secrets")
    //         }
    //     })
    // });



    //using passport for cookies and session
   //the register method creates an entry in the DB with 2 fields, username and password(which is split into 2 fields i.e salt and hash)
    User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
        console.log(err);
        res.redirect("/register")
    }
    else{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets")
        })
    }

   })
    
})

app.post("/login",function(req,res){

    // const username = req.body.username;
    // //const password = md5(req.body.password);
    // const password = req.body.password;


    // User.findOne({email:username},function(err,foundUsers){
    //     if(foundUsers){

    //         //using bcrypt compare method to check the hashed password with user enteredd password while logging in
    //         bcrypt.compare(password, foundUsers.password, function(err, result) {
    //             if(result===true){
    //                 res.render("secrets")
    //             }
    //         });            
    //     }
    // })

    //using passport for cookies and session

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user,function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
        })
        }
    })
})

app.listen(3000,function(){
    console.log("Server running at port 3000")
})