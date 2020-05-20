import axios from 'axios';
import axiosRetry, { exponentialDelay, isNetworkOrIdempotentRequestError } from 'axios-retry';

export class HttpClient {
  private service;

  static readonly DEFAULT_TIMEOUT: number = parseInt(process.env.HTTP_CLIENT_TIMEOUT, 10) || 15000;
  static readonly DEFAULT_RETRIES = 5;

  constructor(serviceNameOrUrl, timeoutMS = -1, headersJson = {}, retryConfig: any = {}) {
    this.service = axios.create({
      baseURL: serviceNameOrUrl,
      timeout: timeoutMS && timeoutMS > 0 ? timeoutMS : HttpClient.DEFAULT_TIMEOUT,
      headers: headersJson,
    });

    /* Retry Policy

    // Retry: By default, the axios-retry library retries if it is a network error
    // or a 5xx error on an idempotent request (GET, HEAD, OPTIONS, PUT or DELETE)
    // retryCondition callback can be used to override the default behavior

    // Delay: exponentialDelay is being used by default, for 5 retries the total time
    // difference between first and the last retry will be around 6-7 seconds
    // retryDelay callback can be used to override the default behavior
    */

    axiosRetry(this.service, {
      retries: retryConfig.retries || HttpClient.DEFAULT_RETRIES,
      shouldResetTimeout: true,
      retryDelay: retryConfig.retryDelay || exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED';
      },
    });
  }

  async get(endpointUrl, options = undefined): Promise<any> {
    let result = null;
    try {
      if (options && Object.keys(options).length !== 0) {
        result = await this.service.get(endpointUrl, options);
      } else {
        result = await this.service.get(endpointUrl);
      }
      console.log(`HttpClient => get() - Success Response received from: ${endpointUrl} endpoint`);

      return result;
    } catch (error) {
      console.error(
        `HttpClient => get() - Failed Response received from: ${endpointUrl} endpoint. Error: ${error.code} - ${error.message}`,
      );

      if (!error.response) {
        error.response = {
          data: new Error(`Proxy Error: ${error.message}`),
        };
      }
      throw error;
    }
  }

  async post(endpointUrl, dataJson = {}, options = undefined): Promise<any> {
    let result = null;
    try {
      if (options && Object.keys(options).length !== 0) {
        result = await this.service.post(endpointUrl, dataJson, options);
      } else {
        result = await this.service.post(endpointUrl, dataJson);
      }
      console.log(`HttpClient => post() - Success Response received from: ${endpointUrl} endpoint`);
      return result;
    } catch (error) {
      console.error(
        `HttpClient => post() - Failed Response received from: ${endpointUrl} endpoint. Error: ${error.code} - ${error.message}`,
      );
      if (!error.response) {
        error.response = {
          data: new Error(`Proxy Error: ${error.message}`),
        };
      }
      throw error;
    }
  }
}
