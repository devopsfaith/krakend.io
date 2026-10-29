# GeoIP integration: Location-based services

> Leverage GeoIP endpoints in KrakenD Enterprise for location-based services and enrich your API responses

Source: https://www.krakend.io/docs/enterprise/endpoints/geoip/

The GeoIP integration allows you load Maxmind’s [GeoIP2 City](https://www.maxmind.com/en/geoip2-city) database (both commercial and free versions) and enrich all KrakenD calls to your backends with geo data.

To add GeoIP information to your backends, copy the Maxmind’s database file into the filesystem (it has to be a city DB) and specify its location in the configuration. Downloading the database requires signing up to MaxMind’s website.

[Download the commercial or free GeoIP2 City](https://www.maxmind.com/en/geoip2-city)

## Configuration for GeoIP

Add the following `extra_config` in the root to your configuration file:

```json
{
  "version": 4,
  "extra_config": {
    "plugin": {
      "pattern": ".so",
      "folder": "/opt/krakend/plugins/"
    },
    "plugin/http-server": {
      "plugins": [
        {
          "name": "geoip",
          "config": {
            "citydb_path": "/etc/krakend/GeoIP2-City.mmdb"
          }
        }
      ]
    }
  }
}
```

The options below go inside the `config` of the `geoip` plugin:

##### Fields of GeoIP

\* required fields

##### [`citydb_path`](https://www.krakend.io/docs/enterprise/endpoints/geoip/#citydb_path "Click to copy link to citydb_path") * string

The path in the filesystem containing the database in GeoIP2 Binary (`.mmdb`) format. Relative to the working dir or absolute path.

Example: `"path/to/GeoIP2-City.mmdb"`

Schema: [https://www.krakend.io/schema/v3.0/plugin/geoip.json](https://www.krakend.io/schema/v3.0/plugin/geoip.json "JSON schema definition")

### Data passed to backends

When the GeoIP plugin is enabled, all requests to the backend are enriched with a header `X-GeoIP`.

The following structure is available. Keys that couldn’t retrieve its associated data show an empty value. You can use these fields in the [GeoIP policies](https://www.krakend.io/docs/enterprise/security-policies/).

- `City`
  
  - `GeoNameID` integer
  - `Names` map\[string]string
- `Continent`
  
  - `Code` string
  - `GeoNameID` integer
  - `Names` map\[string]string
- `Country`
  
  - `GeoNameID` integer
  - `IsInEuropeanUnion` bool
  - `IsoCode` string
  - `Names` map\[string]string
- `Location`
  
  - `AccuracyRadius` integer16
  - `Latitude` float64
  - `Longitude` float64
  - `MetroCode` integer
  - `TimeZone`string
- `Postal`
  
  - `Code` string
- `RegisteredCountry`
  
  - `GeoNameID` integer
  - `IsInEuropeanUnion` bool
  - `IsoCode` string
  - `Names` map\[string]string
- `RepresentedCountry`
  
  - `GeoNameID` integer
  - `IsInEuropeanUnion` bool
  - `IsoCode` string
  - `Names` map\[string]string
  - `Type`string
- `Subdivisions` (array):
  
  - `GeoNameID` integer
  - `IsoCode` string
  - `Names` map\[string]string
- `Traits`
  
  - `IsAnonymousProxy` bool
  - `IsSatelliteProvider` bool
