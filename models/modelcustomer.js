const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const custmerSchema= new Schema({
    frist_name:String,
    last_name:String,
    email:String,
    phone:String,
    age:String,
    country:String,
    gender:String,
},{timestamps:true})

const custmer = mongoose.model("custmer",custmerSchema)
module.exports=custmer