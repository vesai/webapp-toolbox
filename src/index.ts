export type TestType = {
  a: string;
};

export const test = (x: TestType) => {
  console.log('Hello world', x.a);
};
