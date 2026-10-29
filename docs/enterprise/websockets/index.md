# WebSockets Integration

> Learn how to integrate WebSockets with KrakenD API Gateway to enable real-time, bidirectional communication between clients and your APIs

Source: https://www.krakend.io/docs/enterprise/websockets/

KrakenD Enterprise supports communications using the WebSocket Protocol (RFC-6455) to enable two-way communication between a client and a backend host through the API gateway. This technology aims to provide a mechanism for applications that need two-way communication with servers that do not rely on opening multiple HTTP connections.

KrakenD can work with Websockets using two different strategies:

- Using [**multiplexing**](https://www.krakend.io/docs/enterprise/websockets/#multiplexing) (default and recommended)
- Using [**direct communication**](https://www.krakend.io/docs/enterprise/websockets/#direct-communication)

## Multiplexing

When using multiplexing (the default behavior), each end client (e.g., Desktop or mobile device) establishes a connection with the gateway, and KrakenD opens **a single channel with the backend host** to handle all its connected clients.

All the communication between the gateway and the backend utilizes a straightforward **message format** that wraps the content with additional information about the origin or destination of the message.

For instance, you might have 1000 concurrent users in a chat room (an endpoint `/chat`) with 1000 sockets opened against KrakenD, but KrakenD still communicates with your backend using one single channel. Each message your backend receives contains metainformation about the initiating user and other parameters.

The following diagram shows the different WebSockets channels opened:

![diagram of multiplexed websockets](https://www.krakend.io/images/documentation/diagrams/websockets-multiplexing.mmd.svg)

### Message format

The message format is the mechanism that the gateway uses to identify who and to whom. The format applies to the **bidirectional communication between KrakenD and the backend** (the clients do not use this format) and is a JSON object with the following fields:

- `body`: The content represented in **base64**.
- `session`: The session is a filter that determines the message’s sender or receiver.
- `url`: The affected KrakenD endpoint.

#### KrakenD to backend

When the client interacts with KrakenD, the gateway sends messages to the backend wrapped in an envelope with a structure like the following:

```json
{
    "url": "/chat/krakend",
    "session": {
        "uuid": "0b251b07-5611-49e5-b69f-cf2cb8d339d6",
        "Room":"krakend",
    },
    "body": "SGVsbG8gV29ybGQh"
}
```

The client typed *“Hello World!”*, but KrakenD delevers to the backend what you can see above, with the contextual metadata for your convenience, so the backend can determine who is doing the call and from which originating endpoint.

Essential observations are:

- The `body` is **base64** encoded.
- The `session` contains information about the client making the request. At least you will always receive an `uuid` randomly assigned by KrakenD to the client when a new session starts. The same `uuid` is kept for the whole session.
- If your endpoint contains placeholders (e.g., as in `/chat/{room}`), the placeholder parameters are available under `session`, but using the first letter uppercased. In this example, `Room` holds the value of `{room}`).

#### Backend to KrakenD

You might need to communicate back with the users connected to the gateway differently:

- Send a message to all your clients (**broadcast**)
- Send a message only to some users (**multicast**)
- Send a message only to one user (**unicast**)

You decide which clients get the message by writing the appropiate message. By default, when the backend sends to the gateway unrecognized messages (without format or with an unknown format) they are broadcasted to all connected clients.

A controlled response for multicast or unicast communication needs the poper format, using the same format that KrakenD sent to the backend.

**The response `body` is mandatory**, and additionally, you can add filters you want to pass. We are talking about broadcasting if you don’t give any filters. The filters are a combination of the `session` and the `url`.

If, for instance, you only want to communicate with a specific user, you would produce an answer like this one:

```json
{
    "session": { "uuid": "0b251b07-5611-49e5-b69f-cf2cb8d339d6"},
    "body": "SGVsbG8gV29ybGQh"
}
```

If you want to communicate with all users connected to an endpoint, then you could use:

```json
{
    "url": "/chat/krakend",
    "body": "SGVsbG8gV29ybGQh"
}
```

And a broadcast:

```json
{
    "body": "SGVsbG8gV29ybGQh"
}
```

Notice that when the JSON fields `url` or `session` exist, the `body` is sent to the specific subgroup instead of being broadcasted.

### Handshaking

Before you can start using the message format, the gateway makes sure your backend understands the subprotocol. To do that, the gateway sends an opening handshake layered over TCP with a very basic message. The handshake process is straightforward but necessary for KrakenD to determine if the backend server is alive.

Returning an ‘OK’ is mandatory

The WebSocket server must reply with an `OK` string. KrakenD requires this string to make sure you are aware that a multiplexed connection requires you to deal with an envelope from now on.

KrakenD opens a WebSocket connection against the backend server with a fixed JSON message `{"msg":"KrakenD WS proxy starting"}`, and expects to find the `OK` as response:

![Sequence of handshake](https://www.krakend.io/images/documentation/diagrams/websockets-format.seq.mmd.svg)

After the successful ping/pong, KrakenD is ready to start serving and communicating with WS.

## Direct communication

When you **disable multiplexing** by setting the flag `enable_direct_communication` to `true`, for each connected end client, KrakenD opens a connection to the backend server too. This option is less optimal and increases the load your backend and KrakenD will handle, as the management of all individual threads comes at a cost. It handles **WS binary** transparently.

![diagram of direct websockets](https://www.krakend.io/images/documentation/diagrams/websockets-direct.mmd.svg)

When you use direct communication, you lose features like sending one message to multiple clients, and the backend needs to handle broadcast and multicast messages by itself N-times.

Direct communication is less efficient than multiplexing

The direct communication brings little value at the gateway level, because for each connection from the client, the gateway needs to communicate using another channel with the backend. When using direct communication (as a simple proxy), more connections are handled internally and there is extra CPU, memory, and network use.

When you use direct communication, there are no handshake requirements with the backend neither a message format, and you can use `subprotocols` if needed (e.g., to connect to [Streamlit](https://streamlit.io/))

When the gateway fails to deliver the message from a client to the backend because the connection is unavailable, **kicks the user out.**

## Websockets configuration

The configuration to enable WebSockets is straightforward; the only requirement is to include the `websocket` namespace at the `endpoint` level, and that you declare at least one backend `host` using the `ws://` or `wss://` schemas.

For each `endpoint`, KrakenD will open a single connection against one of the `host`s. The hosts are **load balanced randomly** but the session once is established is kept permamently.

The flag `"disable_host_sanitize": true` is also necessary for the backend.

Here there is an example (multiplexing):

```json
{
    "endpoint": "/ws/{room}",
    "input_query_strings": ["*"],
    "backend": [
        {
            "url_pattern": "/ws",
            "disable_host_sanitize": true,
            "host": [
                "ws://localhost:8081",
                "ws://localhost:8082",
            ]
        }
    ],
    "extra_config": {
        "websocket": {
            "input_headers": [
                "Cookie",
                "Authorization"
            ],
            "connect_event": true,
            "disconnect_event": true,
            "read_buffer_size": 4096,
            "write_buffer_size": 4096,
            "message_buffer_size": 4096,
            "max_message_size": 3200000,
            "write_wait": "10s",
            "pong_wait": "60s",
            "ping_period": "54s",
            "max_retries": 0,
            "backoff_strategy": "exponential"
        }
    }
}
```

All the fields inside `websocket` are optional, allowing you to declare an empty object `"websocket": {}`. The additional options are:

##### Fields of Schema definition for Websockets

\* required fields

##### [`backoff_strategy`](https://www.krakend.io/docs/enterprise/websockets/#backoff_strategy "Click to copy link to backoff_strategy")

When the connection to your event source gets interrupted for whatever reason, KrakenD keeps trying to reconnect until it succeeds or until it reaches the max\_retries. The backoff strategy defines the delay in seconds in between consecutive failed retries. Defaults to ‘fallback’

Possible values are: `"linear"` , `"linear-jitter"` , `"exponential"` , `"exponential-jitter"` , `"fallback"`

Defaults to `"fallback"`

##### [`connect_event`](https://www.krakend.io/docs/enterprise/websockets/#connect_event "Click to copy link to connect_event") boolean

Whether to send notification events to the backend or not when a user establishes a new Websockets connection.

Defaults to `false`

##### [`disable_otel_metrics`](https://www.krakend.io/docs/enterprise/websockets/#disable_otel_metrics "Click to copy link to disable_otel_metrics") boolean

Disables the OpenTelemetry metrics for the websocket connections.

Defaults to `false`

##### [`disconnect_event`](https://www.krakend.io/docs/enterprise/websockets/#disconnect_event "Click to copy link to disconnect_event") boolean

Whether to send notification events to the backend or not when users disconnect from their Websockets connection.

Defaults to `false`

##### [`enable_direct_communication`](https://www.krakend.io/docs/enterprise/websockets/#enable_direct_communication "Click to copy link to enable_direct_communication") boolean

When the value is set to `true` the communication is set one to one, and disables multiplexing. One client to KrakenD opens one connection to the backend. This mode of operation is sub-optimal in comparison to multiplexing.

Defaults to `false`

##### [`input_headers`](https://www.krakend.io/docs/enterprise/websockets/#input_headers "Click to copy link to input_headers") array of strings

Defines which input headers are allowed to pass to the backend. You don’t need to declare the `input_headers` at the endpoint. Use `*` to pass all headers (not recommended, use explicit values instead). There are a few headers that won’t be propagated regardless of your configuration, which are: `Upgrade`, `Connection`, `Sec-Websocket-Extensions`, `Sec-Websocket-Version`, and `Sec-Websocket-Key`.

Examples: `["Authorization","User-Agent","Accept"]` , `["*"]`

Defaults to `[]`

##### [`max_message_size`](https://www.krakend.io/docs/enterprise/websockets/#max_message_size "Click to copy link to max_message_size") integer

Sets the maximum size of messages **in bytes** sent by or returned to the client. Messages larger than this value are discarded by KrakenD and the client disconnected.

Defaults to `512`

##### [`max_retries`](https://www.krakend.io/docs/enterprise/websockets/#max_retries "Click to copy link to max_retries") integer

The maximum number of times you will allow KrakenD to retry reconnecting to a broken websockets server. When the maximum retries are reached, the gateway gives up the connection for good. Minimum value is `1` retry, or use `<= 0` for unlimited retries.

Defaults to `0`

##### [`message_buffer_size`](https://www.krakend.io/docs/enterprise/websockets/#message_buffer_size "Click to copy link to message_buffer_size") integer

Sets the maximum number of messages **each end-user** can have in the buffer waiting to be processed. As this is a per-end-user setting, you must forecast how many consumers of KrakenD websockets you will have. The default value may be too high (memory consumption) if you expect thousands of clients consuming simultaneously.

Defaults to `256`

##### [`ping_period`](https://www.krakend.io/docs/enterprise/websockets/#ping_period "Click to copy link to ping_period")

Sets the time between pings checking the health of the system.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"54s"`

##### [`pong_wait`](https://www.krakend.io/docs/enterprise/websockets/#pong_wait "Click to copy link to pong_wait")

Sets the maximum time KrakenD will until the pong times out.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"60s"`

##### [`read_buffer_size`](https://www.krakend.io/docs/enterprise/websockets/#read_buffer_size "Click to copy link to read_buffer_size") integer

Connections buffer network input and output to reduce the number of system calls when reading messages. You can set the maximum buffer size for reading in bytes.

Defaults to `1024`

##### [`return_error_details`](https://www.krakend.io/docs/enterprise/websockets/#return_error_details "Click to copy link to return_error_details") boolean

Provides an error `{'error':'reason here'}` to the client when KrakenD was unable to send the message to the backend.

Defaults to `false`

##### [`subprotocols`](https://www.krakend.io/docs/enterprise/websockets/#subprotocols "Click to copy link to subprotocols") array of strings

The list of subprotocols that the client can use to connect to the websocket.

Example: `["streamlit"]`

Defaults to `[]`

##### [`timeout`](https://www.krakend.io/docs/enterprise/websockets/#timeout "Click to copy link to timeout")

Sets the read timeout for the backend. After a read has timed out, the websocket connection is terminated and KrakenD will try to reconnect according the `backoff_strategy`. Minimum accepted time is one minute. This flag only applies when you use ’ enable\_direct\_communication\`.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"5m"`

##### [`write_buffer_size`](https://www.krakend.io/docs/enterprise/websockets/#write_buffer_size "Click to copy link to write_buffer_size") integer

Connections buffer network input and output to reduce the number of system calls when writing messages. You can set the maximum buffer size for writing in bytes.

Defaults to `1024`

##### [`write_wait`](https://www.krakend.io/docs/enterprise/websockets/#write_wait "Click to copy link to write_wait")

Sets the maximum time KrakenD will wait until the write times out.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"10s"`

Schema: [https://www.krakend.io/schema/v3.0/websocket.json](https://www.krakend.io/schema/v3.0/websocket.json "JSON schema definition")

### Retries and backoff strategies

Generally speaking, end-users have the WebSockets server always available in KrakenD regardless of the WebSockets status in the backend server. KrakenD keeps buffering the messages sent by the users, and retrying automatically the connections until it succeeds or it has exhausted the `max_retries`.

The `backoff_strategy` setting defines how KrakenD keeps trying to reconnect to the backend until it succeeds or until it reaches the `max_retries`. The backoff strategy defines the delay in seconds in between consecutive failed retries, and defaults to `fallback`. These are the possible strategies you can set:

- `linear`: The delay time (`d`) grows linearly after each failed retry (`r`) using the formula `d = r`. E.g., 1st failure retries in 1s, 2nd failure in 2s, 3rd in 3s, and so on.
- `linear-jitter`: Similar to `linear` but adds or subtracts a random number: `d = r ± random`. The randomness prevents all agents connected to a mutual service from retrying simultaneously as all have a slightly different delay. The random number never exceeds `±r*0.33`
- `exponential`: Multiplicatively increase the time between retries using `d = 2^r`. E.g: `2s`, `4s`, `8s`, `16s`…
- `exponential-jitter`: Same as exponential, but adds or subtracts a random number up to 33% of the value using `d = 2^r ± random`. This is the **preferred strategy** when you want to protect the system you are consuming.
- **Fallback**: When the strategy is missing or none of the above (e.g.:`fallback`) then it will use **constant** backoff strategy `d=1`. Will retry after one second every time.

Independently on the strategy you choose, when you set the `max_retries` value, think that multiplexing and direct communication have different implications.

On a **multiplexing scenario**, KrakenD deals with a single connection with the backend. If this connection dies and all the retries exhausted, your WebSocket backend is gone and the KrakenD WebSocker service too (you would need to restart or redeploy when the WS). All attempts to connect to WebSockets will receive a `502 Bad Gateway` status error. An **unlimited retry strategy** *usually* makes sense on this scenario because you generally don’t want to restart KrakenD because the backend server went down for a long period.

On a **direct communication** strategy, if a client connects to KrakenD and the connection with the WS server goes down, you usually don’t want more than a few retries before kicking the user. In a scenario like this, you’ll want a small number of retires (but remember that `0` means infinite retries!)

### Understanding WebSockets logs

The nature of WebSocket connections is that they have kind of a “state” and use a lasting connection. Therefore, there are implications to be aware of when connectivity issues or downtimes arise.

Generally speaking, you can read the different levels of errors as:

- `WARNING`: There are connectivity issues with the backend
- `ERROR`: There are problems renegotiating the connection
- `CRITICAL`: The WebSocket connection is lost for good

#### WS Issues during startup

The most visible problem of all. If, for whatever reason, the WebSocket on the backend server is not available **during KrakenD startup**, KrakenD starts and keeps retrying the connection until it exhausts the number of configured retries. In such event, the console shows a `CRITICAL` message like this one:

```log
▶ CRITICAL [SERVICE: Websocket] websocket.Dial ws://localhost:8081/ws: dial tcp [::1]:8081: connect: connection refused
```

#### WS Issues during operation

If, on the other hand, the handshake succeeded, but at a given point in time, the backend server or the network connection with the WS dies, the affected endpoint becomes non-operational.

When the WS connection with the backend is lost you’ll see in the logs:

```log
KRAKEND WARNING: [SERVICE: Websocket][Client] Reading from the connection: websocket: close 1006 (abnormal closure): unexpected EOF
```

All clients connected to KrakenD during the downtime of your backend’s WebSocket keep their connection with KrakenD, even though KrakenD cannot pass any data from/to the backend server. This happens both in multiplexing and direct communication.

KrakenD will keep retrying broken connections as defined through `max_retries` and `backoff_strategy`, and when the `max_retries` are exhausted all clients receive one response for each message. While KrakenD is disconnected from the backend, the log will show `WARNING` messages when clients demand information from it, for instance:

```log
▶ KRAKEND WARNING: [SERVICE: Websocket][Client] Reading from the connection: EOF
```

Following the `backoff_strategy`, KrakenD will keep trying to fix this problem, but for each failed retry, KrakenD will show an `ERROR` in the log:

```log
▶ KRAKEND ERROR: [SERVICE: Websocket][Client] Unable to renew the connection: websocket.Dial ws://localhost:8888/ws: dial tcp 127.0.0.1:8888: connect: connection refused
```

While the connection with the backend is retrying, all writes remain in queue.

If you have set a limited number of `max_retries` (greater than `0`), when KrakenD has exhausted all the retries, KrakenD will stop trying, and KrakenD will forget the WebSocket connection. You can see this state with a `CRITICAL` in the logs.

```log
▶ KRAKEND CRITICAL: [SERVICE: Websocket][Client] Unable to reconnect to the backend: websocket.Dial ws://localhost:8888/ws: dial tcp 127.0.0.1:8888: connect: connection refused
```

In addition, all remaining queued messages will show an error after the critical, as well as new ones:

```log
▶ KRAKEND ERROR: [SERVICE: Websocket] Writing request: empty connection
```

The client will receive an error too:

```json
{"error":"empty connection"}
```

At this point, KrakenD stops trying, and you must restart the service. Of course, you can always set `max_retries` to `0` to keep trying indefinitely.

Another log you can see is:

```log
KRAKEND WARNING: [SERVICE: Websocket][Client] Reading from the connection: websocket: read limit exceeded
```

When you see the log above is because the client or the backend sent a message larger than permitted by the configuration. The offender will receive a `close 1009 (message too big)` followed by a disconnect.

#### Example of failing websocket with `max_retries=1`

The following is an example log of a websocket that failed and couldn’t reconnect on the single retry we allowed in the configuration (`max_retries=1`)

```log
▶ KRAKEND WARNING: [SERVICE: Websocket][Client] Reading from the connection: EOF
▶ KRAKEND ERROR: [SERVICE: Websocket][Client] Unable to renew the connection: websocket.Dial ws://localhost:8888/ws: dial tcp 127.0.0.1:8888: connect: connection refused
▶ KRAKEND CRITICAL: [SERVICE: Websocket][Client] Unable to reconnect to the backend: websocket.Dial ws://localhost:8888/ws: dial tcp 127.0.0.1:8888: connect: connection refused
▶ KRAKEND ERROR: [SERVICE: Websocket] Writing request: empty connection
```

## Integrating KrakenD with Socket.IO

[Socket.IO](https://socket.io/) is a popular library to use bidirectional communication. Although Socket.IO name might sound as a WebSockets implementation, the reality is that Socket.IO operates on a **custom protocol** layered over WebSockets that is incompatible with plain WebSockets clients using the [WebSockets API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications) (the one native in the JS standard lib). To connect to a Sockets.IO server you cannot use a WebSockets client, you must use a Sockets.IO client.

KrakenD uses a pure WebSocket Protocol (RFC-6455) to connect to servers, but the Socket.IO protocol requires specific signaling to establish and maintain connections. By default, it attempts to **use the same endpoint for both HTTP and WebSocket communication**, and the connection details passed on a query string (e.g., `?EIO=4&transport=websocket`). This design can cause confusion when integrating with KrakenD, which manages HTTP and WebSocket traffic separately. Make sure to use `websockets` only when passing through KrakenD.

Socket.IO also requires **dedicated connections for each client**. This approach is **incompatible with KrakenD’s multiplexing system**, which optimizes resource usage by sharing WebSocket connections among multiple clients, so you are limited to use **direct WebSockets only**. Needles to say that handling individual client connections, leads to a much higher resource consumption.

Integrating KrakenD with Socket.IO can open up powerful real-time communication features, but it comes with trade-offs. The need for dedicated per-client connections, the additional dependency footprint, and challenges in maintaining asynchronous logic and multi-threaded execution must be considered before committing to this setup.

In all, if used with KrakenD make sure to:

- Set as `url_pattern` the value `/socket.io/?EIO=4&transport=websocket`
- Make sure the client uses ONLY the `websocket` transport

In the examples repository you will find a running demo:

[Socket.IO demo](https://github.com/krakend/examples/tree/main/websockets/socket.io "Socket.IO demo")
