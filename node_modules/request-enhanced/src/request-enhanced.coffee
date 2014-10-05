# request-enhanced.coffee
# A layer on top of the request library to further abstract and simplify web requests
# Written by Joshua DeVinney

# Includes
request = require 'request'
fs = require 'fs'
Heap = require 'heap'

# Variables
defaults =
  maxAttempts: 10
  priority: 0
  timeout: 10000
  retryDelay: 5000
  defaultValue: ''
  pool:
    maxSockets: Infinity
  maxConcurrent: 100

# 
# Function setDefaults 
# Sets the defaults for request-enhanced
# @params
#    newDefaults:  an object containing the parameters desired to override
#
setDefaults = (newDefaults) ->
  for d of newDefaults
    defaults[d] = newDefaults[d]

# 
# Function get 
# Fetches a URL and optionally can gather data from it
# @params
#    options:  string of the URL to access as a string or an object containing the url and other options
#    [regex]:  an optional key-value map of keys to regex to perform on the result and return under the given key
#               each of the values will either be a RegExp object (typeof -> 'object' or 'function') or a string
#               (typeof -> 'string') with a regular expression inside to specify that multiple results are desired
#    callback: the callback to be used when complete
# @callback
#    an error object or null
#    string data that was returned
#    an object containing all properties as defined by regex or null if no regex
#
get = (options, regex, callback) ->
  defaultValue = if typeof options is 'object' and options.defaultValue? then options.defaultValue else defaults.defaultValue
  if typeof options is 'string' then options = url: options
  unless options.timeout?     then options.timeout      = defaults.timeout
  unless options.maxAttempts? then options.maxAttempts  = defaults.maxAttempts
  unless options.pool?        then options.pool         = defaults.pool
  unless options.retryDelay?  then options.retryDelay   = defaults.retryDelay
  if not callback and typeof regex is 'function'
    callback = regex
    regex = null
  getHelper options, processResults = (err, result) ->
    if err? then return callback err
    fetched = (if (result and typeof result isnt "string") then result.buffer.toString("utf8") else result or "")
    if not regex? then return callback null, fetched, null
    results = {}
    for key, search of regex
      regexp = search.regex
      if typeof regexp is 'string'
        regexp = new RegExp regexp, (if search.multiple then 'g' else '') + (unless search.caseSensitive then 'i' else '') + (if search.multiline then 'm' else '')
      result = fetched.match regexp
      if not regexp.global 
        if not search.results?
          delete result.input if result?
          results[key] = result or []
        else if typeof search.results is 'number'
          results[key] = if result? and result[search.results] then result[search.results] else defaultValue
        else if typeof search.results is 'object'
          results[key] = {}
          for value, index of search.results
            results[key][index] = if result? and result[value] then result[value] else defaultValue
        else throw new Error 'Unsupported results type. Results must be the integer index of the result or an object with keys being the indexes of the results.'
      else
        regexp = new RegExp regexp.source, (if regexp.ignoreCase then 'i' else '') + (if regexp.multiline then 'm' else '')
        results[key] = []
        for r, i in result or []
          inner = r.match regexp
          if not search.results?
            delete inner.input if inner?
            results[key][i] = inner or []
          else if typeof search.results is 'number'
            results[key][i] = if inner? and inner[search.results] then inner[search.results] else defaultValue
          else if typeof search.results is 'object'
            results[key][i] = {}
            for value, index of search.results
              results[key][i][index] = if inner? and inner[value] then inner[value] else defaultValue
          else throw new Error 'Unsupported results type. Results must be the integer index of the result or an object with keys being the indexes of the results.'
    callback null, fetched, results

# 
# Function getHelper
# Fetches the content of a url with a HTTP GET request
# @params
#    options:  string of the page to access as a string
#    callback: the callback to be used when complete
# @callback
#    an error object or null
#    a string containing the contents of the url
#
getHelper = (options, callback, attemptsLeft, lastError) ->
  attemptsLeft = options.maxAttempts if not attemptsLeft?
  if attemptsLeft <= 0 then return callback (if lastError? then lastError else new Error 'No attempts to fetch the URL were made')
  request options, (error, response, body) ->
    if (error && (error.code in ['ESOCKETTIMEDOUT', 'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED'])) || (response && 500 <= response.statusCode < 600)
      e = if error then new Error("#{error.code} error on #{options.url}") else new Error("HTTP #{response.statusCode} error fetching #{options.url}")
      e.code = if error then error.code else response.statusCode
      setTimeout (-> getHelper options, callback, --attemptsLeft, e), options.retryDelay
    else if not error && 200 <= response.statusCode < 300
      callback null, body
    else if error
      e = new Error "Error fetching '#{options.url}': #{error.message} (#{error.code})"
      e.code = error.code
      callback e
    else
      e = new Error "HTTP #{response.statusCode} error fetching #{options.url}"
      e.code = response.statusCode
      callback e

