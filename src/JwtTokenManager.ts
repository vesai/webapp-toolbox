export const enum UnexpectedBehavior {
  // Do not reorder members
  TokenFromAnotherPageHasWrongExpired = 0,
  LocalStorageTokenBecameNull = 1,
  LocalStorageTokenChanged = 2,
  TokenFromServerHasWrongExpired = 3,
  LocalStorageTokenChangedButWithWrongExpired = 4,
  TokenNotValidTwoTimes = 5,
}

// TODO make better two tabs protection

export type JwtToken = {
  access: string;
  expire: number;
  refresh: string;
}

type JwtTokenStorage = {
  get(): JwtToken | null;
  set(token: JwtToken): void;
  remove(): void;
}

type JwtManagerCreateOptions = {
  tokenStorage: JwtTokenStorage;
  makeRequestForNewToken(accessToken: string, refreshToken: string): Promise<JwtToken | null>;
  logUnexpected?(behavior: UnexpectedBehavior): void;
}

type RequestWithTokenActionResult<T> =
  { ok: true, data: T } |
  { ok: false };
type RequestWithTokenAction<T> = (accessToken: string) => Promise<RequestWithTokenActionResult<T>>;

type RequestWithTokenResult<T> =
  { ok: true, data: T } |
  { ok: false };
export type JwtTokenManager = {
  makeRequestWithToken<T>(action: RequestWithTokenAction<T>): Promise<RequestWithTokenResult<T>>;
}

const emptyFunction = () => {};

export const JwtTokenManager = (options: JwtManagerCreateOptions): JwtTokenManager => {
  const {
    tokenStorage,
    makeRequestForNewToken,
    logUnexpected = emptyFunction
  } = options;

  const requestTokenFromServer = async (oldToken: JwtToken): Promise<string | null> => {
    // Make request to server
    const newServerToken = await makeRequestForNewToken(oldToken.access, oldToken.refresh);
    // Another page can change tokens
    const newLocalStorageToken = tokenStorage.get();

    if (newServerToken === null) {
      if (newLocalStorageToken === null) {
        // User session was end by server and another page delete it from storage
        return null;
      }
      if (newLocalStorageToken.access === oldToken.access) {
        // User session was end by server
        tokenStorage.remove();
        return null;
      }
      if (newLocalStorageToken.expire < Date.now()) {
        logUnexpected(UnexpectedBehavior.TokenFromAnotherPageHasWrongExpired);
        return null;
      }
      return newLocalStorageToken.access;
    }

    if (newLocalStorageToken === null) {
      logUnexpected(UnexpectedBehavior.LocalStorageTokenBecameNull);
    } else if (newLocalStorageToken.access !== oldToken.access) {
      logUnexpected(UnexpectedBehavior.LocalStorageTokenChanged);
      // TODO It happens (opened 2 browser tabs)
    }

    if (newServerToken.expire < Date.now()) {
      logUnexpected(UnexpectedBehavior.TokenFromServerHasWrongExpired);
      return null;
    }

    tokenStorage.set(newServerToken);
    return newServerToken.access;
  };

  const getAccessToken = async (): Promise<string | null> => {
    // Get from local storage
    const token = tokenStorage.get();
    if (token === null) {
      return null;
    }
    if (token.expire > Date.now()) {
      return token.access;
    }

    return requestTokenFromServer(token);
  };

  const accessTokenNotValid = async (accessToken: string): Promise<string | null> => {
    const token = tokenStorage.get();
    if (token === null) {
      return null;
    }
    if (token.access === accessToken) {
      return requestTokenFromServer(token);
    }
    if (token.expire > Date.now()) {
      return token.access;
    }

    logUnexpected(UnexpectedBehavior.LocalStorageTokenChangedButWithWrongExpired);

    return requestTokenFromServer(token);
  };

  const makeRequestWithToken = async <T>(
    action: RequestWithTokenAction<T>
  ): Promise<RequestWithTokenResult<T>> => {
    const accessToken = await getAccessToken();
    if (accessToken === null) {
      return { ok: false };
    }
    const result = await action(accessToken);
    if (result.ok) {
      return { ok: true, data: result.data };
    }
    const newAccessToken = await accessTokenNotValid(accessToken);
    if (newAccessToken === null) {
      return { ok: false };
    }
    const newResult = await action(newAccessToken);
    if (newResult.ok) {
      return { ok: true, data: newResult.data };
    }
    logUnexpected(UnexpectedBehavior.TokenNotValidTwoTimes);
    return { ok: false };
  };

  return {
    makeRequestWithToken,
  };
};
