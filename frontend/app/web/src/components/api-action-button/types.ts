import type { ComponentProps, ReactNode } from "react"

export type ApiAction<TArgs, TResult> = {
	permitted: boolean
	action: (args: TArgs) => Promise<TResult>
	subscribe?: (listener: () => void) => () => void
}

export type ApiActionButtonProps<TArgs, TResult> = Omit<
	ComponentProps<"button">,
	"children" | "onClick"
> & {
	action: ApiAction<TArgs, TResult>
	args: TArgs
	children: ReactNode
	deniedBehavior?: "disable" | "hide"
	onSuccess?: (result: TResult) => void
	onError?: (error: unknown) => void
}
