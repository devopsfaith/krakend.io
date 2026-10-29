# InfluxDB Telemetry Integration

> Integrate InfluxDB telemetry with KrakenD API Gateway for efficient data collection, storage, and visualization of API performance metrics

Source: https://www.krakend.io/docs/telemetry/influxdb/

[InfluxDB](https://www.influxdata.com/) is a time series database designed to handle high write and query loads and allows you to store and visualize metrics data. Influx is offered as an open-source solution you can host but also as a cloud service.

KrakenD instruments your API automatically code and generates telemetry data that is pushed using the **OpenTelemetry Protocol** (OTLP) via the [OpenTelemetry integration](https://www.krakend.io/docs/telemetry/opentelemetry/). The data can travel through gRPC or HTTP and uses the standard OTLP format an [OTEL Collector](https://opentelemetry.io/docs/collector/) expects.

The OpenTelemetry integration populates metrics data to an Influx database when you add the `telemetry/opentelemetry` namespace to the configuration with an `otlp` exporter. There is no specific setting for InfluxDB because OTEL is a standard shared with many other technologies.

The flow for the Influx population using OTLP is as follows:

![KrakenD OTLP communication with a Collector that sends to Influx](https://www.krakend.io/images/documentation/diagrams/opentelemetry-otlp-influx.mmd.svg)

You can configure [OpenTelemetry](https://www.krakend.io/docs/telemetry/opentelemetry/) with an `otlp` exporter to push data to InfluxDB.
