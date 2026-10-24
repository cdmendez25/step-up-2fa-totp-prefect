/** Une clases CSS ignorando las vacías: cx('btn', isBig && 'btn-lg'). */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
