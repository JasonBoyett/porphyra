import { Button } from "@/components/ui/button"
import type { KioskProps } from "./types"

export const Kiosk = ({ description, title }: KioskProps) => (
	<section className="branded-gradient-panel mx-auto mt-8 max-w-310 rounded-[1.4rem] p-8 text-[oklch(0.98_0.008_320)]">
		<p className="mb-3 text-xs font-extrabold tracking-[0.12em] text-[oklch(0.9_0.045_320)] uppercase">
			Web workspace
		</p>
		<h2 className="font-serif text-3xl">{title}</h2>
		<p className="mt-4 max-w-150 text-[oklch(0.9_0.035_320)]">{description}</p>
		<Button className="mt-6" variant="secondary">
			Open {title}
		</Button>
	</section>
)
