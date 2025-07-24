export const valueFromSP = <T extends Record<string, any>>(
  request: Request<unknown, CfProperties<unknown>>
): T => {
  const sp = new URL(request.url).searchParams;

  let values: T = {} as T;
  sp.forEach((v, k) => {
    values = { ...values, [k]: v };
  });

  return values;
};
