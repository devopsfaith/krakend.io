# Extended Flexible Configuration

> The Flexible Configuration allows you to declare the configuration using a templates system, multiple files, and variable injection.

Source: https://www.krakend.io/docs/enterprise/configuration/flexible-config/

The **Extended Flexible Configuration** allows you to express your KrakenD configuration using **multiple files**, reusing code blocks, and injecting external data through a **templates system**. It is called “Extended” because it uses an engine more capable and easier to use than its [open source alternative](https://www.krakend.io/docs/configuration/flexible-config/), while it remains 100% compatible.

In its simplest form, you can do things like:

```json
{
    "version": 4,
    "extra_config": {
        "$ref": "./service/extra_config.json"
    }
}
```

As you can guess, in the example above, the `$ref` entry is replaced by the object declared in the external file, much like it works in the JSON Schema specification. You may need this feature to better control changes in your configuration and facilitate collaboration.

In addition to the `$ref`, the **settings** files allow you to declare custom data structures you can access in the configuration. For instance, if you have a `company.json` or `company.yaml` with the following content:

```yaml
# company.yaml
name: acme
```

Then you could access its attributes like this:

```json
{
    "version": 4,
    "extra_config": {
        "$ref": "{{ .company.name }}/service/extra_config.json"
    }
}
```

The example above is actually a **template** now because we have added the template delimiters `{{ }}`, a very simple one though. We are loading the `extra_config.json` file from a dynamic location that is dictated by a file `company.yaml`, in this case from `acme/service/extra_config.json`.

But **templates** can get *really* complex, with conditionals, iterations, sub-templates, recursivity, etc. If you introduce a lot of complexity, your folks might find your configuration challenging to follow and maintain.

Here’s another simple example:

```go-text-template
{
    "version": 4
    {{ if .company }}
    ,{{ template "service/components.tmpl" .company }}
    {{ end }}
}
```

The example above is a template with a conditional that it renders as a JSON file. Still, you can encode your configuration files in any of the [supported formats](https://www.krakend.io/docs/configuration/supported-formats/) (`json`, `yaml`, `toml`, etc.), as the template engine is agnostic of its contents.

Templates are based on the `text/template` [Go library](https://golang.org/pkg/text/template/), and we recommend you start reading our [introduction to templates](https://www.krakend.io/docs/enterprise/configuration/templates/)

## Flexible Configuration activation

Activating the Extended Flexible Configuration requires creating a **behavioral file** that defines how the engine parses the injected content and where it should take it from. This file sets things like the **paths** to your content or options to parse and debug.

**Copy and paste** the following JSON file and save it as `flexible_config.json`:

```json
 {
    "$schema": "https://www.krakend.io/schema/v3.0/flexible_config.json",
    "settings": {
        "paths": ["settings"],
        "allow_overwrite": true,
        "dir_field_prefix": "",
        "allowed_suffixes": [
            ".yaml",
            ".json"
        ]
    },
    "partials": {
        "paths": ["partials"]
    },
    "templates": {
        "paths": ["templates"]
    },
    "meta_key": "meta",
    "out": "result.json",
    "debug": false,
    "ref_key": "$ref"
}
```

Then, create an **initial directory structure** reflecting the `paths` you have set in the configuration. Following the example above, that would be:

Template boilerplate 

```
$mkdir -p {partials,settings,templates}
```

The meaning of these directories is explained below.

Now you can run the software using `krakend run` or `krakend check`, and it will have the templating engine enabled. If you come from the open-source version of the flexible configuration, you’ll realize you don’t need any previous `FC_` environment variables and that many of the limitations are now gone.

For instance, if your configuration is in a `krakend.tmpl` file:

Execute a simple template 

```
$docker run --rm -v "$PWD:/etc/krakend/" krakend/krakend-ee check -c krakend.tmpl
Parsing configuration file: krakend.tmpl
Syntax OK!
```

This is all you need to start using the Extended flexible configuration.

### The `flexible_config.json` structure

The Extended Flexible Configuration behaves according to its `flexible_config.json` (default name) located in the [working directory](https://www.krakend.io/docs/enterprise/configuration/working-directory/). As you have seen above, you must express it in JSON format. If you change its name, you can pass an **environment variable** `FC_CONFIG=new_file_name.json` specifying your chosen custom filename.

The structure of this file is as follows:

##### Fields of Schema validation for Extended Flexible Configuration. See: https://www.krakend.io/docs/enterprise/configuration/flexible-config/

\* required fields

##### [`debug`](https://www.krakend.io/docs/enterprise/configuration/flexible-config/#debug "Click to copy link to debug") boolean

Whether to enable the debug mode or not. The debug shows the hierarchy of the settings tree in the console. You can also enable this flag during runtime passing an environment variable `FC_DEBUG=true`.

##### [`keys_naming_rules`](https://www.krakend.io/docs/enterprise/configuration/flexible-config/#keys_naming_rules "Click to copy link to keys_naming_rules")

Allows you to apply configuration inheritance using `freeform` keys, or alphanumeric characters (`strict`).

Possible values are: `"strict"` , `"freeform"`

##### [`meta_key`](https://www.krakend.io/docs/enterprise/configuration/flexible-config/#meta_key "Click to copy link to meta_key") string

The name of the variable you have available on templates containing the tree of files involved in the configuration (except partials). You can access to this variable with a starting dot, e.g., `{{ .meta }}`.

Defaults to `"meta"`

##### [`out`](https://www.krakend.io/docs/enterprise/configuration/flexible-config/#out "Click to copy link to out") string

It specifies a filename where the result of compiling the templates is stored. The directory and the filename you use must be writeable by the KrakenD process. It has no other purpose than debugging the resulting template.

Defaults to `""`

##### [`partials`](https://www.krakend.io/docs/enterprise/configuration/flexible-config/#partials "Click to copy link to partials") object

When needed, the partials are treated as raw text files, and they are inserted in the placeholder ‘as is’, and no template evaluation of its content is performed.

##### [`paths`](#partials-paths "Click to copy link to paths") array of strings

The [relative](https://www.krakend.io/docs/enterprise/configuration/working-directory/) or absolute paths to the partials directories, each entry is a different path. Contents are scanned **recursively**.

Example: `["partials"]`

Defaults to `[]`

##### [`ref_key`](https://www.krakend.io/docs/enterprise/configuration/flexible-config/#ref_key "Click to copy link to ref_key") string

Instead of using the keyword `$ref` to replace configuration blocks, use another keyword. This is useful when you want to use OpenAPI’s `$ref` and Flexible Config’s `$ref` together and avoid crossed behavior.

Example: `"$replace"`

Defaults to `"$ref"`

##### [`settings`](https://www.krakend.io/docs/enterprise/configuration/flexible-config/#settings "Click to copy link to settings") object

Settings are files expressed in JSON, YAML, ENV, TOML, INI or properties (Java) formats that are parsed and available as a tree like `.filename` inside the templates.

Example: `{"paths":["settings/production","settings/common"]}`

##### [`allow_overwrite`](#settings-allow_overwrite "Click to copy link to allow_overwrite") boolean

When the settings tree is converted to a traversable variable, whether to accept that another path that resolves to the same tree path can override a previous one or not.

Defaults to `false`

##### [`allowed_suffixes`](#settings-allowed_suffixes "Click to copy link to allowed_suffixes") array of strings

The list of file suffixes you want the parser to take into account. Non-matching files are ignored and unavailable in the templates.

Example: `[".yaml",".json","krakend.env"]`

Defaults to `[".yaml",".yml",".json",".toml",".tml",".ini",".dotenv",".env",".properties",".prop",".props"]`

##### [`dir_field_prefix`](#settings-dir_field_prefix "Click to copy link to dir_field_prefix") string

When converting the settings tree into a traversable variable, add a prefix to directory names.

Example: `"dir_"`

Defaults to `""`

##### [`paths`](#settings-paths "Click to copy link to paths") array of strings

The [relative](https://www.krakend.io/docs/enterprise/configuration/working-directory/) or absolute paths to the settings directories, each entry is a different path. Contents are scanned **recursively**.

Example: `["settings"]`

Defaults to `[]`

##### [`templates`](https://www.krakend.io/docs/enterprise/configuration/flexible-config/#templates "Click to copy link to templates") object

The location of the Go templates you want to use to express your configuration.

Example: `{"paths":["templates"]}`

##### [`paths`](#templates-paths "Click to copy link to paths") array of strings

The [relative](https://www.krakend.io/docs/enterprise/configuration/working-directory/) or absolute paths to the templates directories, each entry is a different path. You might have multiple directories when you have templates shared across environments or projects, and then you have dedicated templates for the running environment. Defaults to not use any templates directory. Contents are scanned **recursively**.

Example: `["templates"]`

Defaults to `[]`

##### [`undefined_vars`](#templates-undefined_vars "Click to copy link to undefined_vars")

How to treat access to unexisting variables in the templates. When the value is `error` the template will fail to compile, when `zero` it will set a zero-value (e.g, empty string), and when the value is `invalid` it will replace the content with the string `<no value>`.

Possible values are: `"error"` , `"zero"` , `"invalid"`

Defaults to `"error"`

Schema: [https://www.krakend.io/schema/v3.0/flexible\_config.json](https://www.krakend.io/schema/v3.0/flexible_config.json "JSON schema definition")

### Settings

The settings directories store files expressed in many formats such as `.json`, `.yaml`, `.env`, `.yml`, `.toml`, `.ini`, `.prop`, `.properties`, or `.props`.

You can set multiple `paths` which define the list of all data sources available. They can be absolute directories (e.g.: `/etc/krakend/settings`), relative to the [working directory](https://www.krakend.io/docs/enterprise/configuration/working-directory/) (e.g., `./settings`) or individual files (e.g.,: `./override.yaml`).

**Directories are loaded recursively**, and the settings variables will contain all its nesting levels. For instance, if you have a group of settings shared across all environments, another group for production only settings, and finally a manual override of specific values, you could have a configuration like this:

```json
{
    "settings": {
        "paths": [
            "./settings/common",
            "./settings/production",
            "override.yaml"
        ]
    }
}
```

When all directories and files are parsed, you can access them in the templates using the dot notation `.`. It means that if you, for instance, have a file under `./settings/production/a/b/c/file.json` and you defined the `paths` as above, you can access its contents in the templates as `{{ .a.b.c.file }}` (notice the starting dot). All contents under the `paths` you defined are placed at the root level of the settings tree.

The engine will load **recursively** and, **in the order defined**, all files and subdirectories you have specified in the `paths`. Their content is merged if you have repeated file names with different extensions (e.g.: `file.yaml` and `file.json`).

**Settings option `allow_overwrite`** With the example above, you could have that the production folder overwrites some settings that were already defined in the common folder. If there are conflicts like this when converting directories and file contents into the settings tree (they use the same name path), the `allow_overwrite` flag lets you define what you want to do. When overwrite is allowed, the last parsed file replaces any conflicting variables in the tree so that the production differences will replace any existing settings in common, at the attribute level, not the file level.

There might also be directory names that clash with file names or keys inside the data structures. For instance, you have `./settings/foo.json` and `./settings/foo/common.json`. This would resolve to `{{ .foo }}` and `{{ .foo.common }}`. The last one could replace a key `common` if it exists in `foo.json`.

A practical example for `allow_overwrite` could be having these two files:

```yaml
# common/connection.yaml
host: localhost
port: 1234
```

And

```yaml
# production/connection.yaml
host: myserver.com
```

With an order as specified in the example above, the final `{{ .connection }}` variable would have `myserver.com` as host and `1234` as port: The result of merging the two files and overriding the differences.

**Settings option `dir_field_prefix`**

You have the opportunity to rename the paths of directories with a prefix. For instance, if you use `"dir_field_prefix": "dir_"`, then the same scenario would resolve to `{{ .foo }}` and `{{ .dir_foo.common }}` which gives no room to conflict.

**Settings option `allowed_suffixes`**

And finally, you can have more files in the settings directories than the flexible configuration needs to load for whatever reason. To filter which extensions or ending paths you want to load, you can use the `allowed_suffixes` list. For instance:

```json
{
    "settings": {
    "allowed_suffixes": [
            ".yaml",
            ".prod.json"
        ]
    }
}
```

The example above would only load YAML files or JSON ones that end in `.prod.json`.

### Partials

The partials are treated as **raw text files**, and they are inserted in the placeholder **“as is”**, and no template evaluation of its content is performed.

```json
{
    "partials": {
        "paths": [
            "./partials"
        ]
    }
}
```

### Templates

When you start KrakenD, the configuration file passed with the `-c` flag is treated as the **base template**, and from the base you can load other sub-templates.

You must add a `paths` entry inside the `templates` setting. It is also a list that defines multiple directories or individual template files. For instance:

```json
{
    "templates": {
        "paths": [
            "templates",
            "some_file.tmpl"
        ]
    }
}
```

In the example above, we pass a `templates` folder and an individual template file `some_file.tmpl`.

All `paths` are traversed recursively, meaning that all insider templates are also available if there are subfolders. The relative path is removed from the template name when there are subdirectories.

For instance, a directory structure like `dir1/dir2/file.tmpl` lets you load the template as `{{ template "file.tmpl" }}`, and as you can see, there is no `dir1` or `dir2` when you reference it.

When there are conflicts (you have the same filename in different folders), you will see a warning in the logs, and the engine will rename the template to `{{ template "dir2_file.tmpl"}}`, using the last directory name as a prefix. If there was also a conflict, you would have `{{ template "dir1_dir2_file.tmpl"}}`, and so on. But unless there are conflicts, the template base name is all you need.

To start working with templates, read [Flexible Configuration Templates](https://www.krakend.io/docs/enterprise/configuration/templates/)

### Out file

Our final attribute of the behavior file is the `out`. It specifies a filename where the result of compiling the templates is stored. The directory and the filename you use must be writeable by the KrakenD process. It let’s you see the resulting file after rendering all the templates. It has no other purpose than debugging the resulting template.

For instance:

```json
{
    "out": "result.json"
}
```

### Metadata tree

All templates have a variable `{{ .meta }}` (or whatever you choose under `meta_key`) that contains metadata of the processed files and the `flexible_config.json` configuration file. It has a structure like this:

```json
{
    "flexible_config": {
      "meta_key": "meta",
      "settings": {
        "allow_overwrite": true,
        "allowed_suffixes": [".json",".yml"],
        "dir_field_prefix": "",
        "paths": null
      },
      "templates": {
        "partials": [],
        "paths": null,
        "undefined_vars": ""
      }
    },
    "settings": {
      "files": [
        "production/servers.json",
        "common/base.yml",
      ]
    },
    "templates": {
      "failed": [],
      "files": {}
    }
}
```

You can use this tree in your templates as best fits.

## `$ref`: Reference external files

One of the main differences between the Extended Flexible Configuration and the open source one is that you can reference other configuration files using a reference, **even if you don’t want to use Go templates**.

The `$ref` keyword will inject the content of the referenced file, allowing you to work with non-template files (but the templates are welcome, too!). It does not matter if you have the configuration in YAML, INI, or JSON. For instance, when you add a `$ref` keyword, the content of the referenced file will replace the `$ref` block (instead of `$ref` you can use another key if needed with `ref_key` in the settings file).

For instance, given that you have a `websockets.json` as follows:

```json
{
    "url_pattern": "/ws/{room}",
    "disable_host_sanitize": true,
    "host": [ "ws://chat:8888" ]
}
```

You can include it in the configuration as follows:

```json
{
  "endpoint": "/chat/{room}",
  "backend": [
    { "$ref": "./backends/websockets.json" }
  ]
}
```

And KrakenD resolves this to:

```json
{
  "endpoint": "/chat/{room}",
  "backend": [
    {
        "url_pattern": "/ws/{room}",
        "disable_host_sanitize": true,
        "host": [ "ws://chat:8888" ]
    }
  ]
}
```

In case you would like to use another key instead of `$ref`, you can set the setting `ref_key` to a different value. This might make sense when you combine OpenAPI generation with Extended Flexible Configuration, as both provide a meaning for this key.

In addition, you can also use **data pointers** (or anchors), so you can use `#/` to traverse a specific route inside the referenced file, and use additional `/` for nested objects. For instance:

```json
{
  "endpoint": "/chat/{room}",
  "backend": [
    {
        "url_pattern": "/ws/{room}",
        "disable_host_sanitize": true,
        "host": { "$ref": "./backends/websockets.json#/host" }
    }
  ]
}
```

In the example above, we import just one field `host` from the referenced file.

Using `$ref` compared to template syntax **is better for maintenance** because the complexity is much lower.

A final note on using `$ref` is that if you don’t want to use templates, partials, or settings, your `flexible_config.json` can be simplied. For instance, you can have just this, which just saves the resulting file after resolving all refs:

```json
{
    "out": "result.json"
}
```

## Testing the configuration

We recommend using a Docker compose file to work faster with flexible configuration.

Save the following `docker-compose.yml` and do a `docker compose up`. This setup with the [`:watch` image](https://www.krakend.io/docs/enterprise/developer/hot-reload/) will allow you to work locally with the latest version of KrakenD and apply the changes automatically whenever you change a source file.

```yml
version: "3"
services:
  krakend:
    image: krakend/krakend-ee:watch
    volumes:
      - "./:/etc/krakend/"
    command: ["run","-dc","krakend.tmpl"]
```

As the flexible configuration is composed of several pieces, it’s easy to make a mistake at some point. Test the syntax of all the files with the `krakend check` command and pay attention to the output to verify there aren’t any errors. When there are errors, the output contains information to help you resolve it, e.g.:

```
ERROR parsing the configuration file: loading flexible-config settings:
- backends.json: invalid character '}' looking for beginning of object key string
```

The setting `out` in the behavior file (`flexible_config.json` above) writes the content of the final file in a known path, so you can check its contents at any time.

If you don’t use `docker compose`, you can also use flexible configuration as follows:

Checking the configuration 

```
$FC_CONFIG=flexible_config.json \
FC_DEBUG=true \
krakend check -t -d -c "$PWD/krakend.tmpl"
```

## Multiple versions of the `flexible_config.json`

There are times when you have several environments where the flexible configuration file needs to differ, like loading the files from a different path. There are several ways to manage divergences of the behavioral file.

The most obvious solution is to manage different versions, like `flexible_config.prod.json` and `flexible_config.devel.json` and injecting the right one using the `FC_CONFIG=` environment variable when the program starts.

Another possibility could be having a template that contains environment variables. For instance, a file `flexible_config.template.json`:

```json
{
    "settings": {
        "paths": [
            "$PWD/settings/global",
            "$PWD/settings/$TARGET"
        ]
    }
}
```

Then, you can create the final `flexible_config.json` file during the build process using `envsubst`, which replaces the environment variables with their values. The file above assumes the existence of `$TARGET` and `$PWD` as environment variables.

Then, you can generate the final file as follows:

Environment variable substitution 

```
$envsubst < flexible_config.template.json > flexible_config.json
```

The command, which is generally available in Linux distributions, takes a template file as input and outputs the same file with the environment variables replaced. You have to be aware that missing variables are simply replaced by an empty string.

Note: on Alpine-based containers, like the KrakenD image, you need to do an `apk add envsubst` to use this command.
