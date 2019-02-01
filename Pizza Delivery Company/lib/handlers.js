/*
 * Request Handlers
 *
 */
// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

// Define all the handlers
var handlers = {};


// Not-Found
handlers.notFound = function(data,callback){
  callback(404);
};

//Name Replace function
function nameConstruction(str){
  return str.replace("@gmail.com","");
};

// Create Users
handlers.user = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.includes(data.method)){
    handlers._users[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for all the users methods
handlers._users  = {};

// Users - post
// Required data: name, email, address, password,
// Optional data: none
handlers._users.post = function(data,callback){
  // Check that all required fields are filled out
  let name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
  let email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  let address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length >0 ? data.payload.address.trim() : false;
  let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length >0 ? data.payload.password.trim() : false;
  if(name && email && address && password){
    // Make sure the user doesnt already exist
    _data.read('users',nameConstruction(email),function(err,data){
      if(err){
        // Hash the password
        let hashedPassword = helpers.hash(password);

        // Create the user object
        if(hashedPassword){
          let userObject = {
            'name' : name,
            'email' : email,
            'address' : address,
            'hashedPassword' : hashedPassword
          };
          // Store the user
          _data.create('users',nameConstruction(email),userObject,function(err){
            if(!err){
              callback(200);
            } else {
              callback(500,{'Error' : 'Could not create the new user'});
            }
          });
        } else {
          callback(500,{'Error' : 'Could not hash the user\'s password.'});
        }

      } else {
        // User alread exists
        callback(400,{'Error' : 'A user with that email already exists'});
      }
    });

  } else {
    callback(400,{'Error' : 'Missing required fields'});
  }

};

// Required data: email
handlers._users.get = function(data,callback){
  // Check that phone number is valid
  let email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
  if(email){
        // Lookup the user
        _data.read('users',nameConstruction(email),function(err,data){
          if(!err && data){
            // Remove the hashed password from the user user object before returning it to the requester
            delete data.hashedPassword;
            callback(200,data);
          } else {
            callback(404);
          }
        });
      }  else {
    callback(400,{'Error' : 'Missing required field'})
  }
};

// Required data: email
// Optional data: name, password and address (at least one must be specified)
handlers._users.put = function(data,callback){
  // Check for required field
  let email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;

  // Check for optional fields
  let name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
  let address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Error if phone is invalid
  if(email){
    // Error if nothing is sent to update
    if(name || address || password){
          // Lookup the user
          _data.read('users',nameConstruction(email),function(err,userData){
            if(!err && userData){
              // Update the fields if necessary
              if(name){
                userData.name = name;
              }
              if(address){
                userData.address = address;
              }
              if(password){
                userData.hashedPassword = helpers.hash(password);
              }
              // Store the new updates
              _data.update('users',nameConstruction(email),userData,function(err){
                if(!err){
                  callback(200);
                } else {
                  callback(500,{'Error' : 'Could not update the user.'});
                }
              });
            } else {
              callback(400,{'Error' : 'Specified user does not exist.'});
            }
          });
    } else {
      callback(400,{'Error' : 'Missing fields to update.'});
    }
  } else {
    callback(400,{'Error' : 'Missing required field.'});
  }

};

// Required data: email
handlers._users.delete = function(data,callback){
  // Check that phone number is valid
  let email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
  if(email){
        // Lookup the user
        _data.read('users',nameConstruction(email),function(err,userData){
          if(!err && userData){
            // Delete the user's data
            _data.delete('users',nameConstruction(email),function(err){
              if(!err){
                  callback(200);
                }
           else {
                callback(500,{'Error' : 'Could not delete the specified user'});
              }
            });
          } else {
            callback(400,{'Error' : 'Could not find the specified user.'});
          }
        });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};

// Login
handlers.login = function(data,callback){
  var acceptableMethods = ['get'];
  if(acceptableMethods.includes(data.method)){
    handlers._login[data.trimmedPath.indexOf("/") > 0 ? data.trimmedPath.split("/")[1] : data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for all the logins methods
handlers._login  = {};

// login - get
// Required data: email, password
// Optional data: none
handlers._login.get = function(data,callback){
  // Check that id is valid
  let email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
  let password = typeof(data.queryStringObject.password) == 'string' && data.queryStringObject.password.trim().length > 0 ? data.queryStringObject.password.trim() : false;
  if(email && password){
    // Lookup the users
    _data.read('users',nameConstruction(email),function(err,data){
      if(!err && data){
        callback(200);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field, or field invalid'})
  }
};

handlers._login.items = function(data,callback){
  // Check that id is valid
  let email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
  if(email){
    // Lookup the users
    _data.read('users',nameConstruction(email),function(err,data){
      if(!err && data){
        callback(200,{"piza":"Cheese Pizza, Chicken Pizza, Veg Pizza", "Burger":"Cheese Burger, Chicken Burger, Veg Burger", "Cool Drinks":"Soda, MilkShake, coffee/tea"});
      } else {
        callback(404);
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field, or field invalid'})
  }
};

// Orders
handlers.orders = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.includes(data.method)){
    handlers._orders[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for all the orders methods
handlers._orders  = {};


// Orders - post
// Required data: email,itemDetails,
// Optional data: none
handlers._orders.post = function(data,callback){
  // Validate inputs
  let email = typeof(data.payload.email) == 'string' && data.payload.email.length > 0 ?  data.payload.email : false;
  let itemDetails = data.payload.itemDetails instanceof Object && Object.keys(data.payload.itemDetails).length > 0 ? data.payload.itemDetails : false;
  if(itemDetails && email){
          // Lookup the user data
        _data.read('users',nameConstruction(email),function(err,userData){
          if(err && userData){
              // Save the object
              _data.create('orders',nameConstruction(email),itemDetails,function(err){
                if(!err){
                      callback(200);
                    } else {
                      callback(500);
                    }
                  });
                }
            else {
              _data.append('orders',nameConstruction(email),itemDetails,function(err){
                if(!err){
                    callback(200);
                    } else {
                      callback(500);
                    }
                  });
                }
        });
      } else {
    callback(400,{'Error' : 'Missing required inputs, or inputs are invalid'});
  }
};

// Orders - get
// Required data: email
// Optional data: none
handlers._orders.get = function(data,callback){
  // Check that email is valid
  let email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length == 20 ? data.queryStringObject.email.trim() : false;
  if(email){
    // Lookup the users
    _data.read('users',nameConstruction(email),function(err,checkData){
      if(!err && checkData){
    _data.read('orders',nameConstruction(email),function(err,ordersData){
      if(!err && ordersData)
      {
          callback(200,ordersData);
      }
      else {
          callback(404);
      }
    });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field, or field invalid'})
  }
};

// Orders - put
// Required data: email, itemDetails
handlers._orders.put = function(data,callback){
  // Check for required field
  let email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  let itemDetails = data.payload.itemDetails instanceof Object && Object.keys(data.payload.itemDetails).length > 0 ? data.payload.itemDetails : false;
  if(email){
    // Error if nothing is sent to update
    if(itemDetails){
      // Lookup the orders
      _data.read('orders',nameConstruction(email),function(err,checkData){
        if(!err && checkData){
          _data.update('orders',nameConstruction(email),itemDetails,function(err){
            if(!err){
              callback(200);
            } else {
              callback(500,{'Error' : 'Could not update the items.'});
            }
          });
        } else {
          callback(400,{'Error' : 'No Orders available for update.'});
        }
      });
    } else {
      callback(400,{'Error' : 'Missing fields to update.'});
    }
  } else {
    callback(400,{'Error' : 'Missing required field.'});
  }
};


// Orders - delete
// Required data: email
// Optional data: none
handlers._orders.delete = function(data,callback){
  // Check that email is valid
  let email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
  if(email){
    // Lookup the check
    _data.read('users',nameConstruction(email),function(err,userData){
      if(!err && userData){
        _data.read('orders',nameConstruction(email),function(err,orderData){
          if(!err && orderData){

            // Delete the order data
            _data.delete('orders',nameConstruction(email),function(err){
              if(!err){
                    callback(200);
                        } else {
                          callback(500,{'Error' : 'Could not Delete the orders.'});
                        }
                      });
                    } else {
                      callback(500,{"Error" : "Could not find any order for deletion."});
                    }
                  });
              } else {
                callback(500,{"Error" : "Could not find the user."})
              }
            });
          } else {
            callback(403);
          }
        } ;

// Export the handlers
module.exports = handlers;
