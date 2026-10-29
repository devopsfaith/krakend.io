# Zipkin Telemetry Integration

> Integrate Zipkin telemetry to monitor and trace KrakenD API Gateway requests efficiently for enhanced performance

Source: https://www.krakend.io/docs/enterprise/telemetry/zipkin/

[Zipkin](https://zipkin.io/) is a distributed tracing system. It helps gather timing data needed to troubleshoot latency problems in service architectures.

The OpenTelemetry exporter allows you export data to Zipkin via a [zipkin-otel collector](https://github.com/openzipkin-contrib/zipkin-otel). Once you have the zipkin-otel running, add in the KrakenD configuration an`otlp` exporter in the [OpenTelemetry module](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/) with the port and protocol you have chosen.

See the [OpenTelemetry configuration](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/).
