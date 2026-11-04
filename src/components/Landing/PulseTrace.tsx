// One heartbeat-style blip; dy sums to zero so the pattern can repeat on a baseline.
const BEAT = 'h80 l10 -8 l10 8 h20 l8 22 l14 -96 l14 112 l10 -38 h86'
const PATH = `M0 120 h120 ${BEAT} ${BEAT} ${BEAT} ${BEAT} h72`

/** The brand's signature line: drawn once, then a pulse of light keeps travelling along it. */
export function PulseTrace() {
  return (
    <svg className="trace" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
      <path className="trace__line" d={PATH} pathLength={1} />
      <path className="trace__comet" d={PATH} pathLength={1} />
    </svg>
  )
}
