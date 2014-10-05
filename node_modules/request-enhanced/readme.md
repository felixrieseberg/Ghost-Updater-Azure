Request Enhanced
================

Request Enhanced is a Node.js library that functions as a layer on top of the [request](https://github.com/mikeal/request) library to further abstract and simplify web requests. No worries about handling simple errors or retries, pooling requests, dealing with the complexity of writing to a file, or even manually searching the fetched content. Just fetch and done.


New Features
------------

In addition to the awesome features that request offers, the following bonus features are available with request-enhanced

* **Greater File Saving Simplicity** - No more worrying about odd edge cases or strange syntax when downloading to files. Directories are also automatically created along the specified file path as necessary.

* **Request Pooling** - All requests are pooled to prevent EMFILE errors from too many simultaneous requests.

* **Request Prioritizing** - Requests can be given a priority so that higher priority requests can execute first. 

* **Easy Searching of Results** - With regex queries, searching the resulting textual data becomes extremely simple.

* **Automatic Retries** - When the connection fails with one of `ESOCKETTIMEDOUT`, `ETIMEDOUT`, `ECONNRESET` or `ECONNREFUSED` or when an HTTP 5xx error occurrs, the request will automatically be re-attempted as these are often recoverable errors and will go away on retry.


Installing
----------

```
npm install request-enhanced
```


Basic Usage
-----------

To perform a simple GET request, the following code can be used:

```javascript
var re = require('request-enhanced');
re.get('http://www.example.com', function(error, data){
  console.log('Fetched:', data);
});
```


Don't want the result in memory and would rather pipe it to a file? No problem!

```javascript
re.get('http://www.example.com', '/path/to/resulting/file', function(error, filename){
  console.log('Saved content to:', filename);
});
```


Function Documentation
----------------------

### The `get` Function

The `get` function actually has a bunch of optional parameters to achieve additional functionality. A detailed description of each of the parameters is below.

```
get ( options, [filename or regex], [priority], callback )
```

#### `options`
The options parameter behavior is nearly identical to request's options paramter. It is possible to pass a string URL of the target or any of [request's parameters](https://github.com/mikeal/request#requestoptions-callback) in an options object with the following additional options:

* `maxAttempts` - The maximum number of attempts to retry the request, defaults to `10`
* `retryDelay` - The delay in milliseconds before trying again after a recoverable failure, defaults to `5000`
* `defaultValue` - The default value to assign to regex queries that find no data, defaults to `''`

The following options already existing in request now have default values:

* `timeout` - Now defaults to `10000`
* `pool` - Now defaults to `{maxSockets: Infinity}`

#### `filename`
The filename is an optional string representing a location on disk where the results of the GET request should be written to. Any directories in the path not currently existing will be created automatically. *This option cannot be used at the same time as `regex`.*

#### `regex`
To perform regular expression searches on the returned data, an optional regex query object can be provided. Regex queries are explained in the "Regex Queries" section below. *This option cannot be used at the same time as `filename`.*

#### `priority`
The priority is an optional number representing the request's priority. Requests with a lesser value will be performed prior to those with a higher valued priority. Requests with the same priority will be performed in a [FIFO order](http://en.wikipedia.org/wiki/FIFO). If not specified, a request is given the default priority of `0`.

#### `callback`
The callback function will be called on success or error due to unrecoverable error or reaching the maximum retries. The following parameters will be passed back to this function in the following order:

* `error` - This will either be an error object if there was an error, or `null` if there was not. The error object may have a `code` paramter for an HTTP status code if the error was HTTP related.
* `data` - If a filename was specified in the call, a string filename will be returned of the newly saved file on disk. If a filename was not specified in the call, the string data returned from the GET request will be returned.
* `results` - If regex queries were specified in the call and a filename was not, the results of the queries running on the `data` will be returned in this object


### The `setDefaults` Function
The `setDefaults` function allows for setting of the default values across all requests. A detailed description of each of the parameter it takes is below.

```
setDefaults ( newDefaults ) 
```

#### `newDefaults`
The newDefaults object contains a mapping of keys with their defaults. Only the defaults that are specified will be overridden. All others will remain as they were previously and any additional non-existant defaults specified will be ignored. 

Here is a list of the defaults that can be overridden:

```javascript
defaults = {
  maxAttempts: 10, // The default maximum number of retries before a request is deemed a failure
  priority: 0, // The default priority a request is given if not specified
  timeout: 10000, // The default delay in milliseconds before a request is automatically aborted and retried
  retryDelay: 5000, // The default delay in milliseconds before a request is attempted again after a recoverable failure
  defaultValue: '', // The default value to give a regex query if nothing is found
  pool: { // request's default pool parameter
    maxSockets: Infinity // request's max sockets is set to Infinity to allow request-enhanced to control pooling
  },
  maxConcurrent: 100 // The maximum number of concurrent requests
};
```

Regex Queries
-------------
Regex queries are a much simpler way to deal with searching in the returned content. When a regex query object is present in a call to the `get` function, the fetched data will be automatically parsed.

### Basic Regex Query
Here is a very simple regex query:

```javascript
{
  query: {
    regex: /My query: "(.*?)"/i,
    results: 1
  }
}
```

What this means is that the fetched data will be searched for the regex and then the first result of the match will be assigned to the `query` key of the `results` object returned. 

As an example, if using the regex query above and the fetched data contained `my query: "hello world"`, the results object would look like this:

```javascript
{
  query: "hello world"
}
```

### String Regular Expressions
Instead of supplying a native RegExp object, it is also possible to supply a string as the regex.

```javascript
{
  query: {
    regex: 'My query: "(.*?)"',
    results: 1
  }
}
```

By default, only the case insensitive flag `i` will be set automatically, but it is possible to set or disable any of the three flags.

```javascript
{
  query: {
    regex: 'My query: "(.*?)"',
    results: 1,
    caseSensitive: true, // disables the i flag
    multiple: true,      // enables the g flag
    multiline: true      // enables the m flag
  }
}
```

The values of these parameters need not be the boolean `true`, but anything that equates to true.

### Multiple Matches
By default, a regex query will return only the first match, but it is possible to return the results of every match by setting the global flag `g` in the RegExp object or by using the `multiple: true` setting. Instead of returning the value of the result directly as the value of the key as in the basic example, the value will be an array of matches.

Take for example, the following regex query:

```javascript
{
  query: {
    regex: /My query: "(.*?)"/gi,
    results: 1
  }
}
```

If the fetched data contained both `my query: "hello world"` and `my query: "goodbye world"`, the results object would look like this:

```javascript
{
  query: ["hello world", "goodbye world"]
}
```

*Note: An array will always be returned for multiple matches queries. Simply use `array.length` to determine the number of matches found.*

### Multiple Results
It is also possible to return multiple results from a single query. Simply supply a mapping of result indexes to keys to store the resulting data on in place of the numerical index from the above examples. The results object will assign the matches to the keys and return the new mapping as the result.

This query will return multiple results:

```javascript
{
  query: {
    regex: /My query: "(.*?)", ~(.*?)~/i,
    results: {
      1: 'myquery',
      2: 'tilde'
    }
  }
}
```

If the fetched data contained `my query: "hello world", ~hello!~`, the results object would look like this:

```javascript
{
  query: {
    myquery: 'hello world',
    tilde: 'hello!'
  }
}
```

Multiple results can be returned from multiple matches as well. By tweaking the example query above to add a global flag `g` and also finding `my query: "goodbye world", ~goodbye!~` in the fetched data, the results object would be changed to this:

```javascript
{
  query: [
    {
      myquery: 'hello world',
      tilde: 'hello!'
    }, 
    {
      myquery: 'goodbye world',
      tilde: 'goodbye!'
    }
  ]
}
```

### Multiple Queries
Finally, it is also possible to do as many queries as desired on the fetched data. Simply supply more keys mapping to regex queries.

Use this type of query:

```javascript
{
  queryOne: { ... },
  queryTwo: { ... },
  queryThree: { ... },
}
```

to produce this type of results object:

```javascript
{
  queryOne: ... ,
  queryTwo: ... ,
  queryThree: ... ,
}
```

### Tips and Tricks
1. **Important to note!** The `.` character in JavaScript flavored regular expressions *doesn't* match line breaks by default. It is neccessary to set the multiline flag `m` in the RegExp object, or use `multiline: true` for a string regular expression if this functionality is desired.
2. The index of the first match in a regex query is not 0, but 1. The entire matched string is at index 0 thanks to JavaScript's `String.match()` function. Requesting an index of 0 will return the entire matched string (e.g. `my query: "hello world"`).
3. When unsure about the indexes of the results of the regex query, simply remove the `results:` declaration (or set to null). The `String.match()` results as described in #2 will all be returned in an array. An empty array will be returned in cases where nothing is found.
