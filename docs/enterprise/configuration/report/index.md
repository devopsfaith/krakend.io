# Sharing Your KrakenD Configuration with Support

> The krakend report command packs your configuration, with its sensitive fields redacted, into a file you can share with the KrakenD support team.

Source: https://www.krakend.io/docs/enterprise/configuration/report/

The `krakend report` command generates a **support report**, a package file containing your configuration and the information the KrakenD support team needs to analyze it. Use it whenever you open a support case, instead of sending the configuration file by hand. Before packing the configuration, the command **redacts its sensitive fields** according to the sensitivity tier the KrakenD schema assigns them, so credentials and secrets never leave your environment unless you decide otherwise.

The command works offline by default: it uses the schema embedded in the binary, both to redact the configuration and to lint it as the [`check` command](https://www.krakend.io/docs/enterprise/configuration/check/) does.

Review what you share with the report

Redaction is on by default, but the default tier keeps fields such as filesystem paths and business logic in clear text. Choose the [redaction tier](https://www.krakend.io/docs/enterprise/configuration/report/#redaction-tiers) that matches your security requirements, and never use `--no-redact` unless the support team asks for it.

## Generating a Support Report

The `report` command has the following options:

Usage of KrakenD report 

````
$krakend report --help
╓▄█                          ▄▄▌                               ╓██████▄µ
▐███  ▄███╨▐███▄██H╗██████▄  ║██▌ ,▄███╨ ▄██████▄  ▓██▌█████▄  ███▀╙╙▀▀███╕
▐███▄███▀  ▐█████▀"╙▀▀"╙▀███ ║███▄███┘  ███▀""▀███ ████▀╙▀███H ███     ╙███
▐██████▌   ▐███⌐  ,▄████████M║██████▄  ║██████████M███▌   ███H ███     ,███
▐███╨▀███µ ▐███   ███▌  ,███M║███╙▀███  ███▄```▄▄` ███▌   ███H ███,,,╓▄███▀
▐███  ╙███▄▐███   ╙█████████M║██▌  ╙███▄`▀███████╨ ███▌   ███H █████████▀
                     ``                     `'`

Version: 3.0.2

Generates a report package file to share with the KrakenD support team.

Fields are redacted according to the sensitivity tier the schema assigns them,
from 1 (credentials, secrets and signing material) to 7 (filesystem paths,
scripts and business logic). Everything at the tier given with --tier or below
is replaced, so the default of 4 also covers TLS material, connection strings
and telemetry exporters. Use --no-redact to package the configuration as is.

When --schema is given, that schema drives both the redaction and the linting
performed by the check command. Otherwise the schema embedded in this binary is
used, and no network access is required.

Usage:
  krakend report [flags]

Examples:
krakend report -c krakend.json -o report.zip

Flags:
  -c, --config string   Path to the KrakenD configuration file. (default "./krakend.json")
  -h, --help            help for report
  -n, --no-redact       Do not redact the exported KrakenD configuration file sensitive fields.
  -o, --output string   Path to the output file for the report. (default "./report.zip")
  -p, --print           Do not write the report to a file. Instead, print it to stdout.
  -s, --schema string   Path to the KrakenD JSON schema. Used both to redact the configuration and to lint it.
  -t, --tier int        Redact every field at this sensitivity tier or lower (1 to 7). Ignored when --no-redact is set. (default 4)
````

The accepted flags are:

- `-c` or `--config` (*optional*): Path to the configuration file. When you omit it, KrakenD reads `./krakend.json`.
- `-o` or `--output` (*optional*): Path of the report file. When you omit it, KrakenD writes `./report.zip`.
- `-p` or `--print` (*optional*): Prints the report to stdout instead of writing it to a file. KrakenD ignores `--output` in this case.
- `-t` or `--tier` (*optional*): Highest sensitivity tier to redact, from `1` to `7`. Defaults to `4`. See [redaction tiers](https://www.krakend.io/docs/enterprise/configuration/report/#redaction-tiers) below.
- `-n` or `--no-redact` (*optional*): Packs the configuration without redacting any field. KrakenD ignores `--tier` when you set this flag.
- `-s` or `--schema` (*optional*): Path to a KrakenD JSON schema that replaces the embedded one, both for redaction and linting.

The simplest form of the command takes the configuration file and the destination of the report:

Generate a support report 

```
$krakend report -c krakend.json -o report.zip
```

The command reads `krakend.json`, redacts every field up to tier `4`, lints the configuration with the embedded schema, and writes the result to `report.zip`. Attach this file to your support case.

## Redaction Tiers

The KrakenD schema assigns every sensitive field a **sensitivity tier** from `1` to `7`. Lower tiers hold the most critical data, and higher tiers hold information that is less dangerous but still revealing. The `--tier` flag sets the highest tier to redact: KrakenD replaces the value of every field at that tier or below, and keeps the rest in clear text.

The following table lists what each tier covers:

| Tier | Category                                      | Redacted fields                                                                                                                                                                                                                                                                                                                                                                                                                              |
|------|-----------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `1`  | Credentials, secrets, and signing material    | Users and passwords of `auth/basic`, `auth/ntlm`, Kafka SASL, and Redis; keys, roles, and salt of `auth/api-keys`; client ID, secret, token URL, and scopes of `auth/client-credentials`; keys, JWK URLs, fingerprints, issuer, audience, roles, and scopes of `auth/signer` and `auth/validator`; the API key and ping URL of `auth/revoker`; AWS SigV4 and Google Cloud credentials; the `credentials` of every AI provider and classifier |
| `2`  | TLS and cryptographic configuration           | Private keys, public keys, CA certificates, cipher suites, minimum version, and mTLS settings of the server `tls`; certificates, private keys, CA certificates, cipher suites, and insecure connection flags of every `client_tls`; the HPKP public key of `security/http`                                                                                                                                                                   |
| `3`  | Connection strings of backends and messaging  | Proxy address of the HTTP client; Lambda endpoint and region; AMQP hosts, queue and exchange names, and routing keys; Kafka brokers, topics, client ID, and SASL mechanism and identities; PubSub topic and subscription URLs; Redis addresses, user names, databases, and client names; AI provider endpoints and classifier URLs                                                                                                           |
| `4`  | Telemetry exporters                           | New Relic license; GELF address; Moesif application ID, user identification, and masks; OpenTelemetry OTLP hosts and Prometheus listen IP; headers and names of `telemetry/opentelemetry-security` exporters                                                                                                                                                                                                                                 |
| `5`  | Identity providers and header conventions     | Origins of the JWK aggregator; header name, cookie key, and propagated claims of `auth/validator`; identifier and propagated role of `auth/api-keys`; shared cache duration of `auth/validator` at the service level                                                                                                                                                                                                                         |
| `6`  | Network exposure and internal topology        | Hosts of the service and every backend; trusted proxies and remote IP headers of the `router`; allowed hosts, proxy headers, and SSL host of `security/http`; CORS allowed origins; CIDRs, trusted proxies, and client IP headers of the IP filter; virtual hosts                                                                                                                                                                            |
| `7`  | Filesystem paths, scripts, and business logic | Backend `url_pattern`; GeoIP database path; static filesystem paths; GraphQL queries and query paths; SOAP and body generator templates and paths; Lua scripts and sources; Martian modifiers; security policies and CEL expressions; gRPC catalog; plugin folder; semantic cache model paths                                                                                                                                                |

The default value of `4` redacts every credential, all TLS material, connection strings, and telemetry exporters, and keeps the routing of your API visible: backend hosts, `url_pattern`, and identity provider settings stay in clear text. This default fits most support cases, because routing problems are the most frequent ones and the support team needs that information to reproduce them.

Raise the tier when your organization considers internal topology or business logic confidential. For example, to redact every classified field, including paths and business logic:

Redact all sensitivity tiers 

```
$krakend report -t 7 -c krakend.json -o report.zip
```

Lowering the tier sends more of your configuration in clear text, but it gives the support team more context to reproduce your problem. For instance, `-t 1` redacts only credentials, secrets, and signing material.

Credentials embedded in URLs

Backend hosts belong to tier `6` and `url_pattern` to tier `7`, so the default tier keeps them in clear text. If you write credentials inside these fields, such as `https://user:password@api.example.com` or an API key in a query string, use `--tier 7` to redact them.

### Sending the Configuration Without Redaction

When the support team needs the exact values of your configuration, pass the `--no-redact` flag:

Generate a report without redaction 

```
$krakend report --no-redact -c krakend.json -o report.zip
```

Unredacted reports contain your secrets

With `--no-redact`, the report includes every credential, private key, and connection string in your configuration as is. Share it only through a secure channel.

## Using a Custom Schema

By default, the `report` command uses the schema embedded in the binary, so it does not need network access. Pass `--schema` with the path to a different KrakenD JSON schema when you want another definition to drive the redaction and the linting. For instance, when you extend the schema with the definitions of your own plugins:

Generate a report with a custom schema 

```
$krakend report -s ./schema/krakend.json -c krakend.json -o report.zip
```

KrakenD uses `./schema/krakend.json` both to decide which fields to redact and to lint the configuration.
