// Wrapper para executar o script de autenticação Google Drive sem checagem de tipos
// Usa transpile-only para evitar erros de parsing/TS durante execução local
require('ts-node/register/transpile-only');
require('./google-drive-auth.ts');
