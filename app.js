//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Address Mongoose deprecation warnings
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

// Connect to local MongoDB database (*** remove comment below when intended to run locally ***)
mongoose.connect("mongodb://localhost:27017/todolistDB");

// Connect to MongoDB Atlas cluster
// mongoose.connect("mongodb+srv://admin-benjie:test1234@cluster0-fxsru.mongodb.net/todolistDB");

// Schema for list items for default list (i.e. Today)
const itemSchema = new mongoose.Schema({
  name: String
});

// Model for schema itemSchema
const Item = mongoose.model("Item", itemSchema);

// Document to the model Item; assigned with 3 initial list items
const item1 = new Item({
  name: "Welcome to your ToDoList!"
});

const item2 = new Item({
  name: "Click the + button to add a new item."
});

const item3 = new Item({
  name: "<== Click to delete an item."
});

const defaultItems = [item1, item2, item3];


// Schema for custom list
const listSchema = mongoose.Schema({
  // Name of custom list
  name: String,
  // Array of list items associated to the custom list
  items: [itemSchema]
});

// Model for schema listSchema
const List = mongoose.model("List", listSchema);

// Default list 'home' route (i.e. Today)
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


// Custom list 'home' route
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  // Check if name of custom list already exists
  List.findOne({name: customListName}, function(err, foundList){
    if (!err) {
      if (!foundList) {
        // Creat custom list & assign 3 initial documents (i.e. defaultItems array)
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        // Render custom list items
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});


// Add a new item to the list
app.post("/", function(req, res){
  // Save list item submitted by the user
  const itemName = req.body.newItem;

  // Save name of active list
  const listName = req.body.list;

  // Corresponding document for the list item
  const item = new Item({
    name: itemName
  });

  // Check which list the submitted item will be added to
  if (listName === "Today"){
    // Save list item & render the 'Today' list
    item.save();
    res.redirect("/");
  } else {
    // Search for custom list from the database
    List.findOne({name: listName}, function(err, foundList){
      // Save list item & render custom list
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

// Delete list item (identified by the document's _id field)
app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  // Remove list item from the 'Today' list
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err){
        console.log("Successfully deleted item from database.");
        res.redirect("/");
      }
    });
  } else {
    // Remove list item from custom list
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemId}}},
      function(err, foundList){
        if (!err) {
          res.redirect("/" + listName);
        }
    });

  }

});

// Render the web app's 'About' page
app.get("/about", function(req, res){
  res.render("about");
});


// Assign port number that will allow the app to run locally or remotely (Heroku)
let port = process.env.PORT;

if (port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully.");
});
