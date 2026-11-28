import { createFileRoute } from "@tanstack/react-router"

import { Kiosk } from "@/components/kiosk"
import { LocalizationScope, useLocalizedString } from "@/localization"

export const Route = createFileRoute("/_authenticated/app/kiosk")({
	component: KioskRoute,
})

function KioskRoute() {
	return (
		<LocalizationScope name="kiosk">
			<KioskContent />
		</LocalizationScope>
	)
}

function KioskContent() {
	const { text: description } = useLocalizedString("kiosk.description")
	const { text: title } = useLocalizedString("kiosk.title")

	return <Kiosk description={description} title={title} />
}
