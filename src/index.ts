import { config } from 'dotenv';
config(); // dotenv config

import { ExchangeRateProxy } from './proxies/exchange-rate.proxy';
import { TransactionProxy } from './proxies/transaction.proxy';
import { promiseAll } from './utils/lib';

const TRANSACTION_COUNT = parseInt(process.env.TRANSACTION_COUNT, 10) || 5;
const BASE_CURRENCY = process.env.BASE_CURRENCY || 'EUR';

const exchangeRateProxy = new ExchangeRateProxy();
const transactionProxy = new TransactionProxy();

async function convertTransaction(transaction) {
  const { createdAt, currency, amount, checksum } = transaction;

  // Get Exchange Rate
  const exchangeRates = await exchangeRateProxy.getExchangeRate(createdAt, BASE_CURRENCY);

  if (exchangeRates.rates[currency]) {
    const convertedAmount = (amount / exchangeRates.rates[currency]).toFixed(4);

    return {
      createdAt,
      currency,
      convertedAmount: parseFloat(convertedAmount),
      checksum,
    };
  } else {
    throw new Error(`Failed to get exchange rates for ${currency}`);
  }
}

const submitTransactions = async () => {
  // Get All Transactions
  const transactions = await transactionProxy.getTransactions(TRANSACTION_COUNT);

  // Convert Transactions
  const { successfulPromises, failedPromises } = await promiseAll(transactions.map(convertTransaction));

  if (failedPromises.length > 0) {
    console.error(`Failed to convert ${failedPromises.length} transactions`);
    console.log(failedPromises);
  }

  // Post Transactions
  try {
    await transactionProxy.postTransactions(successfulPromises);
  } catch (error) {
    // TODO: Add system alert
    console.log(error);
  }
};

submitTransactions();
