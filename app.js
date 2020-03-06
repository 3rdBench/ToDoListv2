//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Address Mongoose deprecation warnings
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

// Connect to local MongoDB database
mongoose.connect("mongodb://localhost:27017/todolistDB");

// Schema for list items
const itemSchema = new mongoose.Schema({
  name: String
});

// Model for defined schema itemSchema
const Item = mongoose.model("Item", itemSchema);

// Default list item (i.e. documents)
const item1 = new Item({
  name: "Welcome to your ToDoList!"
});

const item2 = new Item({
  name: "Click the + button to add a new item."
});

const item3 = new Item({
  name: "<== Click to delete an item."
});

// Store default item list into the following array
const defaultItems = [item1, item2, item3];

Item.insertMany(defaultItems, function(err){
  if(err) {
    console.log(err);
  } else {
    console.log("Successfully saved items in database.");
  }
});

app.get("/", function(req, res) {
  // Retrieve default items from database
  Item.find({}, function(err, foundItems){
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  });

});

app.post("/", function(req, res){

  const item = req.body.newItem;

  if (req.body.list === "Work") {
    workItems.push(item);
    res.redirect("/work");
  } else {
    items.push(item);
    res.redirect("/");
  }
});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
