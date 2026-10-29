# Advanced Macros for Security Policies

> Discover advanced policy macros in KrakenD Enterprise for comprehensive security policies. Strengthen API protection

Source: https://www.krakend.io/docs/enterprise/security-policies/advanced-policy-macros/

The advanced macros are powerful functions that allow you to declare Security Policies with simple expressions, reducing code complexity and speeding up development. Advanced macros are not available on the [CEL component](https://www.krakend.io/docs/enterprise/endpoints/common-expression-language-cel/), only on Security Policies.

You have the following list of advanced macros always available unless you set in the configuration the `disable_advanced_macros` flag to `true`.

Adding functionality

The following list is not the complete catalogue of functions, but the ones added to the [built-in functions](https://www.krakend.io/docs/enterprise/security-policies/built-in-functions/).

## Math

### `between`

Checks if a specific value is between two numbers of the same numeric type, including the limiting numbers. E.g.: `between(2,5,7)` returns true because `2` is between the range.

```
<double>.between(<double>, <double>) -> <bool>
<int>.between(<int>, <int>) -> <bool>
between(<int>, <int>, <int>) -> <bool>
between(<double>, <double>, <double>) -> <bool>
```

Examples

```js
between(2,2,2) // returns true
between(2,5,7) // returns false
2.between(1,3) // returns true
2.between(4,5) // returns false
2.0.between(1.9,2.1) // returns true
```

## Strings

### `isEmpty`

Returns true when a specific value does not exist, or it has an empty value (e.g., a string is `""`)

```
isEmpty(<dyn>) -> <bool>
```

Examples

```js
isEmpty(object.a) // returns true when object is {"a":"", "b":2}
isEmpty(object.a) // returns true when object is {"a":null, "b":2}
isEmpty(object.c) // returns true when object is {"a":1, "b":2}
isEmpty(object.a) // returns false when object is {"a":"hi", "b":2}
```

### `isAlphanumeric`

Checks if a specific value is an alphanumeric string. English letters and numbers only. No other characters are allowed.

```
isAlphanumeric(<string>) -> <bool>
<string>.isAlphanumeric() -> <bool>
```

Examples

```js
isAlphanumeric("") // returns true
isAlphanumeric("abcDFG123") // returns true
isAlphanumeric("abcD-G123") // returns false
"abcDFG123".isAlphanumeric() // returns true
"abcD-G123".isAlphanumeric() // returns false
```

### `isAlphabetic`

Checks if a specific value is an alphabetic string. English letters only. No other characters are allowed.

```
isAlphabetic(<string>) -> <bool>
<string>.isAlphabetic() -> <bool>
```

Examples

```js
isAlphabetic("") // returns true
isAlphabetic("abcDFG") // returns true
isAlphabetic("abcD-G") // returns false
"abcDFG".isAlphabetic() // returns true
"abcD-G".isAlphabetic() // returns false
```

### `find`

Returns the first match for the provided regular expression.

```
<string>.find(<string>) -> <string>
```

Examples

```js
"abc 123".find('[0-9]*') // returns '123'
"abc 123".find('xyz') // returns ''
```

### `charAt`

Returns the character at the given position. If the position is negative or greater than the length of the string, the function will produce an error

```
<string>.charAt(<int>) -> <string>
```

Examples

```js
'hello'.charAt(4)  // returns 'o'
'hello'.charAt(5)  // returns ''
'hello'.charAt(-1) // error
```

### `indexOf`

Returns the integer index of the first occurrence of the search string. If the search string is not found, the function returns -1.

The function also accepts an optional position from which to begin the substring search. If the substring is the empty string, the index where the search starts is returned (zero or custom).

```
<string>.indexOf(<string>) -> <int>
<string>.indexOf(<string>, <int>) -> <int>
```

Examples

```js
'hello mellow'.indexOf('')         // returns 0
'hello mellow'.indexOf('ello')     // returns 1
'hello mellow'.indexOf('jello')    // returns -1
'hello mellow'.indexOf('', 2)      // returns 2
'hello mellow'.indexOf('ello', 2)  // returns 7
'hello mellow'.indexOf('ello', 20) // error
```

### `join`

Returns a new string where the elements of string list are concatenated. The function also accepts an optional separator which is placed between elements in the resulting string.

```
<list<string>>.join() -> <string>
<list<string>>.join(<string>) -> <string>
```

Examples

```js
['hello', 'mellow'].join() // returns 'hellomellow'
['hello', 'mellow'].join(' ') // returns 'hello mellow'
[].join() // returns ''
[].join('/') // returns ''
```

### `lastIndexOf`

Returns the integer index at the start of the last occurrence of the search string. If the the search string is not found, the function returns -1. The function also accepts an optional position which represents the last index to be considered as the beginning of the substring match. If the substring is the empty string, the index where the search starts is returned (string length or custom).

```
<string>.lastIndexOf(<string>) -> <int>
<string>.lastIndexOf(<string>, <int>) -> <int>
```

Examples

```js
'hello mellow'.lastIndexOf('')         // returns 12
'hello mellow'.lastIndexOf('ello')     // returns 7
'hello mellow'.lastIndexOf('jello')    // returns -1
'hello mellow'.lastIndexOf('ello', 6)  // returns 1
'hello mellow'.lastIndexOf('ello', -1) // error
```

### `lowerAscii`

Returns a new string where all ASCII characters are lower-cased. This function does not perform Unicode case-mapping for characters outside the ASCII range.

```
<string>.lowerAscii() -> <string>
```

Examples

```js
'TacoCat'.lowerAscii()      // returns 'tacocat'
'TacoCÆt Xii'.lowerAscii()  // returns 'tacocÆt xii'
```

### `replace`

Returns a new string based on the target, which replaces the occurrences of a search string with a replacement string if present. The function accepts an optional limit on the number of substring replacements to be made.

When the replacement limit is 0, the result is the original string. When the limit is a negative number, the function behaves the same as replace all.

```
<string>.replace(<string>, <string>) -> <string>
<string>.replace(<string>, <string>, <int>) -> <string>
```

Examples

```js
'hello hello'.replace('he', 'we')     // returns 'wello wello'
'hello hello'.replace('he', 'we', -1) // returns 'wello wello'
'hello hello'.replace('he', 'we', 1)  // returns 'wello hello'
'hello hello'.replace('he', 'we', 0)  // returns 'hello hello'
```

### `split`

Returns a list of strings split from the input by the given separator. The function accepts an optional argument specifying a limit on the number of substrings produced by the split.

When the split limit is 0, the result is an empty list. When the limit is 1, the result is the target string to split. When the limit is a negative number, the function behaves the same as split all.

```
<string>.split(<string>) -> <list<string>>
<string>.split(<string>, <int>) -> <list<string>>
```

Examples

```js
'hello hello hello'.split(' ')     // returns ['hello', 'hello', 'hello']
'hello hello hello'.split(' ', 0)  // returns []
'hello hello hello'.split(' ', 1)  // returns ['hello hello hello']
'hello hello hello'.split(' ', 2)  // returns ['hello', 'hello hello']
'hello hello hello'.split(' ', -1) // returns ['hello', 'hello', 'hello']
```

### `substring`

Returns the substring given a numeric range corresponding to character positions. Optionally may omit the trailing range for a substring from a given character position until the end of a string.

Character offsets are 0-based with an inclusive start range and exclusive end range. It is an error to specify an end range that is lower than the start range, or for either the start or end index to be negative or exceed the string length.

```
<string>.substring(<int>) -> <string>
<string>.substring(<int>, <int>) -> <string>
```

Examples

```js
'tacocat'.substring(4)    // returns 'cat'
'tacocat'.substring(0, 4) // returns 'taco'
'tacocat'.substring(-1)   // error
'tacocat'.substring(2, 1) // error
```

### `trim`

Returns a new string that removes the leading and trailing whitespace in the target string. The trim function uses the Unicode definition of whitespace, which does not include the zero-width spaces. See: [](https://en.wikipedia.org/wiki/Whitespace_character#Unicode)[https://en.wikipedia.org/wiki/Whitespace\_character#Unicode](https://en.wikipedia.org/wiki/Whitespace_character#Unicode)

```
<string>.trim() -> <string>
```

Examples

```js
'  \ttrim\n    '.trim() // returns 'trim'
```

### `upperAscii`

Returns a new string where all ASCII characters are upper-cased. This function does not perform Unicode case-mapping for characters outside the ASCII range.

```
<string>.upperAscii() -> <string>
```

Examples

```js
'TacoCat'.upperAscii()      // returns 'TACOCAT'
'TacoCÆt Xii'.upperAscii()  // returns 'TACOCÆT XII'
```

## Bitwise

The bitwise operators work at the level of individual bits. All functions expect one or two number arguments that are internally compared bit to bit. **The maximum number you can pass is a 64-bit** (ignoring the highest bit). Notice that when comparing bits with claims or values found elsewhere, you might **need to cast values to integer** first.

### `bitAnd`

Returns the result of a bitwise AND binary operation comparing each pair of the corresponding bits. When bits in the same position are both 1, the bit resulting in the binary representation is 1.

```
bitAnd(<int>, <int>) -> <int>
```

Examples

```js
bitAnd(6, 1) // returns 0, because 110 AND 001 becomes 000
bitAnd(4, 6) // returns 4, because 100 AND 110 becomes 100
bitAnd(5, 1) // returns 1, because 101 AND 001 becomes 001
```

### `bitOr`

Returns the result of a bitwise OR (inclusive OR) binary operation comparing each pair of the corresponding bits. The result in each position is 0 if both bits are 0, otherwise the result is 1.

```
bitOr(<int>, <int>) -> <int>
```

Examples

```js
bitOr(6, 1) // returns 7, because 110 AND 001 becomes 111
bitOr(4, 6) // returns 6, because 100 AND 110 becomes 110
bitOr(5, 1) // returns 5, because 101 AND 001 becomes 101
```

### `bitXor`

Returns the result of a bitwise XOR (exclusive OR) binary operation comparing each pair of the corresponding bits. The result in each position is 1 if only one of the bits is 1, otherwise is 0.

```
bitXor(<int>, <int>) -> <int>
```

Examples

```js
bitXor(6, 1) // returns 5, because 110 AND 001 becomes 101
bitXor(4, 6) // returns 2, because 100 AND 110 becomes 010
bitXor(5, 1) // returns 4, because 101 AND 001 becomes 100
```

### `bitNot`

Returns the result of a bitwise NOT (or bitwise complement) that performs the logical negation on each pair of the corresponding bits. Bits that are 1 become 0 and vice-versa. You need a 64-bit calculator to understand the following examples.

```
bitNot(<int>) -> <int>
```

Examples

```js
bitNot(2264546456654) // returns 9223349772308319153
bitNot(9223349772308319153) // returns 22264546456654
```

## Headers and query strings

### `has`

Checks if a specific header or query string has a specific key containing a non-empty value. To be used with `req_headers` and `req_querystring`. All keys and values must be accessed as strings. Extends the functionality of the [built-in `has`](https://www.krakend.io/docs/enterprise/security-policies/built-in-functions/#has) function.

```
has(<map<string,list<string>>>, <string>) -> <bool>
<map<string,list<string>>>.has(<string>) -> <bool>
```

Examples

```js
// With a request passing a header "Content-Type: application/json"
req_headers.has("Content-Type") // returns true
req_headers.has("X-Unknown") // returns false
has(req_headers,"Content-Type") // returns true
has(req_headers,"X-Unknown") // returns false

// With a request /endpoint?a[]=1&a[]=2&b=3&c=5&d=
req_querystring.has("a") // returns true
req_querystring.has("d") // returns false
has(req_querystring, "f") // returns false
```

### `hasHeader`

Checks if a specific header exists in the request. The endpoint must declare it in the `input_headers` list.

```
hasHeader(<string>) -> <bool>
```

Examples

```js
hasHeader("") // returns false
hasHeader("User-Agent") // returns true
hasHeader("X-Invented-Header") // returns false
```

### `hasCookie`

Checks if a specific non-empty cookie exists (the endpoint must declare the header `Cookie` in the `input_headers` list)|

```
hasCookie(<string>) -> <bool>
```

Examples

```js
// With these three cookie headers sent: ["foo=bar;foobar=1", "name=value;a=b;c=1", "empty= "]
hasCookie("foo") // returns true
hasCookie("c") // returns true
hasCookie("empty") // returns false
hasCookie("unknown") // returns false
```

### `hasQuerystring`

Checks if a specific non-empty query string exists (the endpoint must declare the query string in the `input_query_strings` list)

```
hasQuerystring(<string>) -> <bool>
```

Examples

```js
// With a request /endpoint?a[]=1&a[]=2&b=3&c=5&d=
hasQuerystring("a") // returns true
hasQuerystring("c") // returns true
hasQuerystring("d") // returns false
hasQuerystring("unknown") // returns false
```

### `getHeader`

Returns the value of a specific header if exists, otherwise returns an error. The endpoint must include this header in the `input_headers` list.

```
getHeader(<string>) -> <string>
```

Examples

```js
// With a request passing a header "Content-Type: application/json"
getHeader("Content-Type") // returns "application/json"
getHeader("unknown") // returns an error
```

### `getCookie`

Checks if a specific non-empty cookie exists. The endpoint must declare the header `Cookie` in the `input_headers` list.

```
getCookie(<string>) -> <string>
```

Examples

```js
// With these three cookie headers sent: ["foo=bar;foobar=1", "name=value;a=b;c=1", "empty= "]
getCookie("foo") // returns "bar"
getCookie("name") // returns "value"
getCookie("emtpy") // returns ""
getCookie("unknown") // returns an error
```

### `contains`

Checks if a specific object contains in a key a specific value. It is designed to work with the types of `req_headers` and `req_querystring`. All keys and values must be accessed as strings.

```
contains(<map<string,list<string>>>, <string>, <string>) -> <bool>
<map<string,list<string>>>.contains(<string>, <string>) -> <bool>
```

Examples

```js
req_headers.contains("Content-Type", "application/json") // returns true when this header is set
req_querystring.contains("foo", "bar") // returns true when ?foo=bar
object.contains("b", "bar") // returns true when object = {"a":["foo"], "b":["bar"]}
contains(object, "b", "bar") // returns true when object = {"a":["foo"], "b":["bar"]}
object.contains("a", "vaz") // returns false when object = {"a":["foo"], "b":["bar"]}
contains(object, "a", "vaz") // returns false when object = {"a":["foo"], "b":["bar"]}
```

### `containsCookie`

Checks if a specific cookie name contains a specific value. To be used with `req_headers`. All keys and values must be accessed as strings.

```
containsCookie(<map<string,list<string>>>, <string>, <string>) -> <bool>
<map<string,list<string>>>.containsCookie(<string>, <string>) -> <bool>
```

Examples

```js
// With these three cookie headers sent: ["foo=bar;foobar=1", "name=value;a=b;c=1", "empty= "]
req_headers.containsCookie("foo", "bar") // returns true
req_headers.containsCookie("name", "value") // returns true
containsCookie(req_headers, "foo", "something") // returns false
containsCookie(req_headers, "unknown", "something") // returns false
containsCookie(req_headers, "empty", "") // returns true
```

### `geoIP`

Returns all the information provided by the [GeoIP plugin](https://www.krakend.io/docs/enterprise/endpoints/geoip/). The contents are determined by the ability of MaxMind’s database to return the information.

```
geoIP() -> <dyn>
```

Examples

```js
// With the GeoIP plugin enabled
geoIP().Country.IsoCode in ["US","UK","AU"] // returns true if user is from the US
geoIP().RepresentedCountry.IsInEuropeanUnion // returns false if user is from the US
```

## Lists and collections

### `collate`

Providing one or more paths of a list, returns a new list with the elements matching the path.

```
<list<dyn>>.collate(<string>) -> <list<dyn>>
<list<dyn>>.collate(<list<string>>) -> <list<dyn>>
<map<string,dyn>>.collate(<string>) -> <list<dyn>>
<map<string,dyn>>.collate(<list<string>>) -> <list<dyn>>
```

Examples

```js
//  Given v:
//  {
//          "a": [
//              {"b": 1},
//              {"b": 2},
//              {"b": 3}
//          ],
//          "c": [
//              {"d": -1, "c": 10},
//              {"d": -2, "c": 20},
//              {"d": -3, "c": 30}
//          ]
//  }
v.collate("a")             // returns [{"b": 1}, {"b": 2}, {"b": 3}]
v.collate("a.b")           // returns [1, 2, 3]
v.collate(["a.b", "c.d"])  // returns [1, 2, 3, -1, -2, -3]
v.collate(["a", "c.d"])    // returns [{"b": 1 }, {"b": 2 }, {"b": 3 }, -1, -2, -3 ]
```

### `drop`

Providing one or more paths of a list, returns a new list removing all matching paths.

```
<list<dyn>>.drop(<string>) -> <list<dyn>>
<list<dyn>>.drop(<list<string>>) -> <list<dyn>>
<map<string,dyn>>.drop(<string>) -> <map<string,dyn>>
<map<string,dyn>>.drop(<list<string>>) -> <map<string,dyn>>
```

Examples

```js
//  Given v:
//  {
//          "a": [
//              {"b": 1},
//              {"b": 2},
//              {"b": 3}
//          ],
//          "b": [
//              {"b": -1, "c": 10},
//              {"b": -2, "c": 20},
//              {"b": -3, "c": 30}
//          ]
//  }
v.drop("a")             // returns {"b": [{"b": -1, "c": 10}, {"b": -2, "c": 20}, {"b": -3, "c": 30}]}
v.drop("a.b")           // returns {"a": [{}, {}, {}], "b": [{"b": -1, "c": 10}, {"b": -2, "c": 20}, {"b": -3, "c": 30}]}
v.drop(["a.b", "b.b"])  // returns {"a": [{}, {}, {}], "b": [{"c": 10}, {"c": 20}, {"c": 30}]}
v.drop(["a", "b.b"])    // returns {"b": [{"c": 10}, {"c": 20}, {"c": 30}]}
```

### `dropEmpty`

Providing an object, removes any element considered empty

```
<list<dyn>>.dropEmpty() -> <list<dyn>>
<map<string,dyn>>.dropEmpty() -> <map<string,dyn>>
```

Examples

```js
//  Given v:
//  {
//          "a": [
//              {},
//              {},
//              {}
//          ],
//          "b": [
//              {"b": -1, "c": 10},
//              {"b": -2, "c": 20},
//              {"b": -3, "c": 30}
//          ]
//  }
//
v.dropEmpty()  // returns {"b":[{"b":-1, "c":10}, {"b":-2, "c":20}, {"b":-3, "c":30}]}
```

### `flatten`

Flattens an array returning a list of values resulting from the depth-first traversal of all nested lists.

```
<list<dyn>...>.flatten() -> <list<dyn>>
```

Examples

```js
[[1],[2,3],[[[4]],[5,6]]].flatten()                     // returns [1, 2, 3, 4, 5, 6]
[[{"a":1,"b":[10, 11]}],[2,3],[[[4]],[5,6]]].flatten()  // returns [{"a":1, "b":[10, 11]}, 2, 3, 4, 5, 6]
```

### `merge`

Merges two objects in a single one, taking precedence the one passed as value.

```
<map<K,V>>.merge(<map<K,V>>) -> <map<K,V>>
```

Examples

```js
{"a":1, "b":2}.merge({"a":10, "c":3})  // returns {"a":10, "b":2, "c":3}
resp_data.merge(JWT)  // returns all the JWT data and response data together
```

### `isSorted`

Returns true if the provided list of comparable elements is sorted, else returns false.

```
<list<T>>.isSorted() -> <bool>, T must be a comparable type
```

Examples

```js
[1, 2, 3].isSorted()  // returns true
['a', 'b', 'b', 'c'].isSorted()  // returns true
[2.0, 1.0].isSorted()  // returns false
[1].isSorted()  // returns true
[].isSorted()  // returns true
```

### `sum`

Returns the sum of the elements of the provided list. Supports CEL number (int, uint, double) and duration types.

```
<list<T>>.sum() -> <T>, T must be a numeric type or a duration
```

Examples

```js
[1, 3].sum() // returns 4
[1.0, 3.0].sum() // returns 4.0
['1m', '1s'].sum() // returns '1m1s'
emptyIntList.sum() // returns 0
emptyDoubleList.sum() // returns 0.0
[].sum() // returns 0
```

### `min`

Returns the minimum valued element of the provided list. Supports all comparable types. If the list is empty, an error is returned.

```
<list<T>>.min() -> <T>, T must be a comparable type
```

Examples

```js
[1, 3].min() // returns 1
[].min() // error
[1].min() // returns 1
([0] + emptyList).min() // returns 0
["foo", "bar"].min() // returns "bar"
```

### `max`

Returns the maximum valued element of the provided list. Supports all comparable types. If the list is empty, an error is returned.

```
<list<T>>.max() -> <T>, T must be a comparable type
```

Examples

```js
[3, 0.7, 1].max() // returns 3
[1.3, 1.4].max() // returns 1.4
["foo", "bar"].max() // returns "foo"
```

### `indexOf`

Returns the first positional index of the provided element in the list. If the element is not found, -1 is returned. Supports all equatable types.

```
<list<T>>.indexOf(<T>) -> <int>, T must be an equatable type
```

Examples

```js
[1, 2, 2, 3].indexOf(2) // returns 1
['a', 'b', 'b', 'c'].indexOf('a') // returns 0
[1.0].indexOf(1.1) // returns -1
[].indexOf('string') // returns -1
```

### `lastIndexOf`

Returns the last positional index of the provided element in the list. If the element is not found, -1 is returned. Supports all equatable types.

```
<list<T>>.lastIndexOf(<T>) -> <int>, T must be an equatable type
```

Examples

```js
[1, 2, 2, 3].lastIndexOf(2) // returns 2
['a', 'b', 'b', 'c'].lastIndexOf('b') // returns 2
[1.0].lastIndexOf(1.1) // returns -1
[].lastIndexOf('string') // returns -1
```

## URL

### `url`

Converts a string to a URL or results in an error if the string is not a valid URL. The URL must be an absolute URI or an absolute path.

```
url(<string>) -> <URL>
```

Examples

```js
url('https://user:pass@example.com:80/path?query=val#fragment') // returns a URL
url('/absolute-path') // returns a URL
url('https://a:b:c/') // error
url('../relative-path') // error
```

### `isURL`

Returns true if a string is a valid URL. The URL must be an absolute URI or an absolute path.

```
isURL(<string>) -> <bool>
```

Examples

```js
isURL('https://user:pass@example.com:80/path?query=val#fragment') // returns true
isURL('/absolute-path') // returns true
isURL('https://a:b:c/') // returns false
isURL('../relative-path') // returns false
```

### `getScheme`

Returns the scheme of an URL or an empty string when absent.

```
<URL>.getScheme() -> <string>
```

Examples

```js
url('/path').getScheme() // returns ''
url('https://example.com/').getScheme() // returns 'https'
```

### `getHost`

Returns the host of an URL or an empty string when absent. IPv6 addresses are returned with braces, e.g. `[::1]`.

```
<URL>.getHost() -> <string>
```

Examples

```js
url('https://example.com:80/').getHost() // returns 'example.com:80'
url('https://example.com/').getHost() // returns 'example.com'
url('https://[::1]:80/').getHost() // returns '[::1]:80'
url('https://[::1]/').getHost() // returns '[::1]'
url('/path').getHost() // returns ''
```

### `getHostname`

Returns the host name of an URL or an empty string when absent. IPv6 addresses are returned without braces, e.g. `::1`

```
<URL>.getHostname() -> <string>
```

Examples

```js
url('https://example.com:80/').getHostname() // returns 'example.com'
url('https://127.0.0.1:80/').getHostname() // returns '127.0.0.1'
url('https://[::1]:80/').getHostname() // returns '::1'
url('/path').getHostname() // returns ''
```

### `getPort`

Returns the port of an URL or an empty string when absent.

```
<URL>.getPort() -> <string>
```

Examples

```js
url('https://example.com:80/').getPort() // returns '80'
url('https://example.com/').getPort() // returns ''
url('/path').getPort() // returns ''
```

### `getEscapedPath`

Returns the escaped URL or an empty string when absent.. E.g., `with space` becomes `with%20space`.

```
<URL>.getEscapedPath() -> <string>
```

Examples

```js
url('https://example.com/path').getEscapedPath() // returns '/path'
url('https://example.com/path with spaces/').getEscapedPath() // returns '/path%20with%20spaces/'
url('https://example.com').getEscapedPath() // returns ''
```

### `getQuery`

Returns the query parameters in “matrix” form where a repeated query key is interpreted to mean that there are multiple values for that key. The keys and values are returned unescaped. If absent in the URL, returns an empty map.

```
<URL>.getQuery() -> <map <string>, <list <string>>
```

Examples

```js
url('https://example.com/path?k1=a&k2=b&k2=c').getQuery() // returns { 'k1': ['a'], 'k2': ['b', 'c']}
url('https://example.com/path?key with spaces=value with spaces').getQuery() // returns { 'key with spaces': ['value with spaces']}
url('https://example.com/path?').getQuery() // returns {}
url('https://example.com/path').getQuery() // returns {}
```

## Encoding

### `toJSON`

Returns the JSON representation of an object.

```
toJSON(<dyn>) -> <string>
<dyn>.toJSON() -> <string>
```

Examples

```js
{"foo":1, "bar":[1, 2, 3]}.toJSON()  // returns "{\"foo\":1,\"bar\":[1,2,3]}"
toJSON({"foo":1, "bar":[1, 2, 3]})   // returns "{\"foo\":1,\"bar\":[1,2,3]}"
```

### `fromJSON`

Returns an object from a JSON representation.

```
<bytes>.fromJSON() -> <dyn>
<string>.fromJSON() -> <dyn>
fromJSON(<bytes>) -> <dyn>
fromJSON(<string>) -> <dyn>
```

Examples

```js
"{\"foo\":1,\"bar\":[1,2,3]}".fromJSON()   // returns {"foo":1, "bar":[1, 2, 3]}
"{\"a\":1,\"bar\":[1,2,3]}".fromJSON()  // returns {"a":1, "bar":[1, 2, 3]}
```

### `fromJSONStream`

Returns a list of objects from a JSON stream.

```
<bytes>.fromJSONStream() -> <list<dyn>>
<string>.fromJSONStream() -> <list<dyn>>
fromJSONStream(<bytes>) -> <list<dyn>>
fromJSONStream(<string>) -> <list<dyn>>
```

Examples

```js
'{"foo":1}{"bar":2}'.fromJSONStream()   // returns [{"foo":1}, {"bar":2}]
'{"foo":1}{"bar":2}'.fromJSONStream()  // returns [{"foo":1}, {"bar":2}]
```

### `base64`

Returns the base64 encoding of a string or array of bytes

```
base64(<bytes>) -> <string>
base64(<string>) -> <string>
<bytes>.base64() -> <string>
<string>.base64() -> <string>
```

Examples

```js
"hello world".base64()  // returns "aGVsbG8gd29ybGQ="
```

### `base64Raw`

Returns the base64 encoding of a string or array of bytes

```
base64Raw(<bytes>) -> <string>
base64Raw(<string>) -> <string>
<bytes>.base64Raw() -> <string>
<string>.base64Raw() -> <string>
```

Examples

```js
"hello world".base64Raw()  // returns "aGVsbG8gd29ybGQ"
```

### `hex`

Returns the base64 encoding of a string or array of bytes

```
hex(<bytes>) -> <string>
hex(<string>) -> <string>
<bytes>.hex() -> <string>
<string>.hex() -> <string>
```

Examples

```js
"hello world".hex()  // returns "68656c6c6f20776f726c64"
```

## Cryptography

### `sha1`

Returns the SHA1 of a string or array of bytes

```
sha1(<bytes>) -> <bytes>
sha1(<string>) -> <bytes>
<bytes>.sha1() -> <bytes>
<string>.sha1() -> <bytes>
```

Examples

```js
"hello world".sha1()       // returns "Kq5sNclPz7QV2+lfQIuc6R7oRu0="
"hello world".sha1().hex() // returns "2aae6c35c94fcfb415dbe95f408b9ce91ee846ed"
```

### `sha256`

Returns the SHA2 of a string or array of bytes

```
sha256(<bytes>) -> <bytes>
sha256(<string>) -> <bytes>
<bytes>.sha256() -> <bytes>
<string>.sha256() -> <bytes>
```

Examples

```js
"hello world".sha256()        // returns "uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek="
"hello world".sha256().hex()  // returns "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
```

### `hmac`

Returns the HMAC of a string or array of bytes

```
hmac(<bytes>, <string>, <bytes>) -> <bytes>
hmac(<string>, <string>, <bytes>) -> <bytes>
<bytes>.hmac(<string>, <bytes>) -> <bytes>
<string>.hmac(<string>, <bytes>) -> <bytes>
```

Examples

```js
"hello world".hmac("sha256", b"key")        // returns "C6BvH5pjAEYeQ0VFNdw8QiPkex01cHPXU26ukOwJW+E="
"hello world".hmac("sha256", b"key").hex()  // returns "0ba06f1f9a6300461e43454535dc3c4223e47b1d357073d7536eae90ec095be1"
```

### `uuid`

Returns a random UUID v4 string

```
uuid() -> <string>
```

Examples

```js
uuid()  // returns "582fc58b-f983-4c35-abb1-65c507c1dc0c"
```
