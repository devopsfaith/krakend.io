# Load Balancing and Throttling

> Explore load balancing and throttling strategies in KrakenD API Gateway to ensure optimal performance and resource utilization

Source: https://www.krakend.io/docs/throttling/load-balancing/

The natural placement of an API gateway is between API consumers and your services. When we talk about load balancing, we can refer to both sides of the gateway: **ingress traffic** (user to gateway) or **egress traffic** (gateway to services).

The different load balancer placements you can have are illustrated in the image above.

## Balancing ingress traffic (to KrakenD)

We recommend having a few containers or servers in production to have high availability. In addition, you should place an **external balancer** to serve as the single point of contact for clients to distribute incoming traffic to all KrakenD nodes.

![load-balancing-to-krakend.mmd diagram](https://www.krakend.io/images/documentation/diagrams/load-balancing-to-krakend.mmd.svg)

Cloud providers (and on-prem solutions) offer a variety of products for balancing, like Network balancers, Application balancers, CDN balancers, software balancers, etc. The choice will depend on your needs.

**KrakenD does not need any configuration** to receive ingress traffic.

## Balancing egress traffic (to upstream)

KrakenD connects to your services using the balancing strategy of your choice, be a **Round Robin** algorithm, a **weighted balancing** connection, or use an **external load balancer** or Kubernetes service instead.

The load balancer can work for internal and external services simultaneously, and it’s irrelevant to KrakenD the physical location or networking as long as it can reach the destination.

When writing the configuration, you are implicitly setting the **load balancing strategy** on a per-backend basis, depending on what you write in the `host` list and `sd` (service discovery) settings. It means that you can have an endpoint that connects to a set of balanced backends while you have another endpoint that relates to an externally-balanced service.

In essence, there are two relevant entries on `backend` you have to be aware of in terms of balancing:

##### Fields of `"backend"`

\* required fields

##### [`host`](https://www.krakend.io/docs/throttling/load-balancing/#host "Click to copy link to host") array of strings

An array with all the available hosts to [load balance](https://www.krakend.io/docs/throttling/load-balancing/#balancing-egress-traffic-to-upstream) requests, including the schema (when possible) `schema://host:port`. E.g.: `https://my.users-ms.com`. If you are in a platform where hosts or services are balanced (e.g., a K8S service), write a single entry in the array with the service name/balancer address. Defaults to the `host` declaration at the configuration’s root level, and the service fails starting when there is none.

##### [`sd`](https://www.krakend.io/docs/throttling/load-balancing/#sd "Click to copy link to sd")

The [Service Discovery](https://www.krakend.io/docs/backends/service-discovery/) system to resolve your backend services. Defaults to `static` (no external Service Discovery). Use `dns` to use DNS SRV records. Use `dns-shared` to share the DNS resolution between backends using the same hosts.

Possible values are: `"static"` , `"dns"` , `"dns-shared"`

Defaults to `"static"`

Schema: [https://www.krakend.io/schema/v3.0/backend.json](https://www.krakend.io/schema/v3.0/backend.json "JSON schema definition")

KrakenD’s egress load balancer acts at the [backend level](https://www.krakend.io/docs/backends/) and manages the connections to the backends from within the gateway.

### Delegated egress load balancing

When you don’t want the gateway to do any balancing for you because either:

- You have a single host
- The operative system is able to do it, or it’s consuming a DNS that does the balancing
- You are connecting to a Kubernetes service
- Your infrastructure provides a balancer to your services

![load-balancing-egress-delegated.mmd diagram](https://www.krakend.io/images/documentation/diagrams/load-balancing-egress-delegated.mmd.svg)

In these cases, you only need to add a single element in the `host` array with the desired service/networking address:

```json
    {
        "sd": "static",
        "host": ["http://service-or-load-balancer"]
    }
```

The `sd` entry uses its default value, which can be omitted in the configuration, but it’s shown above to demonstrate the relationship.

### Egress load balancer using Round Robin

When you want the gateway to do the balancing to connect to one or more servers inside or outside your network. The internal load balancer sends requests to the backends in a **Round Robin fashion**, and you should expect more or less an equivalent weight and number of hits on each backend in the list.

![load-balancing-egress-internal.mmd diagram](https://www.krakend.io/images/documentation/diagrams/load-balancing-egress-internal.mmd.svg)

```json
{
    "backend": [
        {
            "url_pattern": "/foo",
            "host": [
                "https://instance-01",
                "https://instance-02",
                "https://instance-03",
            ]
        }
    ]
}
```

To add more instances in the balancing pool, you only need to add them under the `host` list. With the configuration above, when looking at the overall traffic received by each server, you’ll see that each received around 33.33% of the requests. This is because the `host` list treats all the servers with equal weight.

The host list does not have any monitoring by KrakenD at this level and **it won’t remove entries from it** if the backend fails. To control failures in your backends, you should use the [Circuit Breaker](https://www.krakend.io/docs/backends/circuit-breaker/).

### Egress using poor man’s weighted load balancing

By repeating entries in the `host`, you can change the traffic distribution. Knowing that each item in the list receives an equal amount of traffic, the following example illustrates the *poor man’s weighted balancing*: 75% of the traffic to instance-02 and 25% to instance-01.

```json
{
  "url_pattern": "/foo",
  "host": [
    "https://instance-01",
    "https://instance-02",
    "https://instance-02",
    "https://instance-02"
  ]
}
```

### Egress using weighted load balancing (DNS SRV)

A more sophisticated way of doing **weighted load balancing** is to use an external service that dynamically sets the list of available hosts along with its weight using `DNS SRV` (see [Service Discovery](https://www.krakend.io/docs/backends/service-discovery/)).

To use it, add a configuration as follows:

```json
{
    "backend": [
        {
            "url_pattern": "/foo",
            "sd": "dns",
            "host": [
                "api-catalog.service.consul.srv"
            ],
            "disable_host_sanitize": true
        }
    ]
}
```

The `SRV` record provides the **hostname, port, priority, and weight** that KrakenD uses to balance. KrakenD reads these values **every 30 seconds** and generates an internal balancing list.

The balancing list honors the distribution described in the `SRV` records. Nevertheless, KrakenD will use only the records with the **lower priority**. So, for instance, if you have five servers with priority `0` and another with priority `2`, the latter won’t be included in the balancing.

As per the weights, KrakenD distributes the traffic in the proportion they represent. To be memory and space-efficient, KrakenD compacts and normalizes the final list of weights if needed. It’s essential to be aware that KrakenD will remove servers with a weight **orders of magnitude inferior** (under 1% of the total representation) from the final list as they are negligible.

Some examples on space optimization and removal of neglectable items:

- `SRV` passes the weights of 3 servers with values `[100 500 1000]`, and KrakenD builds a list `[1 5 10]`.
- `SRV` passes `[25 10000 1000]` and KrakenD compacts it as `[0 10 1]`. The server with a weight of `25` is removed as it is vastly inferior to the rest (0,2% weight).
- `SRV` passes `[25 1000 10000 65535]` becomes `[0 1 13 85]`. Again, `25` drops. The rest are converted to a lower value with the same distribution proportion.
