// @denoify-ignore

interface CloudFrontHeader {
  key: string
  value: string
}

export interface CloudFrontHeaders {
  [name: string]: CloudFrontHeader[]
}

interface CloudFrontCustomOrigin {
  customHeaders: CloudFrontHeaders
  domainName: string
  keepaliveTimeout: number
  path: string
  port: number
  protocol: string
  readTimeout: number
  sslProtocols: string[]
}

export interface CloudFrontRequest {
  clientIp: string
  headers: CloudFrontHeaders
  method: string
  querystring: string
  uri: string
  body?: {
    inputTruncated: boolean
    action: string
    encoding: string
    data: string
  }
  origin?: {
    custom: CloudFrontCustomOrigin
  }
}

export interface CloudFrontResponse {
  headers: CloudFrontHeaders
  status: string
  statusDescription?: string
}

export interface CloudFrontConfig {
  distributionDomainName: string
  distributionId: string
  eventType: string
  requestId: string
}

interface CloudFrontEvent {
  cf: {
    config: CloudFrontConfig
    request: CloudFrontRequest
    response?: CloudFrontResponse
  }
}

export interface CloudFrontEdgeEvent {
  Records: CloudFrontEvent[]
}

export type CloudFrontContext = {}

export interface Callback {
  (err: Error | null, result?: CloudFrontRequest | CloudFrontResult): void
}

// https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-generating-http-responses-in-requests.html#lambda-generating-http-responses-programming-model
export interface CloudFrontResult {
  status: string
  statusDescription?: string
  headers?: {
    [header: string]: {
      key: string
      value: string
    }[]
  }
  body?: string
  bodyEncoding?: 'text' | 'base64'
}
