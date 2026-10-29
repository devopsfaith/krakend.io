# Mutual Authentication

> Implement mutual authentication in KrakenD API Gateway to establish a secure and trusted communication channel between clients and APIs

Source: https://www.krakend.io/docs/authorization/mutual-authentication/

**mTLS** is an authentication mechanism used traditionally in business-to-business (B2B) applications where clients provide a certificate that allows to connect to the KrakenD server.

As KrakenD is a piece of software in the middle of two parts, there are different types of mTLS supported, that can work together or separately.

![mtls.mmd diagram](https://www.krakend.io/images/documentation/diagrams/mtls.mmd.svg)

1. **Service mTLS**: When you require end-users to provide a certificate to connect to KrakenD.
2. **Client mTLS**: When you require KrakenD to provide a certificate to connect to your services.

In both cases, the certificates must be recognized by your system’s Certification Authority (CA) or be added under the `ca_certs` list.

## Service mTLS Configuration (End-user to gateway)

From the configuration file perspective, Mutual TLS Authentication is no more than a flag `enable_mtls` under the `tls` section.

When mTLS is enabled, **all KrakenD endpoints** require clients to provide a known client-side X.509 authentication certificate. KrakenD relies on the system’s CA to validate certificates.

To enable it you need a configuration like this:

```json
{
  "version": 4,
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "tls": {
    "enable_mtls": true,
    "ca_certs": [
      "rootCA.pem"
    ],
    "keys": [
     {
      "private_key": "/path/to/key.pem",
      "public_key": "/path/to/cert.pem"
     }
    ]
  }
}
```

And these are the options you can include under `tls`:

##### Fields of TLS/SSL

\* required fields

Minimum configuration needs **any of**: `keys` , or `null` object

##### [`ca_certs`](https://www.krakend.io/docs/authorization/mutual-authentication/#ca_certs "Click to copy link to ca_certs") array of strings

An array with all the CA certificates you would like to load to KrakenD **when using mTLS**, in addition to the certificates present in the system’s CA. Each certificate in the list is a relative or absolute path to the PEM file. If you have a format other than PEM, you must convert the certificate to PEM using a conversion tool. See also `disable_system_ca_pool` to avoid system’s CA.

Example: `["ca.pem"]`

Defaults to `[]`

##### [`cipher_suites`](https://www.krakend.io/docs/authorization/mutual-authentication/#cipher_suites "Click to copy link to cipher_suites") array of integers

The list of cipher suites as defined in the documentation.

Defaults to `[4865,4866,4867]`

##### [`curve_preferences`](https://www.krakend.io/docs/authorization/mutual-authentication/#curve_preferences "Click to copy link to curve_preferences") array

The list of all the identifiers for the curve preferences. Use `23` for CurveP256, `24` for CurveP384 or `25` for CurveP521.

Defaults to `[23,24,25]`

##### [`disable_system_ca_pool`](https://www.krakend.io/docs/authorization/mutual-authentication/#disable_system_ca_pool "Click to copy link to disable_system_ca_pool") boolean

Ignore any certificate in the system’s CA. The only certificates loaded will be the ones in the `ca_certs` list when true.

Defaults to `false`

##### [`disabled`](https://www.krakend.io/docs/authorization/mutual-authentication/#disabled "Click to copy link to disabled") boolean

A flag to disable TLS (useful while in development).

Defaults to `false`

##### [`enable_mtls`](https://www.krakend.io/docs/authorization/mutual-authentication/#enable_mtls "Click to copy link to enable_mtls") boolean

Whether to enable or not Mutual Authentication. When mTLS is enabled, **all KrakenD endpoints** require clients to provide a known client-side X.509 authentication certificate. KrakenD relies on the system’s CA to validate certificates.

Defaults to `false`

##### [`keys`](https://www.krakend.io/docs/authorization/mutual-authentication/#keys "Click to copy link to keys") array

An array with all the key pairs you want the TLS to work with. You can support multiple and unrelated domains in a single process.

Each item of keys accepts the following properties:

##### [`private_key`](#keys-private_key "Click to copy link to private_key") string

Absolute path to the private key, or relative to the current [working directory](https://www.krakend.io/docs/configuration/working-directory/).

Examples: `"/path/to/key.pem"` , `"./certs/key.pem"`

Defaults to `"./certs/key.pem"`

##### [`public_key`](#keys-public_key "Click to copy link to public_key") string

Absolute path to the public key, or relative to the current [working directory](https://www.krakend.io/docs/configuration/working-directory/).

Examples: `"/path/to/cert.pem"` , `"./certs/cert.pem"`

Defaults to `"./certs/cert.pem"`

##### [`max_version`](https://www.krakend.io/docs/authorization/mutual-authentication/#max_version "Click to copy link to max_version")

Maximum TLS version supported.

Possible values are: `"SSL3.0"` , `"TLS10"` , `"TLS11"` , `"TLS12"` , `"TLS13"`

Defaults to `"TLS13"`

##### [`min_version`](https://www.krakend.io/docs/authorization/mutual-authentication/#min_version "Click to copy link to min_version")

Minimum TLS version supported. When specifiying very old and insecure versions under TLS12 you must provide the `ciphers_list`.

Possible values are: `"SSL3.0"` , `"TLS10"` , `"TLS11"` , `"TLS12"` , `"TLS13"`

Defaults to `"TLS13"`

Schema: [https://www.krakend.io/schema/v3.0/tls.json](https://www.krakend.io/schema/v3.0/tls.json "JSON schema definition")

**Important**: Connections not having a recognized certificate in KrakenD’s system CA, will be rejected. For further documentation on TLS, see the [TLS documentation](https://www.krakend.io/docs/service-settings/tls/)

## Client mTLS Configuration (Gateway to service)

If you want that **all connections to backends** use mTLS, add the following configuration:

```json
{
    "version": 4,
    "client_tls": {
        "client_certs": [
            {
                "certificate": "cert.pem",
                "private_key": "cert.key"
            }
        ]
    }
}
```

##### Fields of `"client_tls"`

\* required fields

##### [`client_certs`](https://www.krakend.io/docs/authorization/mutual-authentication/#client_certs "Click to copy link to client_certs") array of objects

The list of all client certificates available when fetching data from the upstream service.

Each item of client\_certs accepts the following properties:

##### [`certificate`](#client_certs-certificate "Click to copy link to certificate") * string

The path to the certificate you will use for mTLS connections.

##### [`private_key`](#client_certs-private_key "Click to copy link to private_key") * string

The path to the private key you will use for mTLS connections.

Schema: [https://www.krakend.io/schema/v3.0/client\_tls.json](https://www.krakend.io/schema/v3.0/client_tls.json "JSON schema definition")

### Per-backend mTLS

If instead of enabling mTLS against all backends, you can enable mTLS in a specific backend only. This option is available only in the Enterprise Edition

An example configuration would be:

```json
{
  "endpoint": "/foo",
  "backend": [
    {
      "host": ["https://api-needing-mtls"],
      "url_pattern": "/foo",
      "extra_config": {
        "backend/http/client": {
          "client_tls": {
            "client_certs": [
              {
                "certificate": "cert.pem",
                "private_key": "cert.key"
              }
            ]
          }
        }
      }
    }
  ]
}
```

Configuration needed (Enterprise Edition only):

##### Fields of `"client_tls"`

\* required fields

##### [`client_certs`](https://www.krakend.io/docs/authorization/mutual-authentication/#client_certs "Click to copy link to client_certs") array of objects

The list of all client certificates available when fetching data from the upstream service.

Each item of client\_certs accepts the following properties:

##### [`certificate`](#client_certs-certificate "Click to copy link to certificate") * string

The path to the certificate you will use for mTLS connections.

##### [`private_key`](#client_certs-private_key "Click to copy link to private_key") * string

The path to the private key you will use for mTLS connections.

Schema: [https://www.krakend.io/schema/v3.0/client\_tls.json](https://www.krakend.io/schema/v3.0/client_tls.json "JSON schema definition")

This is the schema needed for client mTLS, but the [HTTP Client settings](https://www.krakend.io/docs/enterprise/backends/http-client/) have many other options not related to mTLS.

## mTLS example

To use mTLS you need to generate the client and server certificates. The following script example creates the needed files to enable mTLS. Notice that in the `CN` of the certificates we are adding `localhost` as we want to connect to KrakenD from and to localhost.

```sh
# Private key for the certificate authority
openssl genrsa -des3 -out rootCA.protected.key 2048
openssl rsa -in rootCA.protected.key -out rootCA.key
# Generate the CA
openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 1024 -out rootCA.pem -subj "/C=US/ST=California/L=Mountain View/O=Your Organization/OU=Your Unit/CN=example.com"
# Generate a key for the client certificate
openssl genrsa -out client.key 2048
# Generate the certificate request for the client
openssl req -new -key client.key -out client.csr -subj "/C=US/ST=California/L=Mountain View/O=Your Organization/OU=Your Unit/CN=localhost"
# Sign the certificate request for the client
openssl x509 -req -in client.csr -extensions client -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out client.crt -days 500 -sha256

# Generate a key for the server certificate
openssl genrsa -out server.key 2048
# Generate the certificate request for the server
openssl req -new -key server.key -out server.csr -subj "/C=US/ST=California/L=Mountain View/O=Your Organization/OU=Your Unit/CN=localhost"
# Sign the certificate request for the server
openssl x509 -req -in server.csr -extensions server -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out server.crt -days 500 -sha256
```

The KrakenD configuration needed is as follows (no endpoints used for this demo):

```json
{
  "version": 4,
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "port": 443,
  "tls": {
    "enable_mtls": true,
    "ca_certs": [
      "rootCA.pem"
    ],
    "keys": [
     {
      "private_key": "./server.key",
      "public_key": "./server.crt"
     },
    ],
    "disable_system_ca_pool": true
  }
}
```

At this moment KrakenD accepts only clients passing a valid certificate. Let’s connect to the `/__health` endpoint:

Connect using mTLS 

```
$curl \
  --cacert rootCA.pem \
  --key client.key \
  --cert client.crt \
  https://localhost/__health
{"agents":{},"now":"2022-11-07 11:43:53.444657401 +0000 UTC m=+25.777003978","status":"ok"}
```

If we don’t provide the valid certs we get an error instead:

Connect without valid certs 

```
$curl -k https://localhost/__health
curl: (56) OpenSSL SSL_read: error:14094412:SSL routines:ssl3_read_bytes:sslv3 alert bad certificate, errno 0
```
