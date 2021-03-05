//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

mongoose.connect(
    "mongodb+srv://admin-vicente:Test123@cluster0.pmqh9.mongodb.net/todolistDB?retryWrites=true&w=majority"
);

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const items = ["Buy Food", "Cook Food", "Eat Food"];
const baseItems = [];

const itemSchema = new mongoose.Schema({
    name: String,
});

const Item = mongoose.model("Item", itemSchema);

items.forEach((element) => {
    const item = new Item({ name: element });
    baseItems.push(item);
});

const listSchema = {
    name: String,
    items: [itemSchema],
};

const List = mongoose.model("List", listSchema);

const home = new List({ name: "home", items: [] });
home.save();

app.get("/", function (req, res) {
    Item.find({}, (err, itemList) => {
        if (err) {
            console.log("Error");
        } else {
            if (itemList.length == 0) {
                Item.insertMany(baseItems);
                res.redirect("/");
            } else {
                res.render("list", { listTitle: "Today", newListItems: itemList });
            }
        }
    });
});

app.get("/:listName", (req, res) => {
    let listName = req.params.listName;
    if (listName == _.toLower(_.kebabCase(listName))) {
        listName = _.startCase(_.toLower(listName));
        List.findOne({ name: listName }, (err, list) => {
            if (err) {
                console.log("Error");
            } else {
                if (!list) {
                    const newList = new List({ name: listName, items: baseItems });
                    newList.save();
                    res.redirect("/" + listName);
                } else {
                    res.render("list", { listTitle: listName, newListItems: list.items });
                }
            }
        });
    } else {
        res.redirect("/" + _.toLower(_.kebabCase(listName)));
    }
});

app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const newItem = new Item({ name: itemName });
    if (listName == "Today") {
        newItem.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, (err, customList) => {
            if (!err) {
                customList.items.push(newItem);
                customList.save((err) => {
                    if (!err) {
                        res.redirect("/" + listName);
                    }
                });
            }
        });
    }
});

app.post("/delete", (req, res) => {
    const itemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName == "Today") {
        Item.findByIdAndDelete(itemId).then(() => res.redirect("/"));
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: itemId } } }, (err) => {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});
