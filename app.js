const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("Public"));
app.set("view engine", "ejs");

// ------------------------Defining Schema for MongoDb-------------------------

mongoose.connect(
    "mongodb://localhost:27017/todolistDB",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    }
);

const itemsSchema = new mongoose.Schema({
    name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to To-do-List",
});

const item2 = new Item({
    name: "click + to add new tasks",
});

const item3 = new Item({
    name: "<-- click this checkbox when done!",
});

const defaultItems = [item1, item2, item3];


// ---------------------------- Custom List Schema ----------------------------

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

// --------------------------GET Requests---------------------------------------

app.get("/", (req, res) => {
    Item.find({}, (err, foundItems) => {
        if (err) {
            console.log(err);
        } else {
            if (foundItems.length === 0) {
                Item.insertMany(defaultItems, (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Added default Items");
                    }
                    res.redirect("/");
                });
            } else {
                const day = date.getDate();
                res.render("list", { listTitle: day, newitems: foundItems });
            }
        }
    });
});

app.get("/lists/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, (err, foundList) => {
        if (!err) {
            if (!foundList) {
                // Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems,
                });

                list.save();
                res.redirect("/lists/" + customListName);
            } else {
                res.render("list", {
                    listTitle: foundList.name,
                    newitems: foundList.items,
                });
            }
        }
    });
});

// ---------------------------POST Requests-------------------------------------

app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.listName;
    
    const newItem = new Item({
        name: itemName,
    });

    if (listName === date.getDay() + ",") {
        newItem.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, (err, foundList) => {
            if (!err) {
                foundList.items.push(newItem);
                foundList.save();
                res.redirect("/lists/" + listName);
            } else {
                console.log(err);
            }
        });
    }
});

app.post("/delete", (req, res) => {
    const deleteId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === date.getDay() + ",") {
        Item.findByIdAndDelete(deleteId, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Checked Item deleted Successfully");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id:deleteId}}}, (err, foundList) => {
            if (!err) {
                res.redirect("/lists/" + listName)
            }
        })
    }
});

// -------------------------------------------------------------------

app.listen(3000, () => {
    console.log("Server is up & running on PORT 3000");
});
