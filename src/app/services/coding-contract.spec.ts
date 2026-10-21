import { describe, expect, it } from 'vitest';
import { parseContract, parseTestCases, validateValue } from './coding-contract';
import { ExecutionContract, ValueType } from './questions.service';

const execution: ExecutionContract = { functionName: 'identity', parameters: [{ name: 'value', type: { type: 'integer' } }], returnType: { type: 'integer' } };

describe('teacher test case authoring', () => {
  it('preserves zero, false, null, empty strings, and nested values without string coercion', () => {
    for (const [value, type] of [[0, { type: 'integer' }], [false, { type: 'boolean' }], [null, { type: 'null' }], ['', { type: 'string' }], [[], { type: 'array', items: { type: 'integer' } }]] as Array<[unknown, ValueType]>) {
      const contract: ExecutionContract = { functionName: 'identity', parameters: [{ name: 'value', type }], returnType: type };
      const [test] = parseTestCases(JSON.stringify([{ input: [value], expectedOutput: value }]), contract);
      expect(JSON.parse(test.input)).toEqual([value]);
      expect(JSON.parse(test.expectedOutput)).toEqual(value);
    }
  });

  it('rejects a malformed later test, not just the first', () => {
    expect(() => parseTestCases(JSON.stringify([{ input: [2], expectedOutput: 2 }, { input: ['2'], expectedOutput: 2 }]), execution)).toThrow('testCases[1].input[0]: expected integer');
  });

  it('requires argument arrays of the declared arity', () => {
    expect(() => parseTestCases('[{"input":2,"expectedOutput":2}]', execution)).toThrow('input arguments array');
    expect(() => parseTestCases('[{"input":[],"expectedOutput":2}]', execution)).toThrow('expected 1 arguments');
  });

  it('rejects missing results and invalid visibility or points', () => {
    expect(() => parseTestCases('[{"input":[1]}]', execution)).toThrow('expectedOutput');
    expect(() => parseTestCases('[{"input":[1],"expectedOutput":1,"isHidden":"false"}]', execution)).toThrow('isHidden');
    expect(() => parseTestCases('[{"input":[1],"expectedOutput":1,"points":0}]', execution)).toThrow('points');
  });
});

describe('typed function contracts', () => {
  it('rejects duplicate parameter names and unknown types', () => {
    expect(() => parseContract('{"functionName":"f","parameters":[{"name":"x","type":{"type":"integer"}},{"name":"x","type":{"type":"integer"}}],"returnType":{"type":"integer"}}')).toThrow('Duplicate parameter');
    expect(() => parseContract('{"functionName":"f","parameters":[],"returnType":{"type":"int"}}')).toThrow('returnType.type');
  });

  it('reports nested array paths and missing or extra object properties', () => {
    const type: ValueType = { type: 'object', properties: { values: { type: 'array', items: { type: 'integer' } } } };
    expect(() => validateValue({ values: [1, false] }, type, 'return')).toThrow('return.values[1]: expected integer');
    expect(() => validateValue({}, type, 'return')).toThrow('return.values: missing property');
    expect(() => validateValue({ values: [], extra: 1 }, type, 'return')).toThrow('return.extra: unexpected property');
  });

  it('rejects nonfinite and unsafe numeric values', () => {
    expect(() => validateValue(Infinity, { type: 'number' }, 'return')).toThrow('expected number');
    expect(() => validateValue(Number.MAX_SAFE_INTEGER + 1, { type: 'integer' }, 'return')).toThrow('expected integer');
    expect(() => validateValue(true, { type: 'number' }, 'return')).toThrow('expected number');
  });
});
