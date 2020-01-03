export namespace RemoteFunctionCalls {
  export type Result<TApi> =
    TApi extends { [key in keyof TApi]: (...args: any) => Promise<infer TResult> } ? TResult : never;

  type JsonSafety = string | number | boolean | null | JsonSafety[] | JsonSafetyObject;
  type JsonSafetyObject = {
    [key: string]: JsonSafety | undefined;
  };

  type ApiItemJsonSafety<TApiFunction> = TApiFunction extends (...args: infer TArgs) => Promise<JsonSafety>
    ? TArgs extends JsonSafety ? TApiFunction : never
    : never;
  type ApiJsonSafety<TApi> = { [key in keyof TApi]: ApiItemJsonSafety<TApi[key]> };

  type Transmitter<TApi> = (path: string, dataObject: any) => Promise<Result<TApi>>;

  type AddFirstParamToFunction<TFunction, TTools> = TFunction extends (...args: infer A) => infer B
    ? (tools: TTools, ...args: A) => B
    : never;

  export const Client = <TApi extends ApiJsonSafety<TApi>>(transmitter: Transmitter<TApi>): TApi => {
    const functionsCache = new Map<string, {}>(); // Do not create new function for every call

    return new Proxy({}, {
      get(_, name: string) {
        const cached = functionsCache.get(name);
        if (cached === undefined) {
          const newFunc = async (...args: any[]) => {
            return await transmitter(name, args);
          };
          functionsCache.set(name, newFunc);
          return newFunc;
        }
        return cached;
      }
    }) as TApi;
  };

  export type ServerApi<TApi, TTools> = {
    [TKey in keyof TApi]: AddFirstParamToFunction<TApi[TKey], TTools>;
  }

  type Server<TApi, TTools> =
    (path: string, data: any, tools: TTools) => Promise<Result<TApi>>;

  export const Server = <TApi extends ApiJsonSafety<TApi>, TTools>(api: ServerApi<TApi, TTools>): Server<ApiJsonSafety<TApi>, TTools> => {
    return (path: string, dataObject: any, tools: TTools) => {
      const decodedPath = path;
      return (api as any)[decodedPath](tools, ...dataObject);
    };
  };
}
