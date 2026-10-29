# KrakenD API Gateway Enterprise Playground

> Explore the KrakenD Playground, an interactive environment to test and experience KrakenD API Gateway features in real time

Source: https://www.krakend.io/docs/enterprise/overview/playground/

The [KrakenD Enterprise Playground](https://github.com/krakend/playground-enterprise) is a Docker Compose demonstration environment that puts together the necessary pieces to get you started with our API Gateway, using example use-cases.

As KrakenD is an API gateway, we have added surrounding services:

- Internal and third-party services that feed the gateway
- Authentication/authorization examples, including JWT token-based authentication with Auth0 integration, a JWT token revoker, API-Key-based authentication, and basic authentication.
- Static assets to test the by KrakenD Static Server based on disk content
- Integrations with Grafana+Influx (metrics), ELK (log storing and visualization), and Jaeger (tracing).

## An environment ready to use!

The KrakenD Enterprise Playground can be managed easily using customized `make` commands. Once up & running, you can fire up your browser, `curl`, Postman, httpie or anything else you use to interact with the services.

Start the stack included in docker compose 

```
$  make start
```

Follow the KrakenD logs after the complete stack is up & running 

```
$  make logs
```

Shut down the complete stack, removing all the volumes 

```
$  make stop
```

Have a look at the `docker-compose.yml` file to understand how these services interact together, and also at the `krakend.json` file to find out what endpoints are exposed.

If you’d like to see more examples, please let us know or open an [issue](https://github.com/krakend/playground-enterprise/issues)!
