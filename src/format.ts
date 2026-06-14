export function formatProgress(current: number, total: number) {
  let percent = (current / total) * 100
  return `${current}/${total} (${percent.toFixed(2)}%)`
}
