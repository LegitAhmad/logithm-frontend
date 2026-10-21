import { ExecutionContract, TestCase, ValueType } from './questions.service';

const identifier = /^[A-Za-z][A-Za-z0-9_]{0,79}$/;

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function schema(value: unknown, path: string, depth = 0): asserts value is ValueType {
  if (depth > 12) throw new Error(`${path}: nesting is too deep.`);
  if (!object(value)) throw new Error(`${path}: expected a type object.`);
  const type = value['type'];
  const allowedKeys = type === 'array' ? ['type', 'items'] : type === 'object' ? ['type', 'properties'] : ['type'];
  if (Object.keys(value).some(key => !allowedKeys.includes(key))) throw new Error(`${path}: unexpected type property.`);
  if (type === 'array') {
    schema(value['items'], `${path}.items`, depth + 1);
  } else if (type === 'object') {
    if (!object(value['properties'])) throw new Error(`${path}.properties: expected an object.`);
    for (const [key, entry] of Object.entries(value['properties'])) schema(entry, `${path}.properties.${key}`, depth + 1);
  } else if (!['string', 'number', 'integer', 'boolean', 'null'].includes(String(type))) {
    throw new Error(`${path}.type: use string, number, integer, boolean, null, array, or object.`);
  }
}

export function validateValue(value: unknown, type: ValueType, path: string): void {
  switch (type.type) {
    case 'null': if (value === null) return; break;
    case 'string': if (typeof value === 'string') return; break;
    case 'boolean': if (typeof value === 'boolean') return; break;
    case 'integer': if (typeof value === 'number' && Number.isSafeInteger(value)) return; break;
    case 'number': if (typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER) return; break;
    case 'array':
      if (Array.isArray(value)) {
        value.forEach((entry, i) => validateValue(entry, type.items, `${path}[${i}]`));
        return;
      }
      break;
    case 'object':
      if (object(value)) {
        for (const key of Object.keys(value)) {
          if (!Object.hasOwn(type.properties, key)) throw new Error(`${path}.${key}: unexpected property.`);
        }
        for (const [key, entry] of Object.entries(type.properties)) {
          if (!Object.hasOwn(value, key)) throw new Error(`${path}.${key}: missing property.`);
          validateValue(value[key], entry, `${path}.${key}`);
        }
        return;
      }
  }
  throw new Error(`${path}: expected ${type.type}.`);
}

export function parseContract(text: string): ExecutionContract {
  const value: unknown = JSON.parse(text);
  if (!object(value) || typeof value['functionName'] !== 'string' || !identifier.test(value['functionName'])) {
    throw new Error('execution.functionName: use a valid function identifier.');
  }
  if (Object.keys(value).some(key => !['functionName', 'parameters', 'returnType'].includes(key))) throw new Error('execution: unexpected property.');
  if (!Array.isArray(value['parameters'])) throw new Error('execution.parameters: expected an array.');
  const names = new Set<string>();
  const parameters: ExecutionContract['parameters'] = [];
  for (const [i, parameter] of value['parameters'].entries()) {
    if (!object(parameter) || typeof parameter['name'] !== 'string' || !identifier.test(parameter['name'])) {
      throw new Error(`execution.parameters[${i}].name: use a valid identifier.`);
    }
    if (Object.keys(parameter).some(key => !['name', 'type'].includes(key))) throw new Error(`execution.parameters[${i}]: unexpected property.`);
    if (names.has(parameter['name'])) throw new Error(`Duplicate parameter: ${parameter['name']}.`);
    names.add(parameter['name']);
    schema(parameter['type'], `execution.parameters[${i}].type`);
    parameters.push({ name: parameter['name'], type: parameter['type'] });
  }
  schema(value['returnType'], 'execution.returnType');
  return { functionName: value['functionName'], parameters, returnType: value['returnType'] };
}

