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

// Corresonding documents for default list items
const item1 = new Item({
  name: "Welcome to your ToDoList!"
});

const item2 = new Item({
  name: "Click the + button to add a new item."
});

const item3 = new Item({
  name: "<== Click to delete an item."
});

// Default list items
const defaultItems = [item1, item2, item3];


// Schema for custom list
const listSchema = mongoose.Schema({
  // Name of custom list
  name: String,
  // Array of list items associated to the custom list name
  items: [itemSchema]
});

// Model for custom list
const List = mongoose.model("List", listSchema);


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


// Dynamic app.get() route for custom list
app.get("/:customListName", function(req, res){
  const customListName = req.params.customListName;

  // Checks if custom list name already exists
  List.findOne({name: customListName}, function(err, foundList){
    if (!err) {
      if (!foundList) {
        // Create a new custom list with default items
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        // Render an existing custom list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});


// Adds a new item to a list
app.post("/", function(req, res){
  // Save list item submitted by the user
  const itemName = req.body.newItem;

  // Save name of active list
  const listName = req.body.list;

  // Corresponding document for the list item
  const item = new Item({
    name: itemName
  });

  // Checks to which list the submitted item will be added to
  if (listName === "Today"){
    // Save list item to database & redirect to 'Today' page
    item.save();
    res.redirect("/");
  } else {
    // Search for custom list from the database
    List.findOne({name: listName}, function(err, foundList){
      // Add the list item, save to database & redirect to custom list page
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

// Delete selected list item by it's _id
app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  // Checks which list the selected item will be delete from
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err){
        console.log("Successfully deleted item from database.");
        res.redirect("/");
      }
    });
  } else {
    // Search for custom list item from the database
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

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
