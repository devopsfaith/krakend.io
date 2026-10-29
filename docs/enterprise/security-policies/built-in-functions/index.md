# CEL Built-in functions for Security Policies

> Explore CEL built-in functions to enhance security policies in KrakenD Enterprise for maximum protection

Source: https://www.krakend.io/docs/enterprise/security-policies/built-in-functions/

The CEL language ([language definition](https://github.com/google/cel-spec/blob/master/doc/langdef.md)) offers the following built-in functions and macros that you can use while building your [Security Policies](https://www.krakend.io/docs/enterprise/security-policies/) or [conditional requests and responses with CEL](https://www.krakend.io/docs/enterprise/endpoints/common-expression-language-cel/).

The following functions and macros are **always available** regardless of your configuration. The signatures of the functions below follow the format `function -> return`, and include the different data `<types>` you can use in each of them.

## Membership functions and macros

Their usage is checking different aspects of maps and arrays mostly.

Macros are like function calls but check parameters differently and have different runtime semantics. Nevertheless, from a practical point of view, you can treat them as regular functions

### `size`

Returns the size of different types. The cost is proportional to the number of entries on lists and maps.

```
size(<string>) -> <int>
size(<bytes>) -> <int>
size(<list>) -> <int>
size(<map>) -> <int>
```

Examples

```js
size("hello") // returns 5
size(["hi","there"]) // returns 2
size({"hi":1,"there":1}) // returns 2
```

### `in`

Checks the membership of an element in a list or a map. The time cost is proportional to the product of the size of both arguments.

```
<dyn> in <dyn> -> <bool>
```

Examples

```js
1 in [1,2,3] // returns true
"harry" in ["sally","freddy"] // returns false
"foo" in {"foo": 1, "bar": 1} // returns true
'::1' in req_headers['X-Forwarded-For'] // true on loopback address for IPv6
timestamp(now).getDayOfWeek() in JWT.enabled_days // true if claim allows access today
```

### `has`

Checks if a specific field exists.

```
has(<dyn>) -> <bool>
```

Examples

```js
// Given a response data { "foo": 2}
has(resp_data.foo) // returns true
has(resp_data.unexisting) // returns false
```

### `all`

Checks whether a predicate `p` holds true **for all elements** of a list or map `e`. The `i` parameter is the index or key to be used when building `p`. All predicates must return true (*AND* operation). Otherwise, the function will return false. Errors are ignored.

```
e.all(i, p)
```

Examples

```js
[10,20,30].all(i,i>5) // returns true because all are greater than 5
[10,20,30].all(i,i>20) // returns false
["apple", "animal"].all(i,i.startsWith('a')) // returns true
{"apple":1, "animal":2}.all(i,i.contains('ap')) // returns false
```

### `exists`

Like the `all()` macro, but it combines the predicate results with the *OR* operator. Useful to check whether a specific element exists.

```
e.exists(i, p)
```

Examples

```js
[10,20,30].exists(i,i==20) // returns true
[-10,0,5].exists(i,i<0) // returns true
["apple", "animal"].exists(i,i.startsWith('a')) // returns true
["apple", "animal"].exists(i,i.contains('ap')) // returns true
{"apple":1, "animal":2}.exists(i,i == 'zx') // returns false
```

### `exists_one`

like the `exists()` macro, but evaluates to true only if the predicate of **exactly one element** or key evaluates to true, and the rest to false. Any other combination of boolean results evaluates to false, and any predicate error causes the macro to raise an error.

```
e.exists_one(i, p)
```

Examples

```js
[10,20,30].exists_one(i,i==20) // returns true
[-10,2,5].exists_one(i,i>0) // returns false
["apple", "animal"].exists_one(i,i.startsWith('a')) // returns false
["apple", "animal"].exists_one(i,i.contains('ap')) // returns true
{"apple":1, "animal":2}.exists_one(i,i == 'zx') // returns false
```

### `map`

Transforms a list `e` by taking each element `i` to the element given by the expression `t`, which can use the variable `i`. Any evaluation error for any element causes the macro to raise an error. The `map()` macro is not supported when `e` is a map.

```
e.map(i, p)
```

Examples

```js
[1,2,3].map(n, n*n) // returns [1,4,9]
[-10,2,5].map(i,i+1) // returns [-9,3,6]
```

### `filter`

Returns the sublist of all elements `i` of list `e`, which evaluates to true in the predicate expression `p`. If no elements evaluate to be true, the result is an empty list. Any evaluation error for any element causes the macro to raise an error. The `filter()` macro is not supported on maps.

```
e.filter(i, p)
```

Examples

```js
[1,2,3].filter(i, i % 2 > 0)] // returns [1,3]
["apple", "animal"].filter(i,i.startsWith('ap')) // returns ["apple"]
["apple", "animal"].filter(i,i == 'xz') // returns []
```

## String functions

### `contains`

Checks if a substring is contained in a string.

```
<string>.contains(<string>) -> <bool>
```

Examples

```js
// Given a path /testing
req_path.contains('tes') // returns true
req_path.contains('toe') // returns false
```

### `startsWith`

Checks if a substring is the start of a string

```
<string>.startsWith(<string>) -> <bool>
```

Examples

```js
// Given a path /testing
req_path.startsWith('/test') // returns true
req_path.startsWith('/toast') // returns false
```

### `endsWith`

Checks if a substring is the end of a string

```
<string>.endsWith(<string>) -> <bool>
```

Examples

```js
// Given a path /testing
req_path.endsWith('ing') // returns true
req_path.endsWith('test') // returns false
```

### `matches`

Checks a string against a **regular expression** ([RE2 syntax](https://github.com/google/re2/wiki/Syntax))

```
<string>.matches(<string>) -> <bool>
matches(<string>,<string>) -> <bool>
```

Examples

```js
"test".matches('^/[a-zA-Z]{4}$') // returns true
"soap".matches('^/[a-zA-Z]{4}$') // returns true
"sites".matches('^/[a-zA-Z]{4}$') // returns false
matches('123', '[0-9]+') // returns true
matches('test', '[0-9]+') // returns false
// Given an endpoint /hey/{id} called as /hey/kevin
req_params.Id.matches('k.*') // returns true
req_params.Id.matches('m.*') // returns false
```

## Time functions

### `timestamp`

Returns the timestamp from a string in RFC3339 format.

```
timestamp(<string>) -> <timestamp>
```

Examples

```js
timestamp(now) // returns current timestamp
```

### `getDate`

Returns the day of the month. Index starts at 1

```
<timestamp>.getDate() -> <int>
```

Examples

```js
// Given it's February 1st
timestamp(now).getDate() // returns 1
```

### `getMonth`

Returns the month from the date. Starts with index 0 on January and ends at 11

```
<timestamp>.getMonth() -> <int>
```

Examples

```js
timestamp(now).getMonth() // returns 2 on March
```

### `getFullYear`

Returns the year.

```
<timestamp>.getFullYear() -> <int>
```

Examples

```js
timestamp(now).getFullYear() // returned 2023 when writing this example
```

### `getDayOfMonth`

Returns the day of the month. The first month starts at index 0.

```
<timestamp>.getDayOfMonth() -> <int>
```

Examples

```js
// Given it's February 1st
timestamp(now).getDayOfMonth() // returns 0
```

### `getDayOfWeek`

Returns the day of the week. Starts on Sunday with an index 0.

```
<timestamp>.getDayOfWeek() -> <int>
```

Examples

```js
timestamp(now).getDayOfWeek() // returns 0 on Sunday
timestamp(now).getDayOfWeek() // returns 1 on Monday
timestamp(now).getDayOfWeek() // returns 6 on Saturday
(timestamp(now).getDayOfWeek() + 6) % 7 <= 4 // returns false on weekend (Sat-Sun)
(timestamp(now).getDayOfWeek() + 6) % 7 <= 4 // returns true on weekdays (Mon-Fri)
```

### `getDayOfYear`

Returns the day of the year. Starts with index 0.

```
<timestamp>.getDayOfYear() -> <int>
```

Examples

```js
timestamp(now).getDayOfYear() // returns 0 on January 1st
timestamp(now).getDayOfYear() // returns 10 on January 11th
```

### `getHours`

Returns the hours from the date or a duration string. Starts with index 0 and ends at 23

```
<timestamp>.getHours() -> <int>
<duration>.getHours() -> <int>
```

Examples

```js
timestamp(now).getHours() // returns 0 at midnight
timestamp(now).getHours() // returns 7 when the alarm clock sounds
```

### `getSeconds`

Returns the seconds from the date or a duration string. Starts with index 0 and ends at 999

```
<timestamp>.getSeconds() -> <int>
<duration>.getSeconds() -> <int>
```

Examples

```js
timestamp(now).getSeconds() // returns 5 at 23:01:05
```

### `getMilliseconds`

Returns the millisecons from the date or a duration string. Starts with index 0 and ends at 999

```
<timestamp>.getMilliseconds() -> <int>
<duration>.getMilliseconds() -> <int>
```

Examples

```js
timestamp(now).getMilliseconds() // returns 0 at midnight sharp
```
