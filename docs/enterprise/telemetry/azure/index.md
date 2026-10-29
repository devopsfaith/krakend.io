# Azure Monitor Telemetry Integration

> Integrate Azure Telemetry with KrakenD for effective monitoring and performance analysis of your APIs. Follow our documentation to set up seamless integration with your Azure services.

Source: https://www.krakend.io/docs/enterprise/telemetry/azure/

[Azure Monitor](https://azure.microsoft.com/en-us/services/monitor/) collects, analyzes, and acts on telemetry data from your Azure and on-premises environments. Azure Monitor helps you maximize performance and availability of your applications and proactively identify problems in seconds.

[![Azure Monitor screenshot](https://www.krakend.io/images/documentation/screenshots/azure-app-insights-1.png)](https://www.krakend.io/images/documentation/screenshots/azure-app-insights-1.png)

[![Azure Monitor screenshot](https://www.krakend.io/images/documentation/screenshots/azure-app-insights-2.png)](https://www.krakend.io/images/documentation/screenshots/azure-app-insights-2.png)

[![Azure Monitor screenshot](https://www.krakend.io/images/documentation/screenshots/azure-app-insights-3.png)](https://www.krakend.io/images/documentation/screenshots/azure-app-insights-3.png)

The gateway sends all the traces to a local **OpenTelemetry Collector** ([see repository](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/azuremonitorexporter)), allowing the gateway to offload data quickly and the collector can take care of additional handling like retries, batching, encryption or even sensitive data filtering. Finally, the Otel Collector pushes all the data to your **Application Insights** on Azure Monitor.

![Otel collector](https://www.krakend.io/images/documentation/diagrams/azure-collector.mmd.svg)

## Application Insights configuration

OpenTelemetry allows you to export telemetry data, Azure included. Nevertheless, the official **OpenTelemetry Collector** is flagged as **beta** and still **does not support pushing metrics** for Azure. So without further development on the OpenTelemetry side, the integration is limited to traces.

There are three things you need to do:

1. Create the Application Insights resource on Azure
2. Start the OpenTelemetry Collector
3. Add it to KrakenD’s configuration

### Create an Application Insights resource

To enable the Azure Monitor integration, you need to add a new resource **Application Insights**, under your Azure account and fill in the information as required (the details provided during the registration form are not relevant to the configuration).

![Application Insights](https://www.krakend.io/images/documentation/screenshots/azure-application-insights.png)

When the resource finishes creating, **save the Instrumentation Key** or **Connection String** for later usage.

### Starting the OpenTelemetry Collector

You can start the OpenTelemetry Collector with Azure’s compatibility using its [Docker image](https://hub.docker.com/r/otel/opentelemetry-collector-contrib). Here there is a `docker-compose.yml` example that includes a KrakenD and a collector:

```yaml
version: "3"
services:
  krakend:
    image: krakend/krakend-ee:3.0.2
    command: [ "krakend", "run", "-d", "-c", "/etc/krakend/krakend.json"]
    volumes:
      - ./:/etc/krakend
    ports:
      - 8080:8080
  # Collector
  otel-collector:
    image: otel/opentelemetry-collector-contrib
    command: ["--config=/etc/otel-collector.yaml"]
    volumes:
      - ./otel-collector.yaml:/etc/otel-collector.yaml
    ports:
      - "4317"
      - "4318"
```

The configuration mounted for the collector is below, `otel-collector.yaml`:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: "0.0.0.0:4317"
      http:
        endpoint: "0.0.0.0:4318"

exporters:
  # logging:
  #   verbosity: detailed
  azuremonitor:
    connection_string: XXXXXXX

service:
   telemetry:
     logs:
       level: "warn"
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [azuremonitor]
```

Enable the logging only if you find problems and want extra information.

Replace the value of the `connection_string` entry with the one you got in your Azure dashboard.

### Configuration for KrakenD

Lastly, add at the service level of KrakenD the following configuration:

```json
{
  "version": 4,
  "extra_config": {
    "telemetry/opentelemetry": {
      "trace_sample_rate": 1,
      "exporters": {
        "otlp": [
          {
            "name": "azure_monitor",
            "host": "localhost",
            "port": 4317
          }
        ]
      }
    }
  }
}
```

The configuration above reports a 100% of the activity (`trace_sample_rate = 1`), when in production consider lowering this value (e.g., `0.1`) as you will want a sample of the traffic only.

The `otel-collector` above is the name of the docker compose service running the collector. You might need to replace it if you are not using this example.

With these three steps, you can start sending data to KrakenD. You should start seeing the graphs populated on Azure Monitor in a couple of minutes.

Insecure flag

Most of the times, the communication between KrakenD and the collector happens in the same machine. It is rare that this connection uses SSL, and if it doesn’t, the `insecure` flag must be set to `true`. Otherwise, KrakenD will fail silently.

## Other Resources

- [OpenTelemetry Collector Docker Image](https://hub.docker.com/r/otel/opentelemetry-collector-contrib) with Azure support.
- [Application Insights](https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview?tabs=net)
- [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)
