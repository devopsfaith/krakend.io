# Lua advanced helpers

> Extend the functionality of your Lua scripts with additional helpers that run natively on Go for optimal performance and advanced functionality

Source: https://www.krakend.io/docs/enterprise/endpoints/lua-advanced-helpers/

When running Lua scripts on the Enterprise Edition, a collection of helpers extends functionality and improves the speed of Lua execution. Because these helpers run natively on Go and their output is passed to the Lua virtual machine, their performance is optimal and much better than any behavior you can code within Lua libraries.

## Debug helpers

The debug package contains a single method that allows you to dump into the console objects for debugging:

- `debug.dump(anything, [comment=""])`: Prints in the console the value and type of the variable passed to the function.

### Dump example

```lua
-- Dump full request
debug.dump(request.load())
-- Dump full response with a comment
debug.dump(response.load(), "My response comment")
-- Dump context
-- debug.dump(ctx.load())
-- Dump the request body
-- debug.dump(json.unmarshal(request.load():body()))
```

The uncommented lines above could print in the console something like this:

```
DEBUG: [Lua] Dumping
(map)
  headers: (map)
    X-Correlation-Id: [something] ([]string)
    X-Some-List: [i1 i2] ([]string)
  method: GET (string)
  params: (map)
    user: john (string)
  path: / (string)
  query:  (string)
  url: https://example.com/ (string)
DEBUG: [Lua] Dumping "My response comment"
(map)
  data: (map)
    f1: v1 (string)
    f2: v2 (string)
  headers: (map)
    X-Multi-Value: [v1 v2] ([]string)
    X-Response: [a] ([]string)
  isComplete: true (bool)
  statusCode: 200 (float64)
```

As you can see, both objects are present in the console and contain details about their inner types.

## JSON encoding/decoding helpers

They allow you to convert to JSON back and forth.

- `json.marshal(object)`: Converts an object into a JSON string
- `json.unmarshal(string)`: Converts a JSON string into a KrakenD `luaTable`

### JSON helper example

Given a backend that responds with a JSON payload like the one below, we want to round balances:

```json
[
  {
    "id": 1,
    "name": "Mike",
    "balance": 10.3
  },
  {
    "id": 2,
    "name": "Jane",
    "balance": 11.15
  },
  {
    "id": 4,
    "name": "Jack",
    "balance": 56.05
  }
]
```

The following Lua function does this job:

```lua
-- Our response comes in JSON format. We want to unmarshal, tweak the balance, and set it as JSON again
function json_marshal_test()
    local res = response.load()
    local report = json.unmarshal(res:data():get("content"))

    -- Round the balance
    for i=0,report:len()-1 do
        local r = report:get(i)
        report:get(i):set("balance", math.floor(r:get("balance")))
    end
    -- end of rounding awesomeness

    res:data():del("content")
    res:data():set("content", json.marshal(report))
end
```

