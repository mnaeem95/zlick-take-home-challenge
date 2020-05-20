import { HttpClient } from '../utils/httpclient';

export class ExchangeRateProxy {
  private exchangeRateService;

  constructor(timeoutMS = 60000, headers = { 'Content-Type': 'application/json' }) {
    const serviceUrl = process.env.EXCHANGE_RATE_SERVICE;
    this.exchangeRateService = new HttpClient(serviceUrl, timeoutMS, headers);
  }

  getExchangeRate = async (date: string, baseCurrency: string): Promise<any> => {
    try {
      const url = `/${new Date(date).toISOString().substring(0, 10)}?base=${baseCurrency}`;

      const exchangeRate = await this.exchangeRateService.get(url);
      return exchangeRate.data;
    } catch (error) {
      console.error(`Error while retrieving exchange rate from Exchange Rate Service =>  ${error.message}`);
      throw new Error(error.response.data);
    }
  };
}
