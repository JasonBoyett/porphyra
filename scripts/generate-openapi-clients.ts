import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const webMockOperationsDirectory = resolve(
	repositoryRoot,
	"frontend/app/web/src/test/mocks/api/operations",
);
const webMockTransportPath = resolve(
	repositoryRoot,
	"frontend/app/web/src/test/mocks/api/transport.ts",
);
const httpMethods = ["delete", "get", "patch", "post", "put"] as const;

const mockOperationFileName = (operationId: string) =>
	`${operationId.replace(/[^a-zA-Z0-9_-]/g, "_")}.ts`;

const mockOperationStub = (operationId: string) =>
	`/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"

export const mockOperation: ApiClientTransport[${JSON.stringify(operationId)}] = async () => {
	throw new Error(${JSON.stringify(
		`Mock implementation for ${operationId} is not implemented.`,
	)})
}
`;

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

type SyncResourceView = {
	tag: string;
	path: string;
	identity: string[];
};

type SyncQueryTarget = {
	tag: string;
	identity: Record<string, string>;
};

const syncResourceViewsForOperation = (
	operation: Record<string, unknown>,
	operationId: string,
): SyncResourceView[] => {
	const views = operation["x-sync-resource-views"];
	if (views === undefined) return [];
	if (!Array.isArray(views)) {
		throw new Error(`x-sync-resource-views for ${operationId} must be an array`);
	}
	return views.map((view) => {
		if (typeof view !== "object" || view === null || Array.isArray(view)) {
			throw new Error(`Invalid sync resource view for ${operationId}`);
		}
		const candidate = view as Partial<SyncResourceView>;
		if (
			typeof candidate.tag !== "string" ||
			typeof candidate.path !== "string" ||
			!Array.isArray(candidate.identity) ||
			candidate.identity.some((field) => typeof field !== "string")
		) {
			throw new Error(`Invalid sync resource view for ${operationId}`);
		}
		return { tag: candidate.tag, path: candidate.path, identity: candidate.identity };
	});
};

const syncQueryTargetsForOperation = (
	operation: Record<string, unknown>,
	operationId: string,
): SyncQueryTarget[] => {
	const targets = operation["x-sync-query-targets"];
	if (targets === undefined) return [];
	if (!Array.isArray(targets)) {
		throw new Error(`x-sync-query-targets for ${operationId} must be an array`);
	}
	return targets.map((target) => {
		if (typeof target !== "object" || target === null || Array.isArray(target)) {
			throw new Error(`Invalid sync query target for ${operationId}`);
		}
		const candidate = target as Partial<SyncQueryTarget>;
		if (
			typeof candidate.tag !== "string" ||
			typeof candidate.identity !== "object" ||
			candidate.identity === null ||
			Object.values(candidate.identity).some((value) => typeof value !== "string")
		) {
			throw new Error(`Invalid sync query target for ${operationId}`);
		}
		return { tag: candidate.tag, identity: candidate.identity };
	});
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
	"x-sync-resources"?: unknown;
};
if (
	openApi["x-sync-resources"] !== undefined &&
	!Array.isArray(openApi["x-sync-resources"])
) {
	throw new Error("x-sync-resources must be an array");
}
const syncResources = openApi["x-sync-resources"] ?? [];
const resourceActionTypes = syncResources
	.filter(
		(resource): resource is {
			kind: "resource";
			tag: string;
			actions: Array<{
				name: string;
				operationId: string;
				parameterBindings: Record<string, string>;
			}>;
		} =>
			typeof resource === "object" &&
			resource !== null &&
			(resource as { kind?: unknown }).kind === "resource" &&
			typeof (resource as { tag?: unknown }).tag === "string" &&
			Array.isArray((resource as { actions?: unknown }).actions),
	)
	.map(
		(resource) =>
			`TTag extends ${JSON.stringify(resource.tag)} ? {\n${resource.actions
				.map(
					(action) =>
						`\t${action.name}: ApiSyncResourceActionMethod<${JSON.stringify(action.operationId)}, ${
							Object.keys(action.parameterBindings).length === 0
								? "never"
								: Object.keys(action.parameterBindings)
										.map((parameter) => JSON.stringify(parameter))
										.join(" | ")
						}>`,
				)
				.join("\n")}\n} :`,
	)
	.join("\n\t");
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
						syncResourceViews: syncResourceViewsForOperation(
							operation,
							operation.operationId,
						),
						syncQueryTargets: syncQueryTargetsForOperation(
							operation,
							operation.operationId,
						),
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

type ApiSyncResourceActionMethod<
	TOperationId extends ApiOperationId,
	TBoundParameter extends PropertyKey,
> = keyof Omit<ApiOperationInput<TOperationId>, TBoundParameter> extends never
	? () => Promise<ApiOperationResponse<TOperationId>>
	: (
		input: Omit<ApiOperationInput<TOperationId>, TBoundParameter>,
	) => Promise<ApiOperationResponse<TOperationId>>

${schemaNames
	.map(
		(schemaName) =>
			`export type ${schemaName} = components["schemas"]["${schemaName}"]`,
	)
	.join("\n")}

export type ApiSyncResourceActionMethods<TTag extends string> =
	${resourceActionTypes || "{}"} {}
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

export const apiSyncResources = ${JSON.stringify(syncResources, null, 2)} as const
`,
);

mkdirSync(webMockOperationsDirectory, { recursive: true });
const mockOperationFiles = new Map<string, string>();
for (const [operationId] of operationEntries) {
	const fileName = mockOperationFileName(operationId);
	const existingOperationId = mockOperationFiles.get(fileName);
	if (existingOperationId !== undefined) {
		throw new Error(
			`Mock operation file name collision: ${existingOperationId} and ${operationId}`,
		);
	}
	mockOperationFiles.set(fileName, operationId);

	const stubPath = resolve(webMockOperationsDirectory, fileName);
	const generatedStub = mockOperationStub(operationId);
	if (!existsSync(stubPath) || readFileSync(stubPath, "utf8") === generatedStub) {
		writeFileSync(stubPath, generatedStub);
	}
}

const mockOperationImports = operationEntries
	.map(
		([operationId], index) =>
			`import { mockOperation as mockOperation${index} } from "./operations/${mockOperationFileName(operationId).replace(/\.ts$/, "")}"`,
	)
	.join("\n");
const mockTransportMembers = operationEntries
	.map(
		([operationId], index) => `\t${JSON.stringify(operationId)}: mockOperation${index},`,
	)
	.join("\n");
writeFileSync(
	webMockTransportPath,
	`/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Do not make direct changes to this file.
 */

import type { ApiClientTransport } from "@/api/client-types";
${mockOperationImports}

export const mockApiClientTransport: ApiClientTransport = {
${mockTransportMembers}
}
`,
);

execFileSync(
	"bunx",
	[
		"prettier",
		"--write",
		namedTypesPath,
		operationsPath,
		webMockTransportPath,
		...Array.from(mockOperationFiles.keys()).map((fileName) =>
			resolve(webMockOperationsDirectory, fileName),
		),
	],
	{
	cwd: repositoryRoot,
	stdio: "inherit",
	},
);
