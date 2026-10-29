# KrakenD Enterprise Edition Documentation

> Explore the features and capabilities of the enterprise edition of KrakenD API Gateway, empowering you to manage APIs at an enterprise scale

Source: https://www.krakend.io/docs/enterprise/overview/

**KrakenD Enterprise is a high-performance API Gateway** built on top of our open-source API Gateway but adding extended Enterprise functionality. As it happens with the Community Edition, the KrakenD Enterprise engine is also fueled by the [Lura Project](https://luraproject.org) (a framework we have hosted at **The Linux Foundation** with the help of the community).

KrakenD Enterprise is unique because of its **stateless design** and **extreme simplicity**:

- Declarative configuration with GitOps practices.
- No node coordination needed when you have multiple instances running
- No synchronization with any persistence layer is needed.
- Zero complexity to operate and orchestrate.
- Presents no challenges for Multi-region deployments.
- Linear and constant scalability.
- Immutable infrastructure to reproduce the state of the gateway at any point in time.

The KrakenD Enterprise functionality allows you to:

- Transition from legacy applications to microservices
- Create API documentation for your consumers
- Publish APIs with centralized authentication and RBAC
- Export API activity to metrics, traces, and logs
- Audit changes of your API contract thanks to its GitOps approach
- Consistent rollback to previous states thanks to its immutable approach to versioning
- Succeed as a customer with our SLA and success engineers
- Secure and govern your internal and external systems
- Efficient development and better time to market
- Alleviate the pain of developing APIs and its shared concerns

## KrakenD Enterprise Features

KrakenD Enterprise offers over 30 additional features compared to the Community Edition.

A side-by-side comparison is shown in the [Open Source vs. Enterprise matrix](https://www.krakend.io/features/).

[Feature Matrix](https://www.krakend.io/features/ "Feature Matrix")

### API Gateway

The fastest API Gateway in the market, ready to run on premises, cloud, or hybrid. The gateway sits in front of your microservices to provide access control, security, throttling, analytics, and much more. KrakenD is not only a proxy but a Backend for Frontend that can aggregate and transform multiple calls simultaneously, avoiding network traffic and reducing bandwidth consumer to the end-user.

### Observability

[Logs](https://www.krakend.io/docs/enterprise/logging/), [metrics and traces](https://www.krakend.io/docs/enterprise/telemetry/), and [enhanced dashboards](https://www.krakend.io/docs/enterprise/telemetry/grafana/) are available to have complete control of what’s going on between the end-user and your microservices.

### Service connectivity

KrakenD offers REST endpoints and [WebSockets](https://www.krakend.io/docs/enterprise/websockets/) to the end-user that can aggregate content simultaneously from plenty of sources, like [gRPC services](https://www.krakend.io/docs/enterprise/backends/grpc/), [SOAP](https://www.krakend.io/docs/enterprise/backends/soap/), [REST APIs](https://www.krakend.io/docs/enterprise/backends/), [Kafka](https://www.krakend.io/docs/enterprise/backends/pubsub/#kafka), [RabbitMQ](https://www.krakend.io/docs/enterprise/backends/amqp-consumer/), [NATS](https://www.krakend.io/docs/enterprise/backends/pubsub/#nats), [Lambda functions](https://www.krakend.io/docs/enterprise/backends/lambda/), and a lot more.

### No lock-in

KrakenD Enterprise and KrakenD Community have a **compatible and exchangeable configuration**. If you come from the Community edition, you can inject the settings file to the Enterprise without further changes. And the other way around, if you are on Enterprise and want to downgrade to Community, the same configuration is valid. You will lose the enhanced Enterprise functionality as the community version ignores it, but the gateway will run anyway.

### Try KrakenD Enterprise

If you’d like to try KrakenD Enterprise at no charge or commitment, [get in touch](https://www.krakend.io/contact-sales/) so we can provide you a trial version.
