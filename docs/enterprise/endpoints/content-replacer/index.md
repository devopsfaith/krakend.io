# Replace content with regular expressions and other functions

> Utilize pre-defined content modifiers to replace values in responses dynamically using regular expressions and other functions.

Source: https://www.krakend.io/docs/enterprise/endpoints/content-replacer/

The `modifier/response-body` allows you to change the content of any desired fields using several modifiers, from regular expression replacement to simpler modifiers like trimming characters or converting the case.

It works by declaring an array of `modifiers` that KrakenD executes sequentially. You can add multiple modifiers to get the desired output.

The modifiers declare an explicit `field` where you want to apply the modifications, and the value of these fields **must be a string** in all cases. If you try to replace content on integers, objects, arrays, etc. the modifier won’t apply any change.

Modifiers can change fields located at the root of the response but also in nested objects and arrays. Using the wildcard `*` will traverse and apply the modification on all matching elements of an array and also on all fields of an object. For example with the data `"data": [{"user":"Mary"}]` you could modify `Mary` value with `field: data.*.user` but also by index `field: data.0.user`. If the data was `"data": {"user":"Mary", "role":"admin"}` and you apply the modification to `field: data.*`, it would change both `Mary` and `admin`.

The modifiers work both in the `endpoint` and `backend` sections, allowing you to change content before or after the merge operation.

## Configuration

The configuration is straightforward and requires you to declare the different `modifiers` you want to apply. The `modifiers` array declares **one modifier per object**, and each modifier requires a different set of fields that you can check below.

You will need only one modifier in most cases, but you can add as many as needed. Operations execute sequentially; the one declared at the top of the configuration is the first to apply, and then it moves down. Remember that modifiers skip non-string values.

Here’s a simple example with a single operation to convert to uppercase and lowercase two specific fields:

```json
{
  "url_pattern": "/user/{user}",
  "extra_config": {
    "modifier/response-body": {
      "modifiers": [
        {
          "upper": {
            "@comment": "We want all surnames uppercased, like SMITH",
            "field": "surname"
          }
        },
        {
          "lower": {
            "@comment": "We want the address in lower case",
            "field": "address"
          }
        }
      ]
    }
  }
}
```

See the different modifiers you can use below.

### Regular expression modifier

The most powerful modifier is the regular expression modifier `regexp` that allows you to replace strings using any regular expression you need. It needs the field name where you want to apply the regular expression, the pattern you want to find, and its replacement. Here’s an example:

```json
{
  "url_pattern": "/card/{user}",
  "extra_config": {
    "modifier/response-body": {
      "modifiers": [
        {
          "regexp": {
            "@comment": "Ridiculous card masking. Take 4 digits and remove the rest. Credit card is inside a data object.",
            "field": "data.credit_card",
            "find": "(^\\d{4})(.*)",
            "replace": "${1}-XXXX"
          }
        }
      ]
    }
  }
}
```

Notice that our `field` uses the dot `.` notation, because we want to modify a nested element, so we have passed `data.credit_card`. Then, the `find` contains the regular expression, and the `replace` is the new output we want to produce. The `$1` in the replace references the first capturing group (the 1st parenthesis on find) we have set in the regular expression. This is what the response returns now:

```json
{
  "data": {
    "credit_card": "1234-XXXX"
  }
}
```

Versus the original response from the backend:

```json
{
  "data": {
    "credit_card": "1234-56789-1234-5678"
  }
}
```

These are the properties of the modifier:

##### Configuration of the regexp modifier

\* required fields

##### [`modifiers`](https://www.krakend.io/docs/enterprise/endpoints/content-replacer/#modifiers "Click to copy link to modifiers") array of objects

A list of modifiers you would like to apply to specific fields. The modifiers are evaluated and applied in sequential order.

Defaults to `[]`

Each item of modifiers accepts the following properties:

##### [`regexp`](#modifiers-regexp "Click to copy link to regexp") object

A list of regular expressions you would like to apply to specific fields. The expressions are evaluated and applied in sequential order.

