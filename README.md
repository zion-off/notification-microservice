# Specification

1. Build a notification service microservice for sending emails and SMS.
2. Server: https://gist.github.com/optisiddiqus/8fa46055924f33b2e1cdfc3fb1911ab7
3. The server exposes a few API endpoints to send SMS and email through multiple providers.
4. Endpoint: `POST /api/${type}/provider${index}`, where type is `"sms" || "email"` and `0 < index < 4`.
5. Schema:
    1. SMS: `const { phone, text } = req.body;`
    2. Email: `const { subject, body, recipients } = req.body;`
6. Utilize these providers and build a scalable and fault tolerant microservice for sending notifications.
7. Considerations
    1. What are valid use cases for a 'race to first completion' for promises?
    2. Study about low latency microservices pros and cons
    3. Study about retry mechanisms
8. Unit tests
9. Load testing with JMeter

# Overview

## Why Microservices?

In the history of large scale software development, quite a few challenges posed by monolithic systems have contributed to the evolution and wider adoption of microservice architectures. For our purposes, i.e. in relation to a messaging client, the loose coupling of the client and the server makes sense owing to a number of reasons.

### Microservices are technology agnostic[^1]

The message emitter, or the client, in this case, interacts with the service using REST, so the implementation details of the server, beyond the API definition, do not concern the client's implementation. The server could have been implemented in a different programming language altogether and would still be able to communicate with the client regardless, thanks to REST specifications.

### Microservices facilitate software evolution

With the loose coupling of the client and the server, either of these could be modified, to an extent, without the risk of encountering breaking changes. For instance, the server code could instantiate a few more Express objects, and its clients would not have to be modified. Although, it would be in the client developer’s best interest to make use of the extra instances, the principle still stands.

## Fault tolerance implementation

Despite their advantages, microservices, by nature, introduce two or more points of failure. To address this in our system, we implement the following mechanisms.

### Request handling

Incoming requests are stored in a deque, similar to how outgoing segments are handled in network buffers at the transport layer. Although TCP maintains a window that can grow and shrink in response to the number of ACKs received, since we cannot afford to "drop" outgoing requests at the application layer, we implement a simple double ended queue to handle outgoing requests. 

We take the server to be a wrapper around multiple instances of text and email services, and when we make a request, we also keep track of the particular service that was requested. When the server responds with an error, the error message can be inspected to identify the service that caused the failure. Sending a request increments a flag assigned to that service, and receiving a 200 response decrements it. If this flag exceeds a value, we can take further action, as discussed below.

All of this can be housed in a `NetworkHandler` singleton class.

### Retry after delay

We retry only if a 500 level error is received, which indicates an error at the server. When we do get one, we push the same request that caused the error to the head of the queue. This ensures a mechanism for deduplication (idempotence). Otherwise, retries could cause the same request to be sent more than once, with unintended side effects.

> If the fault is caused by one of the more commonplace connectivity or busy failures, the network or service might need a short period while the connectivity issues are corrected or the backlog of work is cleared, so programatically delaying the retry is a good strategy. In many cases, the period between retries should be chosen to spread requests from multiple instances of the application as evenly as possible to reduce the chance of a busy service continuing to be overloaded.
> 
> If the request still fails, the application can wait and make another attempt. If necessary, this process can be repeated with increasing delays between retry attempts, until some maximum number of requests have been attempted. The delay can be increased incrementally or exponentially, depending on the type of failure and the probability that it'll be corrected during this time.[^2]

Since we assume that the server does not fail deterministically, we implement a retry mechanism with exponential delays. 

Additionally, in a distributed system, faults can occur as a result of anticipated events, such as network congestion and timeouts, which are generally resolved quickly. However, unanticipated events, such as failure in a particular part of the system, could also be causing failures. Cascading timeouts or failures could then overwhelm the system. To address this, we adopt the circuit breaker pattern[^3]. If one particular service crosses a failure threshold, we can safely assume it to be offline, and avoid querying it with further requests. How we arrive at this failure threshold is also an important consideration, and it should ideally correlate with the system load at a given time. 

[^1]: [What are the benefits of a microservices architecture?](https://about.gitlab.com/blog/2022/09/29/what-are-the-benefits-of-a-microservices-architecture/)

[^2]: [Retry pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry)

[^3]: [Circuit breaker pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/circuit-breaker.html)