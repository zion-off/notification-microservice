# Specification

1. Build a notification service microservice for sending emails and SMS.
2. Server: https://gist.github.com/optisiddiqus/8fa46055924f33b2e1cdfc3fb1911ab7
3. The server exposes a few API endpoints to send SMS and email through multiple
   providers.
4. Endpoint: `POST /api/${type}/provider${index}`, where type is
   `"sms" || "email"` and `0 < index < 4`.
5. Schema:
   1. SMS: `const { phone, text } = req.body;`
   2. Email: `const { subject, body, recipients } = req.body;`
6. Utilize these providers and build a scalable and fault tolerant microservice
   for sending notifications.
7. Considerations
   1. What are valid use cases for a 'race to first completion' for promises?
   2. Study about low latency microservices pros and cons
   3. Study about retry mechanisms
8. Unit tests
9. Load testing with JMeter

# Overview

## Why Microservices?

In the history of large scale software development, quite a few challenges posed
by monolithic systems have contributed to the evolution and wider adoption of
microservice architectures. For our purposes, i.e. in relation to a messaging
client, the loose coupling of the client and the server makes sense owing to a
number of reasons.

### Microservices are technology agnostic[^1]

The message emitter, or the client, in this case, interacts with the service
using REST, so the implementation details of the server, beyond the API
definition, do not concern the client's implementation. The server could have
been implemented in a different programming language altogether and would still
be able to communicate with the client regardless, thanks to REST
specifications.

### Microservices facilitate software evolution

With the loose coupling of the client and the server, either of these could be
modified, to an extent, without the risk of encountering breaking changes. For
instance, the server code could instantiate a few more Express objects, and its
clients would not have to be modified. Although, it would be in the client
developer’s best interest to make use of the extra instances, the principle
still stands.

# Fault tolerance implementation

Despite their advantages, microservices, by nature, introduce two or more points
of failure. To address this in our system, we implement the following
mechanisms. For clarity, imagine a sample request being sent to our server.

## Load balancing

The incoming request is received by a handler function, which picks a provider
at random and routes the request to the provider if it is healthy. Whether a
provider is healthy is determined using a `healthy` flag, a boolean
representation of the provider's health. For each provider, we maintain a fixed
sized window to keep track of the last 500 requests sent to that provider. If
the ratio of success to error responses drop below a certain threshold, the
`healthy` flag for that provider is toggled to false. This threshold can be
dynamically adjusted by the operator based on the server load, and can be made
inversely proportional to the server load. If the server is receiving too many
requests, we would want to avoid marking providers as unhealthy too soon.

## Request handling

Request queuing and processing is done with a robust, dedicated third-party
library, BullMQ, which is "a Node.js library that implements a fast and robust
queue system built on top of Redis that helps in resolving many modern age
micro-services architectures."[^2].

<details>
<summary>Example</summary>

```js
import { Queue } from "bullmq";

const myQueue = new Queue("foo");

async function addJobs() {
  await myQueue.add("myJobName", { foo: "bar" });
  await myQueue.add("myJobName", { qux: "baz" });
}

await addJobs();
```

</details>

We instantiate a separate queue for each provider, which allows for finer
control over each provider and facilitates horizontal scaling. For example, each
queue can be rate limited in accordance with the corresponding provider's
capacity, or the queues can be deployed across regions to ensure isolation. When
the handler routes a request to a given provider, it essentially enqueues the
request to the provider's respective queue.

## Retry after delay

We retry only if a 500 level error is received, which indicates an error at the
server. When we do get one, we send it back to the handler function, which
handles the request appropriately. By not retyring after a simple timeout, we
ensure a mechanism for deduplication (idempotence). Otherwise, retries could
cause the same request to be sent more than once, with unintended side effects.

> If the fault is caused by one of the more commonplace connectivity or busy
> failures, the network or service might need a short period while the
> connectivity issues are corrected or the backlog of work is cleared, so
> programatically delaying the retry is a good strategy. In many cases, the
> period between retries should be chosen to spread requests from multiple
> instances of the application as evenly as possible to reduce the chance of a
> busy service continuing to be overloaded.
>
> If the request still fails, the application can wait and make another attempt.
> If necessary, this process can be repeated with increasing delays between
> retry attempts, until some maximum number of requests have been attempted. The
> delay can be increased incrementally or exponentially, depending on the type
> of failure and the probability that it'll be corrected during this time.[^3]

Since we assume that the server does not fail deterministically, we implement a
retry mechanism with exponential delays, and having a separate queue for each
provider allows us to adjust the delay for each provider individually. Every
time a provider returns an error, we keep increasing it's delay, until at some
point, the provider is marked unhealthy.

## Recovering from unhealthy

In a distributed system, faults can occur as a result of anticipated events,
such as network congestion and timeouts, which are generally resolved quickly.
However, unanticipated events, such as failure in a particular part of the
system, could also be causing failures. Cascading timeouts or failures could
then overwhelm the system. To address this, we adopt the circuit breaker
pattern[^4].

When a provider crosses a delay threshold, as in, its success to failure ratio
dips below a certain threshold, it is marked unhealthy, and we stop sending it
requests. However, the handler function will still randomly route requests to
unhealthy providers in order to check its health. With enough successful
responses, the provider's health metrics can be brought back up, and it may be
marked healthy for use again.

[^1]:
    [What are the benefits of a microservices architecture?](https://about.gitlab.com/blog/2022/09/29/what-are-the-benefits-of-a-microservices-architecture/)

[^2]: [What is BullMQ](https://docs.bullmq.io)
[^3]:
    [Retry pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry)

[^4]:
    [Circuit breaker pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/circuit-breaker.html)
