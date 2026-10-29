# Running KrakenD Enterprise: Available commands

> Get started with KrakenD Enterprise command, and learn all possible subcommands to run the software and perform checks in your CI/CD pipeline

Source: https://www.krakend.io/docs/enterprise/overview/run/

After installing KrakenD Enterprise, you can start using it by typing `krakend help`:

The krakend command 

````
$krakend

╓▄█                          ▄▄▌                               ╓██████▄µ
▐███  ▄███╨▐███▄██H╗██████▄  ║██▌ ,▄███╨ ▄██████▄  ▓██▌█████▄  ███▀╙╙▀▀███╕
▐███▄███▀  ▐█████▀"╙▀▀"╙▀███ ║███▄███┘  ███▀""▀███ ████▀╙▀███H ███     ╙███
▐██████▌   ▐███⌐  ,▄████████M║██████▄  ║██████████M███▌   ███H ███     ,███
▐███╨▀███µ ▐███   ███▌  ,███M║███╙▀███  ███▄```▄▄` ███▌   ███H ███,,,╓▄███▀
▐███  ╙███▄▐███   ╙█████████M║██▌  ╙███▄`▀███████╨ ███▌   ███H █████████▀
                     ``                     `'`

Version: 3.0.2-ee

KrakenD is a high-performance API gateway that helps you publish, secure, control, and monitor your services

Usage:
   krakend [command]

Available Commands:
  ai           Download ai models from Hugging Face to run locally. See subcommands
  audit        Audits a KrakenD configuration.
  check        Validates that the configuration file is valid.
  check-plugin DEPRECATED: Use the new plugin command. Checks your plugin dependencies are compatible.
  e2e          Executes an end to end test for the gateway based on the configuration file and a set of specs.
  generate     Generates static content for several functionalities. See subcommands.
  help         Help about any command
  license      Checks license status
  openapi      Import, export and serve OpenAPI specifications. See subcommands.
  plugin       Plugin operations. See subcommands.
  revoker      Starts a revocation service.
  run          Runs the KrakenD server.
  test-plugin  DEPRECATED: Use the new plugin command. Tests that one or more plugins are loadable into KrakenD.
  version      Shows KrakenD version.

Flags:
  -h, --help   help for krakend

Use "krakend [command] --help" for more information about a command.
````

To see all the options of a command type `krakend help <COMMAND>` or `krakend <COMMAND> -h`.

The commands are:

- `krakend ai`: Use `krakend ai` for ai related commands such as downloading models to be used by [ai semantic cache](https://www.krakend.io/docs/enterprise/ai-gateway/semantic-cache/)
- `krakend audit`: Use [krakend audit](https://www.krakend.io/docs/enterprise/configuration/audit/) to get security recommendations for a given configuration.
- `krakend check`: Use [krakend check](https://www.krakend.io/docs/enterprise/configuration/structure/) to make sure the configuration file you have generated is not broken and has the required attributes to start the gateway.
- `krakend plugin`: Different commands to [generate plugins](https://www.krakend.io/docs/enterprise/extending/generating-plugins/), [check their dependencies](https://www.krakend.io/docs/enterprise/extending/check-plugin/), and [test them](https://www.krakend.io/docs/enterprise/extending/test-plugin/)
- `krakend e2e`: Use the [end to end command](https://www.krakend.io/docs/enterprise/developer/integration-tests/) to run integration tests.
- `krakend generate`: Use the generate command to transform from and to different formats like [Postman](https://www.krakend.io/docs/enterprise/developer/postman/).
- `krakend license`: Use the [license command](https://www.krakend.io/docs/enterprise/overview/license-file/) to integrate license checks in your pipeline and avoid service disruptions
- `krakend openapi`: Use the openapi command to import and export [OpenAPI](https://www.krakend.io/docs/enterprise/developer/openapi/).
- `krakend revoker`: Use the revoker command to start the [Revoke Server](https://www.krakend.io/docs/enterprise/authentication/revoke-server/).
- `krakend run`: Use run to start the API gateway server.
- `krakend version`: Use the version command to print the current KrakenD version and the Glibc and Go versions used during compilation.

To start the server, invoke the `krakend run` command. The command will require a configuration file with your API definition. You can create your first `krakend.json` file using the [KrakenDesigner](https://designer.krakend.io/) if you prefer a UI.

Make sure KrakenD can find a `krakend.json` and a `LICENSE` file in the same place where it is executed (workdir).

To get started right away, you can paste the following content inside a `krakend.json` file:

```json
{
    "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
    "version": 4
}
```

And then you can start KrakenD:

Command to start KrakenD 

```
$krakend run -c krakend.json
```

Or if you use Docker:

Running KrakenD using the Docker container 

```
$docker run -p 8080:8080 -v "$PWD:/etc/krakend/" krakend/krakend-ee:3.0 run --config /etc/krakend/krakend.json
```

Now KrakenD is listening on `8080`, and you can see it working under `http://localhost:8080/__health`.
