export class SyncTagManager {
  private readonly _activeTags = new Map<string, number>()

  public add(tags: readonly string[]) {
    for (const tag of tags)
      this._activeTags.set(tag, (this._activeTags.get(tag) ?? 0) + 1)
  }

  public remove(tags: readonly string[]) {
    for (const tag of tags) {
      const count = this._activeTags.get(tag) ?? 0
      if (count <= 1) this._activeTags.delete(tag)
      else this._activeTags.set(tag, count - 1)
    }
  }

  public has(tag: string) {
    return this._activeTags.has(tag)
  }
}
