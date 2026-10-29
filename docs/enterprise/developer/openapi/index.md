# Import and Export OpenAPI definitions

> Integrate OpenAPI specifications with KrakenD API Gateway to streamline API documentation, validation, and management in enterprise environments

Source: https://www.krakend.io/docs/enterprise/developer/openapi/

The OpenAPI integration is a series of commands embedded in the KrakenD binary and additional metadata you can add in the configuration to enrich the documentation.

KrakenD offers OpenAPI import and export capabilities for OAS3 and Swagger v2 (`--legacy` mode), so you can autogenerate documentation or create a gateway configuration from one or multiple OpenAPI specs.

The `openapi` command supports the following functionalities:

- `openapi export`: Creates OpenAPI documentation by reading the KrakenD configuration.
- `openapi import`: Creates a KrakenD configuration from OpenAPI specification files.
- `openapi serve`: Starts a KrakenD server and an **OpenAPI UI** by reading the specification of an OpenAPI document (import+run).

## Exporting to OpenAPI

To **generate OpenAPI documentation**, the command needed is `krakend openapi export`. These are the different supported options:

Generating the documentation 

````
$krakend openapi export -h
╓▄█                          ▄▄▌                               ╓██████▄µ
▐███  ▄███╨▐███▄██H╗██████▄  ║██▌ ,▄███╨ ▄██████▄  ▓██▌█████▄  ███▀╙╙▀▀███╕
▐███▄███▀  ▐█████▀"╙▀▀"╙▀███ ║███▄███┘  ███▀""▀███ ████▀╙▀███H ███     ╙███
▐██████▌   ▐███⌐  ,▄████████M║██████▄  ║██████████M███▌   ███H ███     ,███
▐███╨▀███µ ▐███   ███▌  ,███M║███╙▀███  ███▄```▄▄` ███▌   ███H ███,,,╓▄███▀
▐███  ╙███▄▐███   ╙█████████M║██▌  ╙███▄`▀███████╨ ███▌   ███H █████████▀
                     ``                     `'`

Version: 3.0.2

Generates the OpenAPI descriptor for the gateway based on the configuration file.

Usage:
  krakend openapi export [flags]

Examples:
krakend openapi export --audience audience --config config.json --out openapi.json

Flags:
  -a, --audience string   Filter out endpoints not matching the given 'audience'.
  -c, --config string     Path to a KrakenD configuration file.
  -h, --help              help for export
  -L, --legacy            Use old Swagger v2
  -o, --out string        Path to the generated result. (default "out.json")
  -j, --skip-jsonschema   Skips including json-schema from the KrakenD component
````

