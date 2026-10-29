# HTTP Logger Integration

> Integrate the HTTP logger backend into KrakenD API Gateway to log and analyze API requests and responses for troubleshooting and analysis

Source: https://www.krakend.io/docs/enterprise/backends/http-logger/

The HTTP logger is a response dumper that allows you to write the backend request and its response into a file, to help you debug your processes during development.

A development tool

Although it works, we discourage you from using this plugin in production for the following reasons:

1. **Performance**: The throughput of the filesystem is usually slower than the network. This plugin writes two files on the disk for each request (consuming your disk space and I/O).
2. **Privacy**: Your backend responses are saved as they are in a plain file. If you have sensitive data, you might breach your company policies.

## Response logging configuration

The response dumper is an HTTP-client plugin, and you need to load it in the `backend` section. Notice the different elements you need to include in the configuration:

```json
{
  "version": 4,
  "extra_config": {
    "plugin": {
      "pattern": ".so",
      "folder": "/opt/krakend/plugins/"
    }
  },
  "endpoints": [
    {
      "endpoint": "/health",
      "output_encoding": "no-op",
      "backend": [
        {
          "url_pattern": "/__health",
          "host": ["http://localhost:8080"],
          "encoding": "no-op",
          "extra_config": {
            "plugin/http-client": {
              "name": "http-logger",
              "config": {
                "path": "./dumps",
                "file_prefix": "health"
              }
            }
          }
        }
      ]
    }
  ]
}
```

The configuration flags relative to the plugin, inside its `config`, are:

- `path` (*string*): The folder where to dump the responses. The **folder destination must exist and be writeable** by the `krakend` user (or any other user you have chosen to start the process). Otherwise, the plugin will fail to save the dumps. So in the example above, a `mkdir -p dumps` is needed to make the plugin work correctly.
- `file_prefix` (*string*): As all files will use in the name the timestamp to avoid concurrency problems, you can add a prefix to identify which backend wrote that response.

### Dump file format

For each request to KrakenD, two files are written in the directory with the following naming convention:

- `${file_prefix}_request_${timestamp}.txt`
- `${file_prefix}_response_${timestamp}.txt`

Each file contains the request and the response respectively using the **HTTP format**, as if you did a `curl -i` which contains the headers and the body. So for the example above, you would have:

Request to your backend (e.g: `health_request_1649753368.txt`)

```http
GET /__health HTTP/1.1
Host: localhost:8082
User-Agent: KrakenD Version 2.0.0
X-Forwarded-For: 127.0.0.1
X-Forwarded-Host: localhost:8082
Accept-Encoding: gzip
```

Response from your backend (e.g: `health_response_1649753368.txt`):

```http
HTTP/1.1 200 OK
Content-Length: 92
Content-Type: application/json; charset=utf-8
Date: Tue, 12 Apr 2022 08:49:28 GMT

{"agents":{},"now":"2022-04-12 10:49:28.90471549 +0200 CEST m=+428.707781074","status":"ok"}
```
