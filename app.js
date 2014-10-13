var express         = require('express'),
    exphbs          = require('express-handlebars'),
    path            = require('path'),
    favicon         = require('serve-favicon'),
    logger          = require('morgan'),
    cookieParser    = require('cookie-parser'),
    bodyParser      = require('body-parser'),
    debug           = require('debug')('Ghost-Updater-Azure'),
    
    config          = require('./config'),
    updater         = require('./updater'),
    backup          = require('./updater/backup');

var app = express(), errorHandlers;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);

app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));
app.get('/nw', function (req, res) {
    res.json({ isNodeWebkit: config.standalone });
});
app.use('/updater', updater);
app.use('/backup', backup);

app.get('/', function (req, res) {
    res.render('index');
});

errorHandlers = require('./updater/errors')(app);

var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});

module.exports = app;
