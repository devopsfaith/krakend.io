# Injecting Redis into KrakenD Plugins

> Use KrakenD's managed Redis connections in any plugin type to add a shared persistence layer without managing connection pools or clusters yourself.

Source: https://www.krakend.io/docs/enterprise/extending/injecting-redis-in-plugins/

**Redis injection** lets plugins access KrakenD’s managed Redis connections directly, without writing any connection management code. When your plugin’s custom business logic requires a shared persistence layer, such as counters, caching, or distributed state, you can use the connections KrakenD already manages instead of creating your own. KrakenD opens and closes connections as needed and exposes them to your plugin through selector functions at startup. The only requirement is that your plugin imports the same `github.com/redis/go-redis/v9` version that KrakenD uses internally.

## Prerequisites

The interaction with a Redis pool or cluster happens through the `github.com/redis/go-redis/v9` library. Add it as a dependency in your plugin:

Add the go-redis dependency to your plugin 

```
$cd plugin-folder
go get github.com/redis/go-redis/v9
```

 

Dependency version must match KrakenD’s

The `github.com/redis/go-redis/v9` version must match the version KrakenD uses. Run a [plugin dependency check](https://www.krakend.io/docs/enterprise/extending/check-plugin/) to detect compatibility issues before compiling.

## Implementing the RedisRegisterer Interface

During startup, KrakenD injects Redis client selectors into any plugin that implements the `RedisRegisterer` interface:

```go
type RedisRegisterer interface {
    RegisterRedisSelectors(func(string) *redis.Client, func(context.Context, string, string) *redis.Client)
}
```

The first argument is the pool selector and the second is the cluster selector. The simplest implementation saves both into plugin-level variables for use at request time:

```go
var (
    redisClientSelector        func(string) *redis.Client
    redisClusterClientSelector func(context.Context, string, string) *redis.Client
)

func (r registerer) RegisterRedisSelectors(cs func(string) *redis.Client, ccs func(context.Context, string, string) *redis.Client) {
    redisClientSelector = cs
    redisClusterClientSelector = ccs
    logger.Debug(fmt.Sprintf("[PLUGIN: %s] Redis selectors loaded", r))
}
```

## Redis Selectors

A selector is a helper function that looks up a registered Redis pool or cluster by name and returns it as a `*redis.Client`. Once `RegisterRedisSelectors` runs at startup, the selectors are available throughout your plugin.

For instance, given this [Redis connection pool configuration at the service level](https://www.krakend.io/docs/enterprise/service-settings/redis-connection-pools/):

```json
{
  "extra_config": {
    "redis": {
      "connection_pools": [
        {
          "name": "redis_at_eight",
          "address": "localhost:6379",
          "db": 8
        },
        {
          "name": "redis_at_seven",
          "address": "localhost:6379",
          "db": 7
        }
      ]
    }
  }
}
```

Retrieve a specific pool by passing its name to the selector:

```go
redisClient := redisClientSelector("redis_at_seven")
```

The same pattern applies to [Redis cluster configuration](https://www.krakend.io/docs/enterprise/service-settings/redis-connection-pools/#configuration-of-redis-clusters), using `redisClusterClientSelector` instead.

## Example: Using Redis in a Modifier Plugin

The following example shows a modifier plugin that increments a Redis counter on each response, keyed by the value of the `X-Id` response header:

```go
func (r registerer) response(
    extra map[string]interface{},
) func(interface{}) (interface{}, error) {
    // retrieve the client once, outside the request handler, to avoid per-request overhead.
    redisClient := redisClientSelector("redis_at_eight")
    if redisClient == nil {
        // handle the missing pool according to your business logic:
        // return an error to abort initialization, or log a warning and continue.
    }

    return func(input interface{}) (interface{}, error) {
        resp, ok := input.(ResponseWrapper)
        if !ok {
            return nil, unknownTypeErr
        }

        // increment a counter keyed by the X-Id response header value.
        redisClient.Incr(resp.Context(), "test:from-resp-modifier:"+resp.Headers()["X-Id"][0])

        return input, nil
    }
}

var (
    redisClientSelector        func(string) *redis.Client
    redisClusterClientSelector func(context.Context, string, string) *redis.Client
)

func (r registerer) RegisterRedisSelectors(cs func(string) *redis.Client, ccs func(context.Context, string, string) *redis.Client) {
    redisClientSelector = cs
    redisClusterClientSelector = ccs
    logger.Debug(fmt.Sprintf("[PLUGIN: %s] Redis selectors loaded", r))
}
```

The critical detail is retrieving the Redis client outside the inner handler function. Calling the selector inside the handler adds lookup overhead to every request.

## Example: Using Redis in a Middleware Plugin

The `examples` repository contains a full working stack that demonstrates Redis injection in a middleware plugin:

[View the middleware plugin example](https://github.com/krakend/examples/tree/main/11.plugins-and-redis "View the middleware plugin example")