Note that when accessing the content of the backend we use `:get("content")` as our backend `encoding` used the `string` type (see [automated wrappers](https://www.krakend.io/docs/enterprise/backends/supported-encodings/#automatic-content-wrappers-collection-and-content)).

Also, when configuring our Lua component, we will need to set the flag `"allow_open_libs": true` so we can access the function `math.floor()`.

## YAML encoding/decoding helpers

Similary, you can work natively with YAML content:

- `yaml.marshal(object)` : Converts an object into a YAML string
- `yaml.unmarshal(string)`: Converts a YAML string into a KrakenD `luaTable`

### YAML helper example

Provided a backend that returns the following yaml content:

```yaml
- id: 1
  name: Mike
  balance: 10.3
- id: 2
  name: Jane
  balance: 11.15
- id: 4
  name: Jack
  balance: 56.05
```

The following Lua function rounds the balances:

```lua
function yaml_unmarshal_test()
    local res = response.load()
    local report = yaml.unmarshal(res:data():get("content"))

    -- Round the balance
    for i=0,report:len()-1 do
        local r = report:get(i)
        report:get(i):set("balance", math.floor(r:get("balance")))
    end
    -- end of rounding awesomeness

    res:data():del("content")
    res:data():set("report", report)
end
```

## XML encoding/decoding helpers

XML helpers work slightly different in their usage, but the signature is common to the others:

- `xml.marshal(object)` : Converts a Lua native object into a XML string
- `xml.unmarshal(string)`: Converts a XML string into a KrakenD `luaTable`

### XML helper example

Provided a backend that returns the following XML content:

```xml
<customers>
    <customer>
        <id>1</id>
        <name>Mike</name>
        <balance>10.3</balance>
    </customer>
    <customer>
        <id>2</id>
        <name>Jane</name>
        <balance>11.15</balance>
    </customer>
    <customer>
        <id>4</id>
        <name>Jack</name>
        <balance>56.05</balance>
    </customer>
</customers>
```

This is its rounding balances function:

```lua
function xml_marshal_test()
    local res = response.load()
    local t = xml.unmarshal(res:data():get("content"))
    local report = t:get("customers"):get("customer")

    round_balance(report)

    local r = {}
    r.customers = {}
    r.customers.customer = report

    res:data():del("content")
    res:data():set("content", xml.marshal(r))
end
```

## CSV data helpers

Sometimes we want to convert a CSV file into a JSON object, convert a JSON response into a CSV, or just manipulate data in the CSV and return it modified. The specific functions to work with CSV are:

- `csv.marshal(object, [delimiter=","])` : Converts a Lua native object into a CSV string
- `csv.unmarshal(string, [delimiter=","])`: Converts a CSV string into a KrakenD `luaTable`

### CSV transformation example

Let’s say our backend returns a CSV file with the following content:

```csv
id,name,balance
1,Mike,10.3
2,Jane,11.15
4,Jack,56.05
```

The following Lua function rounds the balances from the CSV and returns the modified content:

```lua
function csv_marshal_test()
    local res = response.load()
    local report = csv.unmarshal(res:data():get("content"))

    --- Round the balance
    for i=0,report:len()-1 do
        local r = report:get(i)
        report:get(i):set("balance", math.floor(r:get("balance")))
    end
    -- end of rounding awesomeness

    res:data():set("content", csv.marshal(report))

    -- Or return as JSON instead:
    --- res:data():set("content", json.marshal(report))
end
```

## Base64 helpers

The base64 helpers allow you to work with base64 content. The available helpers are:

- `base64.encode(string|number)`: Converts a string or a number into a base64-encoded string
- `base64.decode(string)`: Converts a base64-encoded string into its decoded text
- `base64.urlencode(string|number)`: Converts a string or number into an URL-encoded string
- `base64.urldecode(string)`: Decodes a URL-encoded string into its represented string

## Hashing functions helpers

Hashing functions can help you with data integrity and privacy. There are quite a few hashing algorithms you can use:

- `hashing.fnv1_32(string)`: Converts a string to its Fowler–Noll–Vo 32-bit hash representation (FNV-1)
- `hashing.fnv1_64(string)`: Converts a string to its Fowler–Noll–Vo 64-bit hash representation (FNV-1)
- `hashing.fnv1_32a(string)`: Converts a string to its Fowler–Noll–Vo 32-bit hash representation (FNV-1a)
- `hashing.fnv1_64a(string)`: Converts a string to its Fowler–Noll–Vo 64-bit hash representation (FNV-1a)
- `hashing.sha1(string)`: Converts a string to its 160-bit Secure Hash Algorithm (SHA-160)
- `hashing.sha224(string)`: Converts a string to its 224-bit Secure Hash Algorithm (SHA-224)
- `hashing.sha256(string)`: Converts a string to its 256-bit Secure Hash Algorithm (SHA-256)
- `hashing.sha384(string)`: Converts a string to its 384-bit Secure Hash Algorithm (SHA-384)
- `hashing.sha512(string)`: Converts a string to its 512-bit Secure Hash Algorithm (SHA-512)
- `hashing.md5(string)`: Converts a string into its 128-bit Message-Digest Algorithm 5 (MD5)

## Time helpers

The final group of helpers allows you to work natively with dates:

- `time.parse(layout, string)`: Converts a string into a time variable according to the given layout. See [Go layout](https://pkg.go.dev/time#Layout)
- `time.now()`: Returns a time variable with the current time according to the system’s clock.

Given a `t` variable with any of the methods above, the following functions are available:

- `t:unix()`: Returns the associated UNIX timestamp in seconds
- `t:format(layout)`: Retuns the string representing the time in the [desired layout](https://pkg.go.dev/time#Layout)

In addition, there is a parse duration package (which does not accept the functions above):

- `time.parseduration(string|number)`: Given a KrakenD duration (e.g., `2s`, `1h`), it parses the string as a time variable. It also accepts a number as an argument representing nanoseconds.

Given a `d` variable using the parse duration above, you can use the following functions:

- `d:nanoseconds()`: Returns the nanoseconds contained within the duration
- `d:string()`: Returns a string representing the duration (e.g., `1h30m`)
