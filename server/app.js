// Load environment variables first
require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var multer = require('multer');

// Connect to local MongoDB
const upload = multer({ dest: './public/uploads/profile-pictures/' });

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/playerradar';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var trialsRouter = require('./routes/trials');
var activitiesRouter = require('./routes/activities');
var skillEvaluationsRouter = require('./routes/skillEvaluations');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Serve video highlights with proper headers
app.use('/uploads/video-highlights', express.static(path.join(__dirname, 'public/uploads/video-highlights'), {
  setHeaders: function (res, path, stat) {
    res.set('Content-Type', 'video/mp4'); // Default video content type
  }
}));

app.use('/', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/trials', trialsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/skill-evaluations', skillEvaluationsRouter);

module.exports = app;
