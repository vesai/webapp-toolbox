# Simple client-server interaction RemoteFunctionCalls

## Example

### Common file
For example *./common.ts*
```ts
type Api = {
  login(login: string, password: string): Promise<string | null>;
};
const API_PATH = '/api';
```

### Server side
```ts
import * as express from 'express';
import { RemoteFunctionCalls } from 'webapp-toolbox';

import { Api, API_PATH } from './common';

const app = express();
app.use(express.json()));

type Tools = {
  dataBase: {};
  getSomethingFromRequest(): string;
}

const rfcServer = RemoteFunctionCalls.Server<Api, Tools>({
  async login(tools: Tools, login: string, password: string): Promise<string | null> {
    // await tools.dataBase do something
    return null;
  }
});

app.post(`${API_PATH}/:functionName`, async (req, res) => {
  const tools = {
    dataBase: {},
    getSomethingFromRequest() {
      return req.something;
    }
  };
  const result = await rfcServer(req.params.functionName, req.body, tools);
  res.json(result);
});

app.listen(3000, 'localhost');
```

### Client side
```ts
import { RemoteFunctionCalls } from 'webapp-toolbox';

import { Api, API_PATH } from './common';

export const api = RemoteFunctionCalls.Client<Api>(async (path: string, data: any) => {
  const request = await fetch(`${API_PATH}/${path}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  return await request.json();
});

// Then usage
const key = await api.login('login', 'password');
if (key === null) {
  alert('Incorrect login or password');
} else {
  localStorage.set('apiUserKey', key);
}
```