export function parseTestCases(text: string, execution: ExecutionContract): TestCase[] {
  const values: unknown = JSON.parse(text);
  if (!Array.isArray(values) || !values.length) throw new Error('Test cases must be a non-empty JSON array.');
  return values.map((value, i) => {
    const path = `testCases[${i}]`;
    if (!object(value) || !Array.isArray(value['input']) || !Object.hasOwn(value, 'expectedOutput')) {
      throw new Error(`${path}: provide an input arguments array and expectedOutput value.`);
    }
    if (Object.keys(value).some(key => !['input', 'expectedOutput', 'isHidden', 'points'].includes(key))) throw new Error(`${path}: unexpected property.`);
    const input = value['input'];
    if (input.length !== execution.parameters.length) throw new Error(`${path}.input: expected ${execution.parameters.length} arguments.`);
    execution.parameters.forEach((parameter, index) => validateValue(input[index], parameter.type, `${path}.input[${index}]`));
    validateValue(value['expectedOutput'], execution.returnType, `${path}.expectedOutput`);
    if (value['isHidden'] !== undefined && typeof value['isHidden'] !== 'boolean') throw new Error(`${path}.isHidden: expected boolean.`);
    const points = value['points'] ?? 1;
    if (typeof points !== 'number' || !Number.isFinite(points) || points < 1) throw new Error(`${path}.points: expected a number of at least 1.`);
    return { input: JSON.stringify(value['input']), expectedOutput: JSON.stringify(value['expectedOutput']), isHidden: value['isHidden'] === true, points };
  });
}

export function typeLabel(type: ValueType): string {
  if (type.type === 'array') return `${typeLabel(type.items)}[]`;
  if (type.type === 'object') return `{ ${Object.entries(type.properties).map(([name, entry]) => `${JSON.stringify(name)}: ${typeLabel(entry)}`).join(', ')} }`;
  return type.type;
}

export function starterCode(contract: ExecutionContract, language: string): string {
  const parameters = contract.parameters.map(p => p.name);
  if (language === 'python') return `def ${contract.functionName}(${parameters.join(', ')}):\n    # Return ${typeLabel(contract.returnType)}. Do not print the answer.\n    raise NotImplementedError("Write your solution")\n`;
  if (language === 'go') {
    const params = contract.parameters.map(parameter => `${parameter.name} ${goType(parameter.type)}`).join(', ');
    return `package main\n\nfunc ${contract.functionName}(${params}) ${goType(contract.returnType)} {\n    panic("Write your solution")\n}\n`;
  }
  const params = contract.parameters.map(p => language === 'typescript' ? `${p.name}: ${tsType(p.type)}` : p.name).join(', ');
  const result = language === 'typescript' ? `: ${tsType(contract.returnType)}` : '';
  return `function ${contract.functionName}(${params})${result} {\n  // Return ${typeLabel(contract.returnType)}. Do not print the answer.\n  throw new Error("Write your solution");\n}\n`;
}

function tsType(type: ValueType): string {
  if (type.type === 'integer') return 'number';
  if (type.type === 'array') return `Array<${tsType(type.items)}>`;
  if (type.type === 'object') return `{ ${Object.entries(type.properties).map(([name, entry]) => `${JSON.stringify(name)}: ${tsType(entry)}`).join('; ')} }`;
  return type.type;
}

function goType(type: ValueType): string {
  switch (type.type) {
    case 'string': return 'string';
    case 'number': return 'float64';
    case 'integer': return 'int64';
    case 'boolean': return 'bool';
    case 'null': return 'interface{}';
    case 'array': return `[]${goType(type.items)}`;
    case 'object': return `struct { ${Object.entries(type.properties).map(([name, entry], index) => `F${index} ${goType(entry)} ${JSON.stringify(`json:${JSON.stringify(name)}`)}`).join('; ')} }`;
  }
}

export function apiError(error: unknown): string {
  if (object(error) && object(error['error'])) {
    const issues = error['error']['errors'];
    if (Array.isArray(issues)) {
      const messages = issues.filter(object).filter(issue => typeof issue['message'] === 'string').map(issue => {
        const path = Array.isArray(issue['path']) ? issue['path'].join('.') : typeof issue['path'] === 'string' ? issue['path'] : '';
        return `${path ? `${path}: ` : ''}${issue['message']}`;
      });
      if (messages.length) return messages.join('; ');
    }
    const message = error['error']['message'];
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.every(entry => typeof entry === 'string')) return message.join('; ');
  }
  return 'The request failed. Check your connection and try again.';
}
