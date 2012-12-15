var mongodb = require('mongodb');
var log4js = require('log4js');
var BSON = require('mongodb').pure().BSON;
var generic_pool = require('generic-pool');

var default_log = {
  appenders: [
    {
      type:"console"
    },
  ],
  replaceConsole:true
};

exports.Mongo = function(config) {
  var max=config.max || 4;
  var db=config.db || 'test'; 
  var host=config.host || 'localhost'; 
  var port=config.port || 27017; 

  log4js.configure(config.log || default_log);
  var logger = log4js.getLogger();

  var pool = generic_pool.Pool({
    name: 'mongo-rest-db',
    max: max,
    create: function(callback) {
      new mongodb.Db(db,
        new mongodb.Server(host,port),
        {safe:true,auto_reconnect:true}
      ).open(function(err,db) {
        if(err) {
          logger.error('Cannot open database:'+err);
        }
        callback(err,db);
      });
    },
    destroy: function(db) {
      db.close();
    }
  });
  
  this.query = function(req, res) {
    var query = req.query.query ? JSON.parse(req.query.query):{};
    pool.acquire(function(err, db) {
      db.collection(req.params.collection, function(err,collection) {
        if(err) {
          pool.release(db);
          res.json({error:err});
        } else {
          collection.find(query).toArray(function(err,docs) {
            pool.release(db);
            res.json(docs);
          });
        }
      });
    });
  };

  return this;
  
};



