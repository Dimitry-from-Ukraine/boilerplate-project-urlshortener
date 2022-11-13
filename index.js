"use strict";
require('dotenv').config();

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var cors = require("cors");
var dns = require("dns");
var app = express();
var router = express.Router;
var shortId = require("shortid");
var validUrl = require("valid-url");

// Basic Configuration
const port = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 
})

const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String
});
const URL = mongoose.model("URL", urlSchema);

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cors());
app.use(express.json());
app.use('/public', express.static(process.cwd() + '/public'));
app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html')
});
app.get('/api/hello', function(req, res){
  res.json({greeting: 'hello API'})
});

app.post('/api/shorturl', async function(req, res) {
  const url = req.body.url
  const urlCode = shortId.generate()
  if (!validUrl.isWebUri(url)) {
    console.log(url + ' - url is invalid')
    res.json({
      error: 'invalid url'
    })
  } else {
    try {
      let findOne = await URL.findOne({
        original_url: url
      })
      if (findOne) {
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      } else {
        findOne = new URL({
          original_url: url,
          short_url: urlCode
        })
        await findOne.save()
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      }
    } catch (err) {
      console.error(err)
      res.status(500).json('Server error...')
    }
  }
})

app.get('/api/shorturl/:short_url?', async function (req, res) {
  try {
    const urlParams = await URL.findOne({
      short_url: req.params.short_url
    })
    if (urlParams) {
      return res.redirect(urlParams.original_url)
    } else {
      return res.status(404).json('No URL found')
    }
  } catch (err) {
    console.log(err)
    res.status(500).json('Server error')
  }
})

app.listen(port, function() {
  console.log("Node.js listening on port: " + port);
});