# 
# Function getFile
# Fetches the content of a url and puts it in a file
# @params
#    url:       string of the page to access as a string
#    filename:  string of the filename to write the url's content to
#    callback:  the callback to be used when complete
# @callback
#    an error object or null
#    a string containing the filename that was written to
#
getFile = (options, filename, callback, attemptsLeft, lastError) ->
  if typeof options is 'string' then options = url: options
  unless options.timeout?     then options.timeout      = defaults.timeout
  unless options.maxAttempts? then options.maxAttempts  = defaults.maxAttempts
  unless options.pool?        then options.pool         = defaults.pool
  unless options.retryDelay?  then options.retryDelay   = defaults.retryDelay
  attemptsLeft = options.maxAttempts if not attemptsLeft?
  if attemptsLeft <= 0 then return callback lastError
  path = filename.substr 0, filename.lastIndexOf '/'
  mkdirs path, '0777', (err) ->
    if err
      callback err
    else
      req = request(options)
      req.pipe fs.createWriteStream filename
      calledBack = false
      req.on "end", ->
        if not calledBack
          calledBack = true
          if 200 <= req.response.statusCode < 300 # success!
            callback null, filename
          else if 500 <= req.response.statusCode < 600 # retry if temp failure
            e = new Error "HTTP #{req.response.statusCode} error fetching file #{options.url}"
            e.code = req.response.statusCode
            setTimeout (-> getFile options, filename, callback, --attemptsLeft, e), options.retryDelay
          else
            callback new Error "HTTP #{req.response.statusCode} error fetching file #{options.url}"
      req.on "error", (error) -> # error event only fires when socket issues
        if not calledBack
          calledBack = true
          e = new Error("#{error.code} error fetching file #{options.url}")
          e.code = error.code
          setTimeout (-> getFile options, filename, callback, --attemptsLeft, e), options.retryDelay

# 
# Function mkdirs
# Ensures all directories in a path exist by creating those that don't
# @params
#    path:      string of the path to create (directories only, no files!)
#    mode:      the integer permission level
#    callback:  the callback to be used when complete
# @callback
#    an error object or null
#
mkdirs = (path, mode, callback) ->
  tryDirectory = (dir, cb) ->
    fs.stat dir, (err, stat) ->
      if err #the file doesn't exist, try one stage earlier then create
        if err.errno is 2 or err.errno is 32 or err.errno is 34
          if dir.lastIndexOf("/") is dir.indexOf("/") #only slash remaining is initial slash
            #should only be triggered when path is '/' in Unix, or 'C:/' in Windows
            cb new Error("Directory creation error: #{dir}")
          else
            tryDirectory dir.substr(0, dir.lastIndexOf("/")), (err) ->
              if err #error, return
                cb err
              else #make this directory
                fs.mkdir dir, mode, (error) ->
                  if error and error.errno isnt 17
                    cb new Error("Failed to create directory: #{dir}")
                  else
                    cb()
        else #unkown error
          cb err
      else
        if stat.isDirectory() #directory exists, no need to check previous directories
          cb()
        else #file exists at location, cannot make folder
          cb new Error("File already exists: #{dir}")
  path = (if path.indexOf("\\") >= 0 then path.replace("\\", "/") else path) #change windows slashes to unix
  path = path.substr(0, path.length - 1)  if path.substr(path.length - 1) is "/" #remove trailing slash
  tryDirectory path, callback


# Heap
running = 0
heap = new Heap (a, b) ->
  return a.priority - b.priority

# 
# Function popStuff
# Starts requests when space is available in the queue
#
popStuff = ->
  process.nextTick ->
    if not heap.size() or running >= defaults.maxConcurrent then return
    running++
    next = heap.pop()
    next.function.apply null, next.arguments
    popStuff()

# 
# Function getRequest
# Queues a get request for processing
# @params
#    options:      a string of the URL to access as a string or an object containing the url and other options
#    [filename]:   an optional string of the filename to write the url's content to that when present will stream to a file
#    [regex]:      an optional key-value map of keys to regex to perform on the result and return under the given key
#                   each of the values will either be a RegExp object (typeof -> 'object' or 'function') or a string
#                   (typeof -> 'string') with a regular expression inside to specify that multiple results are desired 
#    [priority]:   an integer priority (defaulted to the default priority) for ordering of requests with lower numbers
#                   being of higher priority, higher priority being choosen first, and equal priority being FIFO
#    callback:     the callback to be used when complete
# @callback
#    an error object or null
#    any additional parameters will be sent by the get or getFile functions
#
getRequest = (options, args..., callback) ->
  filename = regex = null
  priority = defaults.priority
  for a in args
    switch typeof a
      when 'string' then filename = a
      when 'object' then regex = a
      when 'number' then priority = a
  use = if filename? then getFile else get
  fetchback = (results...) ->
    running--
    callback.apply null, results
    popStuff()
  heap.push
    priority: priority
    arguments: [options, (if filename? then filename else regex), fetchback]
    function: use
  popStuff()

# Exports
module.exports =
  get: getRequest
  setDefaults: setDefaults
