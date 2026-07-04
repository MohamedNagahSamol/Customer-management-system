const User = require("../models/customerSchema");
var moment = require("moment");

const user_index_get = (req, res) => {
  User.find({ user: req.userId })
    .then((result) => {
      res.render("index", { arr: result, moment: moment });
    })
    .catch((err) => {
      console.log(err);
    });
};

const user_edit_get = (req, res) => {
  User.findOne({ _id: req.params.id, user: req.userId })
    .then((result) => {
      if (!result) return res.status(404).send("Customer not found");
      res.render("user/edit", { obj: result, moment: moment });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Server error");
    });
};

const user_view_get = (req, res) => {
  User.findOne({ _id: req.params.id, user: req.userId })
    .then((result) => {
      if (!result) return res.status(404).send("Customer not found");
      res.render("user/view", { obj: result, moment: moment });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Server error");
    });
};

const user_search_post = (req, res) => {
  const searchText = req.body.searchText.trim();
  const regex = new RegExp(searchText, "i");

  User.find({ user: req.userId, $or: [{ firstName: regex }, { lastName: regex }] })
    .then((result) => {
      res.render("user/search", { arr: result, moment: moment });
    })
    .catch((err) => {
      console.log(err);
    });
};

const user_delete = (req, res) => {
  User.deleteOne({ _id: req.params.id, user: req.userId })
    .then((result) => {
      res.redirect("/home");
    })
    .catch((err) => {
      console.log(err);
    });
};

const user_put = (req, res) => {
  User.updateOne({ _id: req.params.id, user: req.userId }, req.body)
    .then((result) => {
      res.redirect("/home");
    })
    .catch((err) => {
      console.log(err);
    });
};

const user_add_get = (req, res) => {
  res.render("user/add");
};

const user_post = (req, res) => {
  User.create({ ...req.body, user: req.userId })
    .then(() => {
      res.redirect("/home");
    })
    .catch((err) => {
      console.log(err);
    });
};

module.exports = {
  user_index_get,
  user_edit_get,
  user_view_get,
  user_search_post,
  user_delete,
  user_put,
  user_add_get,
  user_post,
};
