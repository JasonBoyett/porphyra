const isComputedText = (node) => node.type === "JSXIdentifier" && node.name === "ComputedText"

const isStaticString = (node) =>
	(node.type === "Literal" && typeof node.value === "string") ||
	(node.type === "TemplateLiteral" && node.expressions.length === 0)

export const noStaticComputedText = {
	meta: {
		docs: {
			description: "require Localized for static user-facing copy",
		},
		messages: {
			staticValue:
				"Static user-facing copy must use Localized. ComputedText values must be derived at runtime.",
		},
		type: "problem",
	},
	create(context) {
		return {
			JSXOpeningElement(node) {
				if (!isComputedText(node.name)) return
				const valueAttribute = node.attributes.find(
					(attribute) => attribute.type === "JSXAttribute" && attribute.name.name === "value",
				)
				if (valueAttribute?.type !== "JSXAttribute" || valueAttribute.value === null) return

				const value =
					valueAttribute.value.type === "JSXExpressionContainer"
						? valueAttribute.value.expression
						: valueAttribute.value
				if (isStaticString(value))
					context.report({ messageId: "staticValue", node: valueAttribute })
			},
		}
	},
}
