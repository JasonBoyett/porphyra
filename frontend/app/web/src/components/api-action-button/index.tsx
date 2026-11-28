import { useState, useSyncExternalStore } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { ApiActionButtonProps } from "./types"

export const ApiActionButton = <TArgs, TResult>(props: ApiActionButtonProps<TArgs, TResult>) => {
	const {
		action,
		args,
		children,
		deniedBehavior = "hide",
		onError,
		onSuccess,
		disabled,
		...buttonProps
	} = props
	const [pending, setPending] = useState(false)
	useSyncExternalStore(action.subscribe ?? (() => () => {}), () => action.permitted)

	if (!action.permitted && deniedBehavior === "hide") return null
	return (
		<Button
			aria-busy={pending || undefined}
			disabled={disabled || pending || !action.permitted}
			onClick={() => {
				if (pending || !action.permitted) return
				setPending(true)
				void action
					.action(args)
					.then(onSuccess)
					.catch((error: unknown) => {
						onError?.(error)
						if (onError === undefined) toast.error("The action could not be completed. Try again.")
					})
					.finally(() => setPending(false))
			}}
			{...buttonProps}
		>
			{children}
		</Button>
	)
}
