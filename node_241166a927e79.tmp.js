const express = require("express");
const app = express();
const moment = require("moment");
app.set("view engine", "ejs");
app.use(express.static("public"));
const method = require("method-override");
app.use(method("_method"));
app.use(express.urlencoded({ extended: true }));

const mongoose = require("mongoose");

mongoose
  .connect("mongodb://127.0.0.1:27017/myProject")
  .then(() => console.log("Connected!"));
const custmer = require("./models/modelcustomer");

app.get("/", (req, res) => {
  custmer
    .find()
    .then((data) => {
      res.render("index", { data: data, moment: moment });
    })
    .catch((err) => {
      console.log(err);
    });
});
app.get("/user/add.html", (req, res) => {
  res.render("user/add");
});

// app.post('/user/view.html',(req,res)=>{
//        custmer.updateOne(req.body)
//     .then(()=>{res.redirect('/')})
//     .catch(()=>{console.log('faluse')})
// })

app.post("/user/add.html", (req, res) => {
  // console.log(req.body)
  custmer
    .create(req.body)
    .then(() => {
      res.redirect("/");
    })
    .catch(() => {
      console.log("faluse");
    });
});
app.get("/user/:id", (req, res) => {
  //res.render("user/edit");
  custmer.findById(req.params.id).then((data) => {
    res.render("user/edit", { data: data, moment: moment });
  });
});

app.get("/user/:id", (req, res) => {
  custmer.findById(req.params.id).then((user) => {
    res.render("user/view", { user: user, moment: moment });
  });
});

app.post('/search',(req,res)=>{
    custmer.find({frist_name:req.body.name})
    .then((data)=>{res.render('index',{data:data,moment:moment})})
})
app.put("/edit/:id", (req, res) => {
 
  custmer.updateOne({ _id: req.params.id }, { $set: req.body }).then((data) => {
    res.redirect("/");
  });
});
app.delete("/delete/:id", (req, res) => {
  
  custmer.deleteOne({ _id: req.params.id }).then(res.redirect("/"));
});
app.listen(2000, () => {});
