# Bot Detection and Throttling Guide: Prevent API Abuse

> Implement bot detection and throttling mechanisms to prevent API abuse and ensure fair usage. Follow our comprehensive guide to protect your APIs from malicious bot traffic.

Source: https://www.krakend.io/docs/enterprise/throttling/botdetector/

The **bot detector** module checks incoming connections to the gateway to determine if a bot made them, helping you detect and reject bots carrying out scraping, content theft, and form spam.

Bots are detected by inspecting the `User-Agent` and comparing its value with a set of configuration rules provided by you. The bot detector module **does not set any initial rules**, meaning that is up to you to decide the best rules for your use case, and choose how restrictive or permissive you are with bots.

As the bot detector module is flexible in its configuration, you can use it for other purposes than just discarding bots. For instance, you could set an allow rule for your mobile application `User-Agent` which would be allowed to interact with KrakenD and discard the rest of the traffic.

Discarded traffic receives a `403 Forbidden` status code.

## Configuring bot rules

The configuration rules of the bot detector have to be included inside the `extra_config`’s namespace `security/bot-detector` at the root level of your `krakend.json` file, or inside an endpoint.

For instance:

```json
{
    "extra_config": {
        "security/bot-detector": {
            "allow": ["MyAndroidClient/1.0", "Pingdom.com_bot_version_1.1"],
            "deny": ["a", "b"],
            "patterns": [
                "(Pingdom.com_bot_version_).*",
                "(facebookexternalhit)/.*"
            ],
            "cache_size": 10000,
            "empty_user_agent_is_bot": true
        }
    }
}
```

The available configuration options in the bot detector module are:

##### Fields of Bot detector

\* required fields

##### [`allow`](https://www.krakend.io/docs/enterprise/throttling/botdetector/#allow "Click to copy link to allow") array of strings

An array with EXACT MATCHES of trusted user agents that can connect.

Example: `["MyAndroidClient/1.0","Pingdom.com_bot_version_1.1"]`

Defaults to `[]`

##### [`cache_size`](https://www.krakend.io/docs/enterprise/throttling/botdetector/#cache_size "Click to copy link to cache_size") integer

Size of the LRU cache that helps speed the bot detection. The size is the mumber of users agents that you want to keep in memory.

Example: `1000`

##### [`deny`](https://www.krakend.io/docs/enterprise/throttling/botdetector/#deny "Click to copy link to deny") array of strings

An array with EXACT MATCHES of undesired bots, to reject immediately.

Example: `["facebookexternalhit/1.1"]`

Defaults to `[]`

##### [`empty_user_agent_is_bot`](https://www.krakend.io/docs/enterprise/throttling/botdetector/#empty_user_agent_is_bot "Click to copy link to empty_user_agent_is_bot") boolean

Whether to consider an empty user-agent a bot (and reject it) or not.

Defaults to `false`

##### [`patterns`](https://www.krakend.io/docs/enterprise/throttling/botdetector/#patterns "Click to copy link to patterns") array of strings

An array with all the regular expressions that define bots. Matching bots are rejected.

Example: `["GoogleBot.*","(facebookexternalhit)/.*"]`

Defaults to `[]`

Schema: [https://www.krakend.io/schema/v3.0/security/bot-detector.json](https://www.krakend.io/schema/v3.0/security/bot-detector.json "JSON schema definition")

Notice that the `allow` and the `deny` do not expect regular expressions, but **literal strings**. The purpose of this design is to get the best performance as comparing a literal string is much faster than evaluating a regular expression.

On the other hand, the `patterns` attribute expects regular expressions. The syntax is the same general syntax used by Perl, Python, and other languages. More precisely, it is the syntax accepted by [RE2](https://golang.org/s/re2syntax)

The order of evaluation of the rules is sequential in this order: `allow` -&gt; `deny` -&gt; `patterns`. When a user agent matches in any of the former evaluations, the execution ends, and the connection is accepted (allow) or rejected (deny and patterns).

### Building your bot rules

Fighting against spam, spiders, scrapping, theft, and bots is a problematic matter. There are different angles you can choose to combat it using the bot detection module.

Maybe you want to have a [massive list](https://github.com/ua-parser/uap-core/blob/master/regexes.yaml) of regular expressions of bots that are troubling you, and caching enabled.

Or perhaps you only require a single negative pattern that discards anything that you don’t know is legit.

Whatever rules you decide to set in place, remember than allowing and denying are faster but are inflexible and require you to set the exact user-agent. On the other hand, regular expressions are very convenient, but the cost of evaluating them is higher in comparison.

### Caching

Evaluating every user agent against a **substantial list of patterns** can be a time-consuming operation. Even when we are talking about a few milliseconds, you can enable caching by setting `cache_size` and avoid reprocessing User-Agents checked before. Every millisecond counts!

The LRU caching system is in-memory and does not require running a separate set of servers, thus reducing the operation pain. There are neither cache expiration times, nor explicit cache evictions. When/if the cache is full, the least recently used (LRU) element is automatically replaced with the new one. An order of magnitude of megabytes should be enough to save the different User-Agent requests and combinations.

Set in the `cache_size` an integer with the fixed size of the cache (number of elements to store), or `0` to disable caching.
