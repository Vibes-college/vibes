import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';
import openapiTS, { astToString } from 'openapi-typescript';
import { removeNeverPropertiesFromAST } from './ast-transformer.js';

test('printed OpenAPI enum types survive the compiler visitor and preserve members', async () => {
	const ast = await openapiTS({
		openapi: '3.1.0', info: { title: 'Regression', version: '1' }, paths: {},
		components: { schemas: { Visibility: { type: 'string', enum: ['public', 'followers', 'private'] } } },
	}, { exportType: true });
	const source = ts.createSourceFile('api.ts', astToString(ast), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
	const filtered = removeNeverPropertiesFromAST(source.statements);
	const result = ts.createPrinter().printFile(ts.factory.updateSourceFile(source, filtered as ts.Statement[]));
	assert.match(result, /"public" \| "followers" \| "private"/);
	assert.ok(!result.includes('undefined'));
});
