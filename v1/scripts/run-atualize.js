// Wrapper para executar o script TypeScript 'atualize.ts' sem passar pelo CLI do ts-node
require('ts-node/register/transpile-only');
require('./atualize.ts');
