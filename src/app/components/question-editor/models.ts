export type OutputType = 'string' | 'number' | 'array' | 'map' | 'json' | 'function';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: any;
}

export interface Question {
  title: string;
  description: string;
  outputType: OutputType;
  functionLanguage?: string;
  testCases: TestCase[];
}
