import { Button } from "@/components/ui/button"
import { ComputedText, Localized, LocalizationScope } from "@/localization"
import type { KioskProps } from "./types"

export const Kiosk = ({ description, title }: KioskProps) => (
	<LocalizationScope name="kiosk">
		<section className="branded-gradient-panel mx-auto mt-8 max-w-310 rounded-[1.4rem] p-8 text-[oklch(0.98_0.008_320)]">
			<p className="mb-3 text-xs font-extrabold tracking-[0.12em] text-[oklch(0.9_0.045_320)] uppercase">
				<Localized str="kiosk.workspace" />
			</p>
			<h2 className="font-serif text-3xl">
				<ComputedText value={title} />
			</h2>
			<p className="mt-4 max-w-150 text-[oklch(0.9_0.035_320)]">
				<ComputedText value={description} />
			</p>
			<Button className="mt-6" variant="secondary">
				<Localized str="kiosk.open" values={{ title }} />
			</Button>
		</section>
	</LocalizationScope>
)
