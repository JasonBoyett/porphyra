import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dir, "..");
const apiDirectory = resolve(repositoryRoot, "server/api");
const openApiPath = resolve(
	repositoryRoot,
	process.env.PORPHYRA_OPENAPI_PATH ?? "server/api/openapi/v1.json",
);
const generatedDirectory = resolve(
	repositoryRoot,
	"frontend/lib/api/generated",
);
const openApiTypesPath = resolve(generatedDirectory, "openapi.d.ts");
const namedTypesPath = resolve(generatedDirectory, "types.ts");
const operationsPath = resolve(generatedDirectory, "operations.ts");
const httpMethods = ["delete", "get", "patch", "post", "put"] as const;

const syncTagsForOperation = (
	operation: Record<string, unknown>,
	operationId: string,
) => {
	const syncTags = operation["x-sync-tags"];
	if (syncTags === undefined) return [];
	if (
		!Array.isArray(syncTags) ||
		syncTags.some((tag) => typeof tag !== "string" || tag.length === 0)
	) {
		throw new Error(
			`x-sync-tags for ${operationId} must be an array of non-empty strings`,
		);
	}
	return [...new Set(syncTags)];
};

const generateOpenApiDocument = () => {
	const document = execFileSync(
		"uv",
		[
			"run",
			"python",
			"-c",
			"import json; from app.main import create_app; print(json.dumps(create_app().openapi(), indent=2))",
		],
		{ cwd: apiDirectory, encoding: "utf8" },
	);
	mkdirSync(dirname(openApiPath), { recursive: true });
	writeFileSync(openApiPath, document);
};

if (process.env.PORPHYRA_OPENAPI_PATH === undefined) generateOpenApiDocument();

mkdirSync(generatedDirectory, { recursive: true });
execFileSync(
	"bunx",
	["--bun", "openapi-typescript", openApiPath, "-o", openApiTypesPath],
	{
		cwd: repositoryRoot,
		stdio: "inherit",
	},
);

const openApi = JSON.parse(readFileSync(openApiPath, "utf8")) as {
	components?: { schemas?: Record<string, unknown> };
	paths?: Record<string, Record<string, Record<string, unknown>>>;
};
const schemaNames = Object.keys(openApi.components?.schemas ?? {}).sort();
const operationEntries = Object.entries(openApi.paths ?? {}).flatMap(
	([route, pathItem]) =>
		httpMethods.flatMap((method) => {
			const operation = pathItem[method];
			if (
				operation?.operationId === undefined ||
				typeof operation.operationId !== "string"
			)
				return [];

			const parameters = [
				...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []),
				...(Array.isArray(operation.parameters) ? operation.parameters : []),
			] as Array<Record<string, unknown>>;
			const parameterNames = (location: "path" | "query") =>
				parameters
					.filter(
						(parameter) =>
							parameter.in === location && typeof parameter.name === "string",
					)
					.map((parameter) => parameter.name);
			return [
				[
					operation.operationId,
					{
					method,
					hasBody: operation.requestBody !== undefined,
					pathParams: parameterNames("path"),
					queryParams: parameterNames("query"),
					requestContentType: operation.requestBody === undefined
						? null
						: Object.hasOwn(operation.requestBody, "content") &&
							Object.hasOwn(
								(operation.requestBody.content as Record<string, unknown>),
								"application/json",
							)
							? "application/json"
							: null,
						route,
						syncTags: syncTagsForOperation(operation, operation.operationId),
					},
				],
			];
		}),
);
const syncTags = [
	...new Set(operationEntries.flatMap(([, operation]) => operation.syncTags)),
];

writeFileSync(
	namedTypesPath,
	`/**
 * This file was auto-generated from the Porphyra OpenAPI schemas.
 * Do not make direct changes to this file.
 */

import type { components, operations, paths } from "./openapi"

export type { components, operations, paths }

export type ApiRoute = keyof paths
export type ApiOperationId = keyof operations
export type ApiSuccessStatus = 200 | 201 | 202 | 204
export type ApiJsonResponse<TResponse> = TResponse extends {
	content: { "application/json": infer TData }
}
	? TData
	: void
export type ApiOperationResponse<TOperationId extends ApiOperationId> =
	operations[TOperationId] extends { responses: infer TResponses }
		? TResponses extends Record<number, unknown>
			? ApiJsonResponse<TResponses[Extract<keyof TResponses, ApiSuccessStatus>]>
			: never
		: never
export type ApiOperationRequest<TOperationId extends ApiOperationId> =
	operations[TOperationId] extends {
		requestBody: { content: { "application/json": infer TData } }
	}
		? TData
		: never
export type ApiOperationPath<TOperationId extends ApiOperationId> =
	operations[TOperationId] extends { parameters: { path: infer TData } }
		? TData
		: never
export type ApiOperationQuery<TOperationId extends ApiOperationId> =
	operations[TOperationId] extends { parameters: { query?: infer TData } }
		? NonNullable<TData>
		: never
type ApiOperationDataPart<TData> = [TData] extends [never] ? {} : TData
export type ApiOperationInput<TOperationId extends ApiOperationId> =
	ApiOperationDataPart<ApiOperationPath<TOperationId>> &
	ApiOperationDataPart<ApiOperationQuery<TOperationId>> &
	ApiOperationDataPart<ApiOperationRequest<TOperationId>>

${schemaNames
	.map(
		(schemaName) =>
			`export type ${schemaName} = components["schemas"]["${schemaName}"]`,
	)
	.join("\n")}
`,
);

writeFileSync(
	operationsPath,
	`/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Do not make direct changes to this file.
 */

export const apiOperations = ${JSON.stringify(Object.fromEntries(operationEntries), null, 2)} as const

export const apiSyncTags = ${JSON.stringify(syncTags)} as const
export type ApiSyncTag = (typeof apiOperations)[keyof typeof apiOperations]["syncTags"][number]
`,
);

execFileSync("bunx", ["prettier", "--write", namedTypesPath, operationsPath], {
	cwd: repositoryRoot,
	stdio: "inherit",
});
