/**
 * Pinia persist serializer that round-trips `Map` values.
 *
 * The default `JSON.stringify(new Map())` is `"{}"`, which deserializes
 * back to a plain object — then calling `.set()`/`.clear()`/etc on the
 * restored state throws `TypeError: … is not a function`. Every
 * offline-first store here keeps its `pendingChanges` queue as a Map,
 * so they all need this.
 */

import type { PiniaPluginContext, StateTree } from 'pinia'

const MAP_MARKER = '__$map__'

interface MapEnvelope {
  [MAP_MARKER]: Array<[unknown, unknown]>
}

function isMapEnvelope(v: unknown): v is MapEnvelope {
  return typeof v === 'object' && v !== null && MAP_MARKER in v
}

export const mapAwareSerializer = {
  serialize(state: StateTree): string {
    return JSON.stringify(state, (_, value) => {
      if (value instanceof Map) {
        return { [MAP_MARKER]: Array.from(value.entries()) } satisfies MapEnvelope
      }
      return value
    })
  },
  deserialize(raw: string): StateTree {
    return JSON.parse(raw, (_, value) => {
      if (isMapEnvelope(value)) {
        return new Map(value[MAP_MARKER])
      }
      return value
    })
  }
}

/**
 * Returns an `afterHydrate` hook that reinstates the given state keys as
 * fresh `Map`s if localStorage still holds the pre-`mapAwareSerializer`
 * representation (plain object `{}`). Losing stale queued entries here
 * is fine: under the old serializer they had already been collapsed to
 * `{}` on every write, so nothing recoverable is being discarded.
 */
export function rehydrateMapKeys(keys: string[]) {
  return (ctx: PiniaPluginContext) => {
    const store = ctx.store as unknown as Record<string, unknown>
    for (const key of keys) {
      if (!(store[key] instanceof Map)) {
        store[key] = new Map()
      }
    }
  }
}
