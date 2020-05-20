import { config } from 'dotenv';
config(); // dotenv config

import { ExchangeRateProxy } from './proxies/exchange-rate.proxy';
import { TransactionProxy } from './proxies/transaction.proxy';
import { promiseAll, chunk } from './utils/lib';

const TRANSACTION_COUNT = parseInt(process.env.TRANSACTION_COUNT, 10) || 100;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE, 10) || 15;
const BASE_CURRENCY = process.env.BASE_CURRENCY || 'EUR';

const exchangeRateProxy = new ExchangeRateProxy();
const transactionProxy = new TransactionProxy();

const localCache = {};

async function convertTransaction(transaction) {
  const { createdAt, currency, amount, checksum } = transaction;
  let exchangeRates;
  if (!localCache[createdAt]) {
    exchangeRates = await exchangeRateProxy.getExchangeRate(createdAt, BASE_CURRENCY);
    localCache[createdAt] = exchangeRates;
  } else {
    exchangeRates = localCache[createdAt];
    console.log(`Got Exchange Rate from local cache`);
  }

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
  const transactions = await transactionProxy.getTransactions(TRANSACTION_COUNT, BATCH_SIZE);

  const transactionsChunks = chunk(transactions, BATCH_SIZE);
  let successfulConvertedTransactions = [];

  // Convert Transactions
  for (const chunk of transactionsChunks) {
    const { successfulPromises, failedPromises } = await promiseAll(chunk.map(convertTransaction));
    if (failedPromises.length > 0) {
      console.error(`Failed to convert ${failedPromises.length} transactions`);
      console.log(failedPromises);
    }

    successfulConvertedTransactions = [...successfulConvertedTransactions, ...successfulPromises];
  }

  // Post Transactions
  try {
    await transactionProxy.postTransactions(successfulConvertedTransactions);
  } catch (error) {
    // TODO: Add system alert
    console.log(error);
  }
};

submitTransactions();
