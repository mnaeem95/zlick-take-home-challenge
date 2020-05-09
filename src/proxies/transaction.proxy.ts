import { HttpClient } from '../utils/httpclient';
import { promiseAll } from '../utils/lib';

export class TransactionProxy {
  private transactionService;

  constructor(timeoutMS = 60000, headers = { 'Content-Type': 'application/json' }) {
    const serviceUrl = process.env.TRANSACTION_SERVICE;
    this.transactionService = new HttpClient(serviceUrl, timeoutMS, headers);
  }

  getTransactions = async (transactionCount): Promise<any> => {
    const transactions = [];

    for (let i = 0; i < transactionCount; i++) {
      transactions.push(this.getTransaction());
    }

    try {
      const { successfulPromises, failedPromises } = await promiseAll(transactions);

      if (failedPromises.length > 0) {
        console.error(`Error while retrieving ${failedPromises.length} transactions from Transaction Service`);
        console.log(failedPromises);
      }

      return successfulPromises;
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  };

  postTransactions = async (transactions): Promise<any> => {
    const url = '/prod/process-transactions';
    const payload = { transactions };
    try {
      console.log(`TransactionProxy => Calling POST API: ${url}`);
      const {
        data: { failed, success },
      } = await this.transactionService.post(url, payload);
      console.log(`TransactionProxy => Received response from API: ${url}`);

      if (!success) {
        throw new Error(`Failed to post ${failed} transactions`);
      }
    } catch (error) {
      console.error(`TransactionProxy => Error calling POST API: '${url}' => ${error.message}`);
      throw new Error(error.response.data);
    }
  };

  private getTransaction = async (): Promise<any> => {
    const url = `/prod/get-transaction`;

    try {
      console.log(`TransactionProxy => Calling GET API: ${url}`);
      const transactionDetails = await this.transactionService.get(url);
      console.log(`TransactionProxy => Received response from API: ${url}`);

      return transactionDetails.data;
    } catch (error) {
      console.error(`Error while retrieving transaction details from Transaction Service =>  ${error.message}`);
      throw new Error(error.response.data);
    }
  };
}
