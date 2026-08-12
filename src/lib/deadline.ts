/**
 * Single, fixed countdown target for the whole site. Computed once (at
 * module load) rather than as "now + 20 days" on every call - every
 * Countdown instance (announcement bar, pricing card, signup offer card)
 * must read the exact same end time, not its own independently-drifting
 * one.
 */
const LAUNCH_DEADLINE = (() => {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 20);
  deadline.setHours(deadline.getHours() + 14, deadline.getMinutes() + 37, 22, 0);
  return deadline;
})();

export function getDefaultLaunchDeadline() {
  return LAUNCH_DEADLINE;
}
