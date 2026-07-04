const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  firstName: String,
  lastName: String,
  email: String,
  phoneNumber: String,
  age: Number,
  country: String,
  gender: String,
}, { timestamps: true });

// Create a model based on that schema
const User = mongoose.model("customer", userSchema);

// export the model
module.exports = User;
