# API Gateway Performance Benchmarks with KrakenD

> Explore the performance benchmarks conducted with KrakenD API Gateway to ensure optimal performance and scalability for your APIs.

Source: https://www.krakend.io/docs/benchmarks/

## KrakenD, the **ultra performer** API Gateway

An API Gateway is a component that needs to deliver really fast, as it is an added layer in the infrastructure. KrakenD was built with performance in mind. In this page and inner pages, you’ll find several tests we did to measure the performance. We also invite you to do them for yourself!

## TL;DR: **Benchmark results**

**~18,000 requests/second** on an ordinary laptop.

The following table summarizes different performance tests using Amazon EC2 virtual instances and an example with a laptop.

| \#  | Hardware specs                               | Requests second   | Average response |
|-----|----------------------------------------------|-------------------|------------------|
| 1\. | Amazon EC2 (c4.2xlarge)                      | 10126.1613 reqs/s | 9.8ms            |
| 2\. | Amazon EC2 (c4.xlarge)                       | 8465.4012 reqs/s  | 11.7ms           |
| 3\. | Amazon EC2 (m4.large)                        | 3634.1247 reqs/s  | 27.3ms           |
| 4\. | Amazon EC2 (t2.medium)                       | 2781.8611 reqs/s  | 351.3ms          |
| 5\. | Amazon EC2 (t2.micro)                        | 2757.6407 reqs/s  | 35.8ms           |
| 6\. | MacBook Pro (Aug 2015) 2,2 GHz Intel Core i7 | 18157.4274 reqs/s | 5.5ms            |

### Benchmark in a MacBook Pro

[Here you will find the results of the benchmarks](https://www.krakend.io/docs/benchmarks/local/)

### Benchmark in Amazon AWS EC2 Instances

[Here you will find the results of the benchmarks](https://www.krakend.io/docs/benchmarks/aws/)

### API Gateway Benchmark

[Here you will find the results of the comparisons](https://www.krakend.io/docs/benchmarks/api-gateway-benchmark/)

## Tooling

### hey

Some local benchmarks used the [hey](https://github.com/rakyll/hey) tool, which is an Apache Benchmark (ab) replacement tool.

### api-gateway-benchmark

> This project aims to provide a complete set of tools needed to do simple performance comparisons in the API manager/gateway space. It is inspired by the great Framework Benchmarks project by TechEmpower.

Check the [varnish/api-gateway-benchmarks](https://github.com/varnish/api-gateway-benchmarks) project for more info.

### Lwan

[LWAN](https://lwan.ws/) is a high performance web server used to build the backends REST APIs for KrakenD to load the data during the benchmarks.