Example: `{"field":"data.credit_card","find":"(^\\d{4})(.*)","replace":"${1}-XXXX"}`

##### [`field`](#regexp-field "Click to copy link to field") * string

The field you want to modify. The field supports dot notation to access nested objects (it does not work with nested arrays).

Example: `"data.credit_card"`

##### [`find`](#regexp-find "Click to copy link to find") * string

The find expression or literal you want to use. The syntax of the regular expressions accepted is the same general syntax used by Perl, Python, and other languages. More precisely, it is the syntax accepted by RE2 and described at [https://golang.org/s/re2syntax](https://golang.org/s/re2syntax)

##### [`replace`](#regexp-replace "Click to copy link to replace") * string

The literal string or expression you want to use as a replacement. Use `$` signs to replace captured groups.

Example: `"${1}-XXXX"`

Schema: [https://www.krakend.io/schema/v3.0/modifier/response-body.json](https://www.krakend.io/schema/v3.0/modifier/response-body.json "JSON schema definition")

### Literal modifier

Replaces in the desired `field` a text by another using a literal match (case sensitive). Here’s an example:

```json
{
  "url_pattern": "/price",
  "extra_config": {
    "modifier/response-body": {
      "modifiers": [
        {
          "literal": {
            "@comment": "Use the currency name instead of symbol",
            "field": "price",
            "find": "€",
            "replace": "EUR"
          }
        }
      ]
    }
  }
}
```

##### Configuration of the literal modifier

\* required fields

##### [`modifiers`](https://www.krakend.io/docs/enterprise/endpoints/content-replacer/#modifiers "Click to copy link to modifiers") array of objects

A list of modifiers you would like to apply to specific fields. The modifiers are evaluated and applied in sequential order.

Defaults to `[]`

Each item of modifiers accepts the following properties:

##### [`literal`](#modifiers-literal "Click to copy link to literal") object

A literal replacement of strings (case sensitive).

Example: `{"field":"data.example","find":"findme","replace":"replaceme"}`

##### [`field`](#literal-field "Click to copy link to field") * string

The field you want to modify. The field supports dot notation to access nested objects (it does not work with nested arrays).

Example: `"data.credit_card"`

##### [`find`](#literal-find "Click to copy link to find") * string

The exact string you want to replace.

##### [`replace`](#literal-replace "Click to copy link to replace") * string

The replacement string you want to use for all matching results.

Schema: [https://www.krakend.io/schema/v3.0/modifier/response-body.json](https://www.krakend.io/schema/v3.0/modifier/response-body.json "JSON schema definition")

### Uppercase modifier

Replaces a field value with all Unicode letters mapped to their upper case.

```json
{
  "url_pattern": "/user",
  "extra_config": {
    "modifier/response-body": {
      "modifiers": [
        {
          "upper": {
            "field": "surname"
          }
        }
      ]
    }
  }
}
```

##### Configuration of the upper modifier

\* required fields

##### [`modifiers`](https://www.krakend.io/docs/enterprise/endpoints/content-replacer/#modifiers "Click to copy link to modifiers") array of objects

A list of modifiers you would like to apply to specific fields. The modifiers are evaluated and applied in sequential order.

Defaults to `[]`

Each item of modifiers accepts the following properties:

##### [`upper`](#modifiers-upper "Click to copy link to upper") object

Converts a given string to uppercase.

Example: `{"field":"surname"}`

##### [`field`](#upper-field "Click to copy link to field") * string

The field you want to modify. The field supports dot notation to access nested objects (it does not work with nested arrays).

Example: `"user.surname"`

Schema: [https://www.krakend.io/schema/v3.0/modifier/response-body.json](https://www.krakend.io/schema/v3.0/modifier/response-body.json "JSON schema definition")

### Lowercase modifier

Replaces a field value with all Unicode letters mapped to their lower case.

```json
{
  "url_pattern": "/user",
  "extra_config": {
    "modifier/response-body": {
      "modifiers": [
        {
          "lower": {
            "field": "surname"
          }
        }
      ]
    }
  }
}
```

##### Configuration of the lower modifier

\* required fields

##### [`modifiers`](https://www.krakend.io/docs/enterprise/endpoints/content-replacer/#modifiers "Click to copy link to modifiers") array of objects

A list of modifiers you would like to apply to specific fields. The modifiers are evaluated and applied in sequential order.

Defaults to `[]`

Each item of modifiers accepts the following properties:

##### [`lower`](#modifiers-lower "Click to copy link to lower") object

Converts a given string to lowercase.

Example: `{"field":"surname"}`

##### [`field`](#lower-field "Click to copy link to field") * string

The field you want to modify. The field supports dot notation to access nested objects (it does not work with nested arrays).

Example: `"user.surname"`

Schema: [https://www.krakend.io/schema/v3.0/modifier/response-body.json](https://www.krakend.io/schema/v3.0/modifier/response-body.json "JSON schema definition")

### Trim modifier

Removes from a field all characters included in the `find` string.

```json
{
  "url_pattern": "/hello-world",
  "extra_config": {
    "modifier/response-body": {
      "modifiers": [
        {
          "trim": {
            "field": "message",
            "find": "¡!",
            "@comments": "Removes exclamation from message, converting '¡¡¡Hello world!!!' to 'Hello world'"
          }
        }
      ]
    }
  }
}
```

##### Configuration of the trim modifier

\* required fields

##### [`modifiers`](https://www.krakend.io/docs/enterprise/endpoints/content-replacer/#modifiers "Click to copy link to modifiers") array of objects

A list of modifiers you would like to apply to specific fields. The modifiers are evaluated and applied in sequential order.

Defaults to `[]`

Each item of modifiers accepts the following properties:

##### [`trim`](#modifiers-trim "Click to copy link to trim") object

Removes a specific set of characters from the beginning and the end of the string.

Example: `{"field":"description","find":"\n"}`

##### [`field`](#trim-field "Click to copy link to field") * string

The field you want to modify. The field supports dot notation to access nested objects (it does not work with nested arrays).

Example: `"description"`

##### [`find`](#trim-find "Click to copy link to find") * string

The sequence of characters you want to trim in the response.

Examples: `"\r\n"` , `"\n"` , `"\t"` , `" "`

Schema: [https://www.krakend.io/schema/v3.0/modifier/response-body.json](https://www.krakend.io/schema/v3.0/modifier/response-body.json "JSON schema definition")

## Migration from old plugin

Prior to KrakenD v2.9 part of this functionality was offered through a plugin. Now you can use the native component that offers more functionality and performance without needing to load any plugins.

Here are the changes you would need to do to an existing configuration:

```diff
 {
     "extra_config": {
-        "plugin/req-resp-modifier": {
-            "name": [
-                "content-replacer"
-            ],
-            "content-replacer": {
-                "data.credit_card": {
+        "modifier/response-body": {
+            "modifiers": [
+                {
                     "@comment": "Ridiculous card masking. Take 4 digits and remove the rest. Credit card is inside a data object.",
+                    "field": "data.credit_card",
                     "find": "(^\\d{4})(.*)",
-                    "replace": "${1}-XXXX",
-                    "regexp": true
+                    "replace": "${1}-XXXX"
                 },
-                "message": {
+                {
+                    "field": "message",
                     "@comment": "Replace '6 items left' with '6' on the message field",
                     "find": " items left",
                     "replace": ""
                 }
-            }
+            ]
         }
     }
 }
```

The summmary of changes required are:

- Rename the namespace `plugin/req-resp-modifier` to `modifier/response-body`
- Remove the `name` property
- Rename `content-replacer` to `modifiers` and instead of an object convert it into an array
- For each key you had, create an object using one of the available modifiers
- If this was the last `plugin/xxx` entry in your configuration, remove the configuration block `plugin` at the root of the configuration

If you have doubts, please get in touch with support.