The critical flags are `--config`, pointing to your `krakend.json` file, and `--out` as the final output OpenAPI file in JSON format. If you use [Flexible Configuration](https://www.krakend.io/docs/enterprise/configuration/flexible-config/), you need to pass as `--config` the file delivered by `FC_OUT`.

After executing the command, KrakenD will generate a basic version of the OpenAPI specification containing all the declared endpoints in the gateway. To enrich the OpenAPI output, you can [add OpenAPI information to your endpoints](https://www.krakend.io/docs/enterprise/endpoints/openapi/) with additional metadata. The metadata allows you to write user-friendly documentation in the configuration that will be rendered on the final OpenAPI document.

### Filtering which endpoints are documented

Sometimes you don’t want to document all the existing endpoints in the gateway, but only a subset. Using the `--audience` flag, you can filter which endpoints appear in the documentation during the generation. This flag selects the audiences [as defined in each endpoint](https://www.krakend.io/docs/enterprise/endpoints/openapi/).

You can define multiple audiences and execute the command several times, allowing you to share different specifications. For instance, why would you document specific endpoints intended for internal usage only to final customers?

### Adding OpenAPI documentation in the CI/CD process

You can add the OpenAPI generation command to your existing build pipeline. You can save the OpenAPI output somewhere else or keep it inside KrakenD to serve it statically.

If you want to serve the OpenAPI file from KrakenD, use the [Static Filesystem](https://www.krakend.io/docs/enterprise/endpoints/serve-static-content/) component. For instance, the following line would generate the OpenAPI file:

Generate OpenAPI during the build 

```
$mkdir -p openapi && krakend openapi export -c krakend.json -o openapi/openapi.json
```

And then you could add in the configuration the option to serve it as `http://krakend/oas3/openapi.json`:

```json
{
  "version": 4,
  "extra_config": {
    "server/static-filesystem": {
      "prefix": "/oas3/",
      "path": "/etc/krakend/openapi/"
    }
  }
}
```

## Importing from OpenAPI

If what you want, on the other hand, is to generate the KrakenD configuration when you have one or more existing OpenAPI files, then the command you need to use is `krakend openapi import`:

Importing an OpenAPI file 

````
$krakend openapi import -h
╓▄█                          ▄▄▌                               ╓██████▄µ
▐███  ▄███╨▐███▄██H╗██████▄  ║██▌ ,▄███╨ ▄██████▄  ▓██▌█████▄  ███▀╙╙▀▀███╕
▐███▄███▀  ▐█████▀"╙▀▀"╙▀███ ║███▄███┘  ███▀""▀███ ████▀╙▀███H ███     ╙███
▐██████▌   ▐███⌐  ,▄████████M║██████▄  ║██████████M███▌   ███H ███     ,███
▐███╨▀███µ ▐███   ███▌  ,███M║███╙▀███  ███▄```▄▄` ███▌   ███H ███,,,╓▄███▀
▐███  ╙███▄▐███   ╙█████████M║██▌  ╙███▄`▀███████╨ ███▌   ███H █████████▀
                     ``                     `'`

Version: 3.0.2

Generates a KrakenD configuration from your OpenAPI specification.

Usage:
  krakend openapi import [flags]

Examples:
krakend openapi import --spec openapi.(json|yaml) --out krakend.json --mock false --lint true

Flags:
  -b, --base-config string      Path to a base KrakenD configuration file to extend with the OpenAPI specifications
  -h, --help                    help for import
  -L, --legacy                  Use old Swagger v2
  -l, --lint                    Lint the generated configuration.
  -M, --merge-strategy string   Sets how to resolve conflicts on endpoints that already exist in the base configuration: discard (base endpoint untouched) | replace (base endpoint lost) | update (adds info missing in the extra_config) | openapi (updates documentation/openapi only)
  -m, --mock                    Creates an API with autogenerated mocked responses.
  -o, --out string              Path to the generated result. (default "out.json")
  -s, --spec string             Path to an OpenAPI specification file.
  -d, --spec-dir string         Path to a directory where OpenAPI spec files are stored. (--legacy/-L not supported)
````

The `--spec` flag must point to a valid JSON or YAML file with the OpenAPI specification. For instance, you could generate a `krakend.json` from an existing `openapi.yaml` like this:

Simple import 

```
$krakend openapi import -s openapi.yaml -o krakend.json
```

If you have multiple OpenAPI files to import and merge into a final configuration, pass a directory containing OpenAPI specs in YAML or JSON formats. For instance:

Import multiple OpenAPI files from directory 

```
$krakend openapi import -d dir_with_openapis/ -o krakend.json
```

When you generate the configuration, KrakenD includes the following:

- All the endpoints declared in the files with `no-op` encoding (reverse proxy). Of course, it would be best to use another encoding to avoid coupling and use data manipulation options, but that decision is up to you and your needs.
- If the OpenAPI contains a JSON schema validation, the usage of the endpoints will enforce its schema as well using [json-schema request validation](https://www.krakend.io/docs/enterprise/endpoints/json-schema/).
- If there are examples and you generate them using `--mock`, the examples are included as a static response until you implement the final backend.
- All endpoints point to the host defined in the first OpenAPI directory (alphabetically) or an empty host if not defined, except for mocked data that KrakenD points to itself.
- Security schemas (basic auth, API keys) are defined with a template for you to fill with your identity server or credentials information

In addition, except if you use Swagger v2 format with the flag `--legacy`:

- Required query strings and required headers are added to the endpoint
- JWT in the security schemas

### The base configuration

When using the `-b` or `--base-config`, whether you are doing one import or loading a whole directory of OpenAPI specs, the file passed in this flag is used as the base configuration for the final configuration file.

You can set here any global settings like telemetry, logging, the listening `port`, the configuration `name`, the default `host`, or a few endpoints in addition to the imported specs. The base configuration should also include any component schemas referenced during file import.

Both the base configuration and the imported OpenAPI files merge in the final render.

Import multiple OpenAPI files 

```
$krakend openapi import -d dir_with_openapis/ -o krakend.json -b base_krakend.json
```

The `base_krakend.json` file could look like this:

```json
{
  "version": 4,
  "name": "Master configuration",
  "extra_config": {
    "telemetry/logging": {
      "level": "DEBUG",
      "prefix": "[KRAKEND]",
      "stdout": true,
      "syslog": false
    },
    "endpoints": [
      {
        "endpoint": "/health",
        "backend": [
          {
            "url_pattern": "/infra/health"
          }
        ]
      }
    ]
  }
}
```

### Options to resolve conflicts on merged files

But what happens with conflicts? You may have a base configuration that defines endpoints that are defined in the same file(s) you are importing. A conflicting endpoint occurs when the combination of endpoint and method is identical in both the base and imported file.

The flag `--merge-strategy` (`-M` for short) allows you to specify how to resolve conflicts of endpoints that collide. These are the options and behaviors:

- `--merge-strategy update` (default): Leaves the endpoint as found in the base configuration but updates the information missing in the `extra_config` of the endpoint.
- `--merge-strategy discard`: Discards the endpoint imported, leaving the base endpoint untouched.
- `--merge-strategy replace`: Replaces the endpoint entirely with the content found in the imported file
- `--merge-strategy openapi`: Leaves the endpoint as found in the base configuration, but replaces the content of the `documentation/openapi` namespace. This is useful **when the source of truth of the OpenAPI specification is in the imported file**.

### x-krakend metadata

In addition to the base configuration file, you can add KrakenD metadata to your OpenAPI files, which is used to generate the configuration.

The OpenAPI spec is designed to document APIs as a consumer, but if you want to configure a gateway from an OpenAPI, you will need a lot more information that is irrelevant to the OpenAPI spec (the consumer). For instance, let’s say that you want to add a service rate limit to KrakenD every time you import from an OpenAPI file, or that you need to change the upstream service for a specific consumer path. In cases like this, the consumer still needs to use the same host, but the gateway won’t!

In scenarios like this, you can add `x-krakend-` (**in lowercase**) plus the KrakenD configuration attributes you want to set. For instance, the following OpenAPI specification adds an `input_headers` and the full `backend` definition to the path `/pets`:

```json
{
  "paths": {
    "/pets": {
      "get": {
        "x-krakend-input_headers": [ "Authorization" ],
        "x-krakend-backend": [
          {
            "method": "POST",
            "url_pattern": "/shop/pet"
          }
        ],
        "summary": "List all pets",
        "operationId": "listPets"
      }
    }
  }
}
```

The metadata attributes are accepted for service-level attributes and endpoints.

Notice that you only set the `x-krakend-` key for the attribute you want to define, and anything nested after that level does not need the `x-krakend-` prefix.

You can combine the usage of this metadata with a base configuration and the `x-krakend` metadata. Be aware that if you define the same keys, the metadata overwrites any existing keys in the base configuration.

### Multiple OpenAPI file import and merging

Suppose several teams generate their OpenAPI specs, and you want to merge all contracts in a single endpoints array. Then, when passing multiple OpenAPI specs during the import, KrakenD merges all the endpoints from the included specifications at once.

If there are **repeated endpoints** in different files, KrakenD will load them all in the final configuration, and you will need to manually resolve the conflict.

Import multiple OpenAPI files 

```
$krakend openapi import -d dir_with_openapis/ -o krakend.json
```

### Mock data

Suppose your backend services still need to be created or are not ready. In that case, you can import the OpenAPI configuration to KrakenD and let KrakenD respond with mock data so that you can reply to HTTP calls immediately.

To create the mock data, pass the `-m` or `--mock` flag:

Mock data 

```
$krakend openapi import -s ~/Downloads/openapi.yaml -o krakend.json -m
```

## Serve an OpenAPI spec

The `openapi serve` command receives the OpenAPI file you want to start as input and starts a KrakenD server with its defined endpoints. In addition, it also serves a [Swagger UI](https://github.com/swagger-api/swagger-ui) in an additional port (defaults to `15000`).

For instance, by executing the following:

Start a gateway and UI from the openapi 

```
$krakend openapi serve -s ~/Downloads/openapi.yaml -o krakend.json -m
```

You would have your API on port `localhost:8080` (unless the configuration changes it) and the UI on `localhost:15000`. The `-m` flag is helpful when your backend does not exist yet, and you want to return mocked data by KrakenD itself.

The `-o` flag will write the configuration file KrakenD has started in the disk, but it’s not required for the operation, only for you to see the final result.

You can change the host and the UI port by passing the appropriate flags. For instance:

Start the OpenAPI UI on port 18000 with Mock data 

```
$krakend openapi serve -s ~/Downloads/openapi.yaml -p 18000 -m
```

When using Docker, remember to expose the OpenAPI UI port if you want to have access from the outside.

**The UI is open to anyone with access to the machine**, and it needs OpenAPI version `3`.

## Migration from older versions

The commands `krakend generate openapi` and `krakend generate from openapi` used in previous versions keep working in v2.3 as they did in previous versions. Still, they will be removed in the future.

These commands are now replaced by `krakend openapi export` and `krakend openapi import`, which **default now to OpenAPI 3** instead of Swagger v2. The new commands also support Swagger, but you must add the `--legacy` flag.

These are the changes you need in the code.

### Migration from old export

**Diff for OpenAPI3 users**:

```diff
- krakend generate openapi -c krakend.json -o openapi.json --oas3
+ krakend openapi export -c krakend.json -o openapi.json
```

**Diff for Swagger v2 users**:

```diff
- krakend generate openapi -c krakend.json -o openapi.json
+ krakend openapi export -c krakend.json -o openapi.json --legacy
```

### Migration from old import

**Diff for OpenAPI3 users**:

```diff
- krakend generate from openapi -c openapi.json -o krakend.json --oas3
+ krakend openapi import -s openapi.json -o krakend.json
```

**Diff for Swagger v2 users**:

```diff
- krakend generate from openapi -c openapi.json -o krakend.json
+ krakend openapi import -s openapi.json -o krakend.json --legacy
```
