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

app.get("/", function(req, res) {
  // Retrieve default items from database
  Item.find({}, function(err, foundItems){
    // Check if default list items have already been saved
    if (foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          // Save default items to database & redirect back to root route
          console.log("Successfully saved items in database.");
          res.redirect("/");
        }
      });
    } else{
      // Just render the default items on 'Today' list
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

// Add a new item to the 'Today' list
app.post("/", function(req, res){
  // Save list item submitted by the user
  const itemName = req.body.newItem;

  // Corresponding document to save item list into the database
  const item = new Item({
    name: itemName
  });

  // Save item & redirects back to 'Today' list page
  item.save();
  res.redirect("/");
});

// Delete selected list item by it's _id
app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;

  Item.findByIdAndRemove(checkedItemId, function(err){
    if (!err){
      console.log("Successfully deleted item from database.");
      res.redirect("/");
    }
  });
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
