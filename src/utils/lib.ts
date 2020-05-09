export const promiseAll = async (promises) => {
  const reflect = (promise) => {
    return promise.then(
      (v) => {
        return { status: 'fulfilled', value: v };
      },
      (error) => {
        return { status: 'rejected', reason: error };
      },
    );
  };

  const results = await Promise.all(promises.map(reflect));
  const successfulPromises = results.filter((promise: any) => promise.status === 'fulfilled').map(({ value }) => value);
  const failedPromises = results.filter((promise: any) => promise.status === 'rejected').map(({ reason }) => reason);

  return { successfulPromises, failedPromises };
};
