# Response manipulation with query language (JMESPath)

> KrakenD Enterprise supports response manipulation with a query language. Learn how to use JMESPath for efficient data filtering and manipulation

Source: https://www.krakend.io/docs/enterprise/endpoints/jmespath/

If you’d like to apply **advanced manipulations** before you return the API data, the `modifier/jmespath` allows you to apply JSON query language expressions. Fine-tune the final content delivered to the user, and even add the possibility to add small logic chunks.

The JMESPath query language allows you to select, slice, filter, map, project, flatten, sort, and all sorts of operations. To get familiar with the language, we recommend reading the [JMESPath Tutorial](https://jmespath.org/tutorial.html) and the [JMESPath examples](https://jmespath.org/examples.html). There is also an [Interactive JMESPath playground](https://play.jmespath.org/).

Let’s better illustrate the query language with an example. Your backend returns the following content:

```json
{
  "students": [
    {"name": "Bill", "age": 23 },
    {"name": "Mary", "age": 16 },
    {"name": "Jessica", "age": 19 }
  ]
}
```

But you only need the names of those students who are over 18. You could apply an expression like this:

```js
students[?age > `18` ].name
```

And the final output would be:

```json
["Bill", "Jessica"]
```

## How JMESPath works

After KrakenD has fetched all the data from all the involved backends in an endpoint, the merge operation takes place. Once KrakenD merges all the data from the backends in a final object, it uses it as input of the JMESPath query expression. The output of this component is then returned to the user.

Combine with other manipulation options

You can use the JMESPath component in combination with other manipulation options. For instance, you can apply [Lua `pre` and Lua `post` functions](https://www.krakend.io/docs/enterprise/endpoints/lua/) before this component starts.

## JMESPath configuration

The configuration to set in KrakenD is straightforward as it only needs to receive the expression to execute in the endpoint or the backend.

```json
{
    "endpoint": "/advanced-manipulation",
    "extra_config": {
        "modifier/jmespath": {
            "expr": "students[?age > `18` ].name"
        }
    }
}
```

##### Fields of JMESPath: Response manipulation with query language

\* required fields

##### [`expr`](https://www.krakend.io/docs/enterprise/endpoints/jmespath/#expr "Click to copy link to expr") * string

The JMESPath expression you want to apply to this endpoint.

Schema: [https://www.krakend.io/schema/v3.0/modifier/jmespath.json](https://www.krakend.io/schema/v3.0/modifier/jmespath.json "JSON schema definition")

### Output wrappers

As it happens with the rest of the content in KrakenD, depending on the type of content that the JMESPath expression returns, KrakenD will wrap it or not inside a key:

- `collection`: When the backend returns an array, KrakenD adds the `collection`. You can remove this `collection` key in the final response by setting the `output_encoding` in the endpoint to `json-collection` ([see content types](https://www.krakend.io/docs/endpoints/content-types/))
- `content`: when the JMESPath expression returns just a **string**, a **boolean**, or a **number**, then KrakenD adds a `content` wrapper. You can remove it automatically when setting the `output_encoding` to `string`.

Reusing the same example above, the following configurations have these effects:

```json
{
    "endpoint": "/advanced-manipulation",
    "extra_config": {
        "modifier/jmespath": {
            "expr": "students[?age > `18` ].name"
        }
    }
}
```

Returns:

```json
{
    "collection": ["Bill", "Jessica"]
}
```

While if we add the `output_encoding` expecting a JSON collection:

```json
{
    "endpoint": "/advanced-manipulation",
    "output_encoding": "json-collection",
    "extra_config": {
        "modifier/jmespath": {
            "expr": "students[?age > `18` ].name"
        }
    }
}
```

Then we get the collection directly in the output:

```json
["Bill", "Jessica"]
```

The same happens with the `"output_encoding": "string"` when the query returns a single value.
