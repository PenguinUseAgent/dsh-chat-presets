/**
 * Conversation-only guard for the `chat` and `chat2` presets.
 *
 * Those presets mount no tool plugin of their own, but host-level rows such as
 * `working_directory` are inherited by every session. `restrict` intersects
 * with other masks and filters only the inherited surface, so denying every
 * inherited tool leaves each preset's sessions with no callable tool at all.
 * Tools registered later are denied as they appear.
 *
 * The same module is mounted once per preset, in that preset's own scope, so
 * the presets do not affect each other.
 */

/** Cordis plugin name. */
export const name = 'chat-no-tools'

/** The registry this row narrows; without it there is nothing to restrict. */
export const inject = ['tools']

/**
 * Deny each inherited tool once, and keep denying tools registered later.
 * @param ctx - the preset scope every session under this preset inherits from.
 */
export function apply(ctx) {
  const denied = new Set()
  const lifts = []

  const denyNew = () => {
    const fresh = []
    for (const schema of ctx.tools.schemas()) {
      const toolName = schema?.name
      if (typeof toolName !== 'string' || toolName === '' || denied.has(toolName)) continue
      fresh.push(toolName)
    }
    for (const toolName of fresh) {
      lifts.push(ctx.tools.restrict({ deny: [toolName] }))
      denied.add(toolName)
    }
  }

  const attempt = (what) => {
    try {
      denyNew()
    } catch (error) {
      ctx.logger?.warn?.(`[chat-no-tools] could not deny ${what}`, error)
    }
  }

  ctx.effect(() => {
    attempt('inherited tools')
    const off = ctx.on('tools/change', () => attempt('a newly registered tool'))
    return () => {
      off()
      for (const lift of lifts) lift()
    }
  }, 'chat-no-tools')
}
