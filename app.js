//jshint esversion:6
require("dotenv").config()
const express = require("express")
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption")
const app = express();

app.use(express.static("public"))
app.set('view engine','ejs')
app.use(bodyParser.urlencoded({extended:true}));


mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

//console.log(process.env.SECRET) is used to access secret info from .env file


//mongoose encrypts the password when user is created i.e save() methood
//and decypts teh password when using find() method

userSchema.plugin(encrypt,{secret: process.env.SECRET , encryptedFields:  ['password']})



const User = new mongoose.model("User",userSchema)


app.get("/",function(req,res){
    res.render("home")
})

app.get("/login",function(req,res){
    res.render("login")
})

app.get("/register",function(req,res){
    res.render("register")
})

app.post("/register",function(req,res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })
    newUser.save(function(err){
        if(err)
        {
            console.log(err)
        }
        else{
            res.render("secrets")
        }
    })
})

app.post("/login",function(req,res){

    const username = req.body.username;
    const password = req.body.password;
    
    User.findOne({email:username},function(err,foundUsers){
        if(foundUsers){
            if(foundUsers.password === password){
                res.render("secrets")
            }
            
        }
    })
})

app.listen(3000,function(){
    console.log("Server running at port 3000")
})