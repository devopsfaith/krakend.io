# Hot Reload Feature

> Explore the hot reload feature in KrakenD API Gateway, allowing dynamic configuration updates without service interruption for enhanced agility on development

Source: https://www.krakend.io/docs/enterprise/developer/hot-reload/

The Docker tag `:watch` is a **development-phase image** that allows you to **restart KrakenD automatically after saving** or changing files inside the configuration folder, although **is not recommended for production workloads**. It works whether you use [flexible configuration](https://www.krakend.io/docs/configuration/flexible-config/) or a single file (`krakend.json` or any other [supported format](https://www.krakend.io/docs/configuration/supported-formats/)).

The watch is a regular KrakenD binary wrapped in a [reflex watcher](https://github.com/cespare/reflex). When it detects that any piece inside the configuration has changed, it restarts the service, applying the changes. This behavior is very convenient while developing as it allows you to test new changes without manually restarting KrakenD back and forth

## Watch usage

The container expects you to mount the configuration as a volume mapped to `/etc/krakend`. For instance:

Simple KrakenD watch 

```
$docker run --rm -v "$PWD:/etc/krakend" krakend/krakend-ee:watch
```

When you use [flexible configuration](https://www.krakend.io/docs/configuration/flexible-config/), you can pass the environment variables when starting the container. For instance:

Hot reload with Flexible Configuration 

```
$docker run --rm -it -v "$PWD:/etc/krakend" \
    -e "FC_CONFIG=/etc/krakend/flexible_config.json" \
    krakend/krakend-ee:watch run -c krakend.tmpl
```

You can also integrate inside your IDE a watch to continuously check the configuration with the `check` command instead of `run`.

## Risks of hot-reloading in production

As we said, in the introduction, this tag is for development. Because you might be tempted to use it in production, we don’t recommend it because:

- It kills the server without a graceful option. If a user consumes an endpoint, the connection will be interrupted immediately, no matter if it ended or not.
- You might break the configuration after a save and leave the server unable to restart.
- KrakenD runs through a watch binary wrapper, hurting it, and will:
  
  - Decrease the performance (10 to 30% less throughput)
  - Decrease the stability of the binary (you might have undesired panics and unexpected exits)

### Why KrakenD needs restarting?

- **Performance**: This is the #1 reason, and strong enough. **KrakenD focuses on performance**, and during startup, calculates routes and decision trees, and the configuration is never read again.
- **GitOps**: We believe an API contract must go under the version control system and, after that, be released (and through CI/CD if possible), but never altered at runtime by throwing curls or whatever (Stick to [POLA](https://en.wikipedia.org/wiki/Principle_of_least_astonishment)).
- **Consistency**: Imagine yourself distributing configuration updates in an ecosystem like the one KrakenD is offering: **independent, non-coordinated, multi-region, and stateless**. It would require you to develop complex strategies to ensure consistency that is far out of the scope of an API Gateway.
- **It happens in other servers, too**: You are used to this behavior from Varnish, Apache, Nginx, Mysql, or any other major service. All of them are reloaded when configuration changes and the Internet is still running. [Blue/green deployment](https://www.krakend.io/docs/deploying/#use-bluegreen-or-similar-deployment-strategy) and similar approaches were invented to ensure there is never downtime even if you change the service.
