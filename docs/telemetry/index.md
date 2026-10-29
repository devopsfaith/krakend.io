# Telemetry and Monitoring

> Learn about the telemetry and monitoring capabilities of KrakenD API Gateway, enabling real-time visibility and analysis of API performance

Source: https://www.krakend.io/docs/telemetry/

KrakenD’s **no-lock-in philosophy** underscores flexibility and interoperability, guaranteeing that technology-specific dependencies don’t constrain you. Giving you choices for observability and networking tools is key to success in a distributed microservices architecture.

Our [OpenTelemetry](https://www.krakend.io/docs/telemetry/opentelemetry/) integration provides:

- Ways to export data to detect root causes of problems.
- Monitoring and details of the different distributed transactions.
- Performance and latency optimization in the systems of your choice.
- The flexibility to use the monitoring system that you have chosen, and not one that you are locked into

**OpenTelemetry** is a unified, open-source framework for collecting and managing telemetry data over distributed systems, including traces and metrics. It offers vendor neutrality, simplifies instrumentation, and avoids lock-in with specific monitoring platforms. If you are fed up with a provider, you can simply push the metrics elsewhere by setting the new location in the [OTEL configuration](https://www.krakend.io/docs/telemetry/opentelemetry/).

## OpenTelemetry integrations

As **OpenTelemetry is an open standard**, any provider that adopts it via the wire protocol will automatically be compatible with KrakenD. All major vendors natively support it, in different degrees of functionality.

You can choose between self-hosting your metrics/traces solution or using one of the many SaaS systems.

As providers and software makers make an ongoing effort to adopt OpenTelemetry, you can find an extensive list of systems.See the [vendors who natively support OpenTelemetry](https://opentelemetry.io/ecosystem/vendors/).

### Self-hosted systems using OTEL

When you want to have complete control of your metrics and traces, this is a list of software you can install in your infrastructure:

- **Prometheus**: An open-source system monitoring and alerting toolkit.
- **Jaeger**: An open-source, self-hosted solution for distributed tracing.
- **Elastic APM**: Part of the Elastic Stack, can be self-hosted for full control over data and infrastructure.
- **Grafana Tempo**: Integrates with Grafana can be self-hosted for tracing data.

All the options above allow you to have full ownership of the data.

### SaaS systems using OTEL

If you want to use a third-party SaaS and delegate the data to a vendor, here is a non-exhaustive list of a few APM systems that vary in their specific offerings, such as AI capabilities, ease of integration, visualization tools, and support for different programming languages and frameworks:

- New Relic
- Datadog
- Dynatrace
- Splunk APM (formerly SignalFx)
- AppDynamics (Cisco)
- Elastic APM
- Instana
- Google Cloud’s operations suite (formerly Stackdriver)
- AWS X-Ray
- Azure Monitor
- Jaeger
- Lightstep
- Honeycomb.io
- Sumo Logic
- SolarWinds AppOptics
- LogicMonitor
- Scout APM
- Rollbar
- Wavefront by VMware

The adoption of OpenTelemetry by these platforms indicates a strong industry shift towards standardized, open-source observability solutions. **You should test the ones you need on KrakenD** and ensure they deliver what you seek; from KrakenD, we are unfamiliar with every vendor out there.

[Configure OpenTelemetry](https://www.krakend.io/docs/telemetry/opentelemetry/ "Configure OpenTelemetry")
