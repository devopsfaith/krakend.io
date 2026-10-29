# Postman Integration Guide for Developers

> Integrate KrakenD with Postman for streamlined API development and testing. Explore our documentation to learn how to import, configure, and collaborate on API collections in Postman.

Source: https://www.krakend.io/docs/enterprise/developer/postman/

The Postman generator is a command line utility embedded in the KrakenD binary, offering the automatic generation of Postman collections based on the KrakenD configuration.

When you call the `generate postman` command, it reads the KrakenD configuration and generates a collection of endpoints as a Postman specification.

Another option you have to import your API specifications is to [import an OpenAPI file](https://learning.postman.com/docs/integrations/available-integrations/working-with-openAPI/) into Postman. You can generate the OpenAPI specification from a KrakenD API using the [OpenAPI export](https://www.krakend.io/docs/enterprise/developer/openapi/)

![Postman collections](https://www.krakend.io/images/documentation/postman-collections.png)

## Generating the Postman collection

The command needed to generate the Postman collection is `krakend generate postman`:

Command to start KrakenD 

````
$krakend generate postman -h

╓▄█                          ▄▄▌                               ╓██████▄µ
▐███  ▄███╨▐███▄██H╗██████▄  ║██▌ ,▄███╨ ▄██████▄  ▓██▌█████▄  ███▀╙╙▀▀███╕
▐███▄███▀  ▐█████▀"╙▀▀"╙▀███ ║███▄███┘  ███▀""▀███ ████▀╙▀███H ███     ╙███
▐██████▌   ▐███⌐  ,▄████████M║██████▄  ║██████████M███▌   ███H ███     ,███
▐███╨▀███µ ▐███   ███▌  ,███M║███╙▀███  ███▄```▄▄` ███▌   ███H ███,,,╓▄███▀
▐███  ╙███▄▐███   ╙█████████M║██▌  ╙███▄`▀███████╨ ███▌   ███H █████████▀
                     ``                     `'`

Version: 3.0.2
Generates the Postman descriptor for the gateway based on the configuration file.
Usage:
  krakend generate postman [flags]
Examples:
krakend generate postman -c config.json -o postman.json
Flags:
  -h, --help   help for postman
Global Flags:
  -c, --config string   Path to the configuration filename
  -o, --out string      Path to the generated result. (default "out.json")
````

When the output file is generated, you can import it from Postman and share it with your peers.

## Import the collection to Postman

To import the generated collections into Postman go to `File` &gt; `Import`. You can then either upload the file, or serve it from a KrakenD URL using the [static-filesystem component](https://www.krakend.io/docs/enterprise/endpoints/serve-static-content/). Postman accepts importing Collections and OpenAPI files.

## Postman configuration

While **you don’t need any configuration block** to use Postman, the following options are here to enrich the way your documentation is presented on Postman. For instance, if you want to add descriptions, or group endpoints in folders, you can add this information at the service level and per endpoint.

No configuration is required to generate Postman collections

All items described above are optional and they enrich the Postman output. You can go as far as you want depending on the level of detail you want to give to your Postman collection.

The following is a full example of Postman-documented configuration. It includes a service configuration block that declares names and descriptions for the different folders that are used in the endpoints, and a Postman block for each endpoint.

```json
{
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "version": 4,
  "extra_config": {
    "documentation/postman": {
      "name": "The Awesome Books API",
      "description": "This is a **sample** books API. You can find out more about at your local library [http://blah](http://blah.blah.com)",
      "version": "0.3.0",
      "folder": [
        {
          "name": "/Users",
          "description": "Users reading books. Our **audience**"
        },
        {
          "name": "/Users/Assets",
          "description": "User assets endpoints"
        },
        {
          "name": "/Books",
          "description": "All books endpoints, **the real deal**"
        }
      ]
    }
  },
  "endpoints": [
    {
      "endpoint": "/books",
      "method": "POST",
      "backend": [
        {
          "url_pattern": "/__echo/create-book"
        }
      ],
      "extra_config": {
        "documentation/postman": {
          "name": "Create book",
          "description": "Creates a book in the library. Note that this is not AI generation of books, but rather simple insertion",
          "folder": "/Books"
        }
      }
    },
    {
      "endpoint": "/users/{id}/books",
      "method": "GET",
      "backend": [
        {
          "url_pattern": "/__echo/list-user-books?id={id}"
        }
      ],
      "extra_config": {
        "documentation/postman": {
          "name": "List user books",
          "folder": "/Users/Assets"
        }
      }
    },
    {
      "endpoint": "/users/{id}/book/{bookId}",
      "method": "DELETE",
      "backend": [
        {
          "url_pattern": "/__echo/delete-user-book?id={id}&bid={bookId}"
        }
      ],
      "extra_config": {
        "documentation/postman": {
          "name": "Delete user book ownership",
          "description": "Removes the association of a user with a book",
          "folder": "/Users/Assets"
        }
      }
    }
  ]
}
```

### Postman configuration at the service level

The configuration of Postman at the `service` level is as follows:

##### Fields of Generate documentation using Postman collections

\* required fields

##### [`description`](https://www.krakend.io/docs/enterprise/developer/postman/#description "Click to copy link to description") string

An introductory, optionally verbose, explanation supporting Markdown syntax. If you’d like to load an **external markdown file**, you can use flexible configuration, for instance `"description": {{include "postman/intro.md" | toJson }}`

Example: `"Hi there, I am a [postman collection](https://www.krakend.io/docs/enterprise/developer/postman/)"`

##### [`folder`](https://www.krakend.io/docs/enterprise/developer/postman/#folder "Click to copy link to folder") array of objects

The folder definition where you will add endpoints

Each item of folder accepts the following properties:

##### [`description`](#folder-description "Click to copy link to description")

A description explaining the items inside this folder

Example: `"Books from post-apocalyptic dystopias to brilliant time-travel"`

##### [`name`](#folder-name "Click to copy link to name") * string

The folder name. This might look like the path in an operative system with a slash /, but is not strictly necessary. Usage of special chars is allowed.

Examples: `"/Books"` , `"/Books/Science Fiction/Dystopia"` , `"/书籍/科幻小说"` , `"/पुस्तकें/विज्ञान कथा"` , `"/本/サイエンスフィクション"`

##### [`name`](https://www.krakend.io/docs/enterprise/developer/postman/#name "Click to copy link to name") string

The name of the Postman collection you are generating.

Example: `"KrakenD Config v1"`

##### [`version`](https://www.krakend.io/docs/enterprise/developer/postman/#version "Click to copy link to version") string

The version you assign to this Postman collection you are generating using **semantic versioning**.

Examples: `"1.2.3"` , `"0.7.9"`

Schema: [https://www.krakend.io/schema/v3.0/documentation/postman.json](https://www.krakend.io/schema/v3.0/documentation/postman.json "JSON schema definition")

### Postman configuration at the endpoint level

Then, in each `endpoint` you can also add a `documentation/postman` block with this configuration:

##### Fields of Generate documentation using Postman collections

\* required fields

##### [`description`](https://www.krakend.io/docs/enterprise/developer/postman/#description "Click to copy link to description") string

An introductory, optionally verbose, explanation supporting Markdown syntax. If you’d like to load an **external markdown file**, you can use flexible configuration, for instance `"description": {{include "postman/intro.md" | toJson }}`

Example: `"Hi there, I am a [postman endpoint](https://www.krakend.io/docs/enterprise/developer/postman/)"`

##### [`folder`](https://www.krakend.io/docs/enterprise/developer/postman/#folder "Click to copy link to folder") string

The folder name where you want to put this endpoint. If you defined folders at the service level, use the same name to reuse their name and description

Example: `"/Books"`

##### [`name`](https://www.krakend.io/docs/enterprise/developer/postman/#name "Click to copy link to name") string

The name of the endpoint you are generating. If you don’t set any name the last member path is used.

Examples: `"List books"` , `"Create user"`

Schema: [https://www.krakend.io/schema/v3.0/documentation/postman\_endpoint.json](https://www.krakend.io/schema/v3.0/documentation/postman_endpoint.json "JSON schema definition")
