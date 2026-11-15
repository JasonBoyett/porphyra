import { AlertCircle, LogIn } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { AuthProps } from "./types"

export const Auth = ({ email, error, onEmailChange, onSignIn }: AuthProps) => (
	<main className="flex min-h-screen items-center justify-center p-6">
		<section className="porphyra-card grid w-full max-w-110 gap-6 rounded-[1.4rem] p-8 shadow-lg">
			<div>
				<p className="mb-3 text-xs font-extrabold tracking-[0.12em] text-primary uppercase">
					Welcome to Porphyra
				</p>
				<h1 className="font-serif text-4xl leading-none">Sign in to serve your church.</h1>
				<p className="mt-4 leading-6 text-muted-foreground">
					Use the seeded development account to explore church, campus, ministry, and team
					workspaces.
				</p>
			</div>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="email">Email</FieldLabel>
					<Input
						id="email"
						onChange={(event) => onEmailChange(event.target.value)}
						type="email"
						value={email}
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor="password">Password</FieldLabel>
					<Input defaultValue="password" id="password" type="password" />
				</Field>
			</FieldGroup>
			{error && (
				<Alert variant="destructive">
					<AlertCircle />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<Button onClick={onSignIn} size="lg">
				<LogIn data-icon="inline-start" />
				Continue to Porphyra
			</Button>
			<Button className="justify-self-start" onClick={onSignIn} variant="link">
				Need an account? Create one
			</Button>
		</section>
	</main>
)
