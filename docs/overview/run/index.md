# Running KrakenD server

> All options of the krakend command to manage the service, write plugins, or get information about the installed version.

Source: https://www.krakend.io/docs/overview/run/

After installing KrakenD, you can start using KrakenD by typing `krakend`. To see all the options of `krakend`, type `krakend -h` or `krakend <COMMAND> -h`. For instance, the `krakend run` help is:

Run command help 

````
$krakend run -h

╓▄█                          ▄▄▌                               ╓██████▄µ
▐███  ▄███╨▐███▄██H╗██████▄  ║██▌ ,▄███╨ ▄██████▄  ▓██▌█████▄  ███▀╙╙▀▀███╕
▐███▄███▀  ▐█████▀"╙▀▀"╙▀███ ║███▄███┘  ███▀""▀███ ████▀╙▀███H ███     ╙███
▐██████▌   ▐███⌐  ,▄████████M║██████▄  ║██████████M███▌   ███H ███     ,███
▐███╨▀███µ ▐███   ███▌  ,███M║███╙▀███  ███▄```▄▄` ███▌   ███H ███,,,╓▄███▀
▐███  ╙███▄▐███   ╙█████████M║██▌  ╙███▄`▀███████╨ ███▌   ███H █████████▀
                     ``                     `'`

Version: 3.0.2

The API Gateway builder

Usage:
  krakend [command]

Available Commands:
  audit         Checks the integrity of the config and returns security recommendations.
  check         Validates that the configuration file is valid.
  help          Help about any command
  run           Run the KrakenD server.
  version       Shows KrakenD version.

Flags:
  -c, --config string   Path to the configuration filename
  -d, --debug           Enable the debug
  -h, --help            help for krakend

Use "krakend [command] --help" for more information about a command.
````

You can use the following commands:

- `krakend audit`: Use [krakend audit](https://www.krakend.io/docs/configuration/audit/) to get security recommendations for a given configuration.
- `krakend check`: Use [krakend check](https://www.krakend.io/docs/configuration/structure/) to make sure the configuration file you have generated is not broken and has the required attributes to start the gateway.
- `krakend check-plugin`: Use the [check-plugin](https://www.krakend.io/docs/enterprise/extending/check-plugin/) when you are developing custom plugins and you want to check that they are compatible with the server.
- `krakend run`: Use run to start the API gateway server.
- `krakend version`: Use the version command to print the current KrakenD version and the Glibc and Go versions used during compilation.

## Starting the gateway server

To start the server, invoke the `krakend run` command with a configuration file containing your API definition. You can visually create your first `krakend.json` file using the [KrakenDesigner](https://designer.krakend.io/) if you prefer a UI.

Or to get started right away, you can paste the following content inside a `krakend.json` file:

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

Command to start KrakenD with Docker 

```
$docker run -p "8080:8080" -v $PWD:/etc/krakend/ krakend:3.0.2 run -c krakend.json
```

Now KrakenD is listening on `8080`, and you can see it working under `http://localhost:8080/__health`.
