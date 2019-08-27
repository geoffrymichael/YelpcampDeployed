var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var NodeGeocoder = require("node-geocoder");

var options = {
    providor: "google",
    httpAdapter: "https",
    apiKey: process.env.GEOCODERAPI,
    formatter: null
};

var geocoder = NodeGeocoder(options);


//INDEX route-shows all campgrounds
router.get("/", function(req, res) {
    //We need to get all the campgrounds in our mongo databse
    Campground.find({}, function(err, allCampgrounds) {
        if(err) {
            console.log(err);
        } else {
            res.render("campgrounds/index", {campgrounds: allCampgrounds, currentUser: req.user});
        }
    });
});

//CREATE - adds a new campground
router.post("/", middleware.isLoggedIn, function(req, res) {
    var name = req.body.name;
    var price = req.body.price;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
      id: req.user._id,
      username: req.user.username
    }
    geocoder.geocode(req.body.location, function (err, data) {
        if(err || !data.length) {
            console.log("geocode error", err)
            req.flash("error", "Address not found");
            return res.redirect("back");
        }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newCampground = {name: name, price: price, image: image, description: desc, author:author, location: location, lat: lat, lng: lng};
    //mongoose way of creating a new campground and adding it to database
        Campground.create(newCampground, function(err, newlyCreated) {
            if(err){
                console.log(err);
            } else {
                //redirect back to campgrounds page after adding a new one
                res.redirect("/campgrounds");    
            }
        });    
    });
});

//NEW - this is the form that allows user to add new campground
router.get("/new", middleware.isLoggedIn, function(req, res) {
   res.render("campgrounds/new"); 
});

//SHOW shows more information about the campground
router.get("/:id", function(req, res){
    //find the campground with the provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
       if(err || !foundCampground){
           req.flash("error", "Campground not found");
           res.redirect("back");
       } else {
           console.log(foundCampground);
           res.render("campgrounds/show", {campground: foundCampground});
       }
    });
 });
 
 //EDIT Route
 router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
        Campground.findById(req.params.id, function(err, foundCampground) {
             res.render("campgrounds/edit", {campground: foundCampground});
    });
 });
 
 

// UPDATE Route 
 router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
    geocoder.geocode(req.body.location, function (err, data) {
        if(err || !data.length) {
            req.flash("error", "Address not found");
            return res.redirect("back");
        }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newData = {name: req.body.name, price: req.body.price, image: req.body.image, description: req.body.description,  location: location, lat: lat, lng: lng};
         Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, updatedCampground) {
            if(err){
                res.redirect("/campgrounds")
            } else {
                res.redirect("/campgrounds/" + req.params.id);
            }
        });            
    });
 });
  




 
 //DELETE Route 
 router.delete("/:id", middleware.checkCampgroundOwnership,  function(req, res) {
    Campground.findByIdAndRemove(req.params.id, function(err) {
      if(err){
          res.redirect("/campgrounds");
      } else {
          res.redirect("/campgrounds");
      }
    });
 });
 
 

 
 module.exports = router;