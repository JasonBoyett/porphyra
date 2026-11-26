import type { ChurchPermissionSnapshot } from "@porphyra/frontend/api/types"

export type PermissionLevel = {
	churchId: string
	campusId?: string
	teamId?: string
}

/** Client-side presentation cache of backend-computed effective grants. */
export class PermissionStore {
	#snapshots = new Map<string, ChurchPermissionSnapshot>()
	#listeners = new Set<() => void>()

	public replace(snapshot: ChurchPermissionSnapshot) {
		this.#snapshots.set(snapshot.churchId, snapshot)
		this.#notify()
	}

	public clear(churchId?: string) {
		if (churchId === undefined) this.#snapshots.clear()
		else this.#snapshots.delete(churchId)
		this.#notify()
	}

	public subscribe(listener: () => void) {
		this.#listeners.add(listener)
		return () => this.#listeners.delete(listener)
	}

	#notify() {
		for (const listener of this.#listeners) listener()
	}

	public isPermitted(level: PermissionLevel, permission: string) {
		const snapshot = this.#snapshots.get(level.churchId)
		if (snapshot === undefined) return false
		const permissions = new Set(snapshot.permissions)
		const campus = level.campusId === undefined ? undefined : snapshot.campuses[level.campusId]
		for (const permissionName of campus?.permissions ?? []) permissions.add(permissionName)
		const team = level.teamId === undefined ? undefined : campus?.teams[level.teamId]
		for (const permissionName of team?.permissions ?? []) permissions.add(permissionName)
		return permissions.has(permission)
	}
}
