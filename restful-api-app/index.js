/*
 * primary file for API
 *
 */

// dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

const config = require('./config');
const fs = require('fs');

const PARSING_QUERY_STRING = true;

// http server
const httpServer = http.createServer(function(req, res) {
  unifiedServer(req, res);
});

// start the server
httpServer.listen(config.httpPort, function() {
  console.log('The HTTP server is listening on port ' + config.httpPort + ' now. Let rumble this world.')
});

// https server
const httpsServerOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem')
}
const httpsServer = https.createServer(httpsServerOptions, function(req, res) {
  unifiedServer(req, res);
});

// start the server
httpsServer.listen(config.httpsPort, function() {
  console.log('The HTTPs server is listening on port ' + config.httpsPort + ' now. Let rumble this world.')
});

// ==================== HANDLERS - START ====================
const handlers = {
  ping: pingHandler,
  notFound: notFoundHandler,
  hello: helloHandler,
}

// sample handler
function pingHandler(data, callback) {
  // callback a http status code, and a payload object
  callback(200);
}

// not found handler
function notFoundHandler(data, callback) {
  callback(404);
}

// Hello world handler
function helloHandler(data, callback) {
  // create hello world message
  const helloMessage = {
    message: "hello to nodejs world",
  }
  callback(404, helloMessage);
}

// ==================== HANDLERS - END ====================

// ==================== ROUTERS - START ====================
const router = {
  'ping': handlers.ping,
  'hello': handlers.hello,
};
// ==================== ROUTERS - END ====================

// create unified server
const unifiedServer = function(req, res) {
  // get the url and parse it
  const parsedUrl = url.parse(req.url, PARSING_QUERY_STRING);

  // get the PATH from url
  const path = parsedUrl.pathname || '';
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // get the QUERY STRING as an object
  const queryStringObject = parsedUrl.query;

  // get the HTTP METHOD
  const method = req.method.toLowerCase();

  // get the HEADERS as an object
  const headers = req.headers;

  // get the PAYLOAD, if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', function(data) {
    buffer += decoder.write(data);
  });
  req.on('end', function() {
    buffer += decoder.end();

    // choose the handler this request should go to
    const chosenHandler =
      typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // construct the data object to send to the handler
    const data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': buffer,
    }

    // route the request to the handler
    chosenHandler(data, function(statusCode, payload) {
      // use the status code called back by the handler, or default 200
      const newStatusCode = typeof(statusCode) == 'number' ? statusCode : 200;

      // use the payload called back by the handler, or default an empty object
      const newPayload = typeof(payload) == 'object' ? payload : {};

      // convert the payload into string
      const payloadString = JSON.stringify(newPayload);

      // return the response
      res.setHeader('Content-type', 'application/json')
      res.writeHead(newStatusCode);
      res.end(payloadString);

      // log the request
      console.log('statusCode: ', statusCode, 'payloadString: ', payloadString);
    });
  });
};

