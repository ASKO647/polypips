export function getDefaultLaunchDeadline() {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 20);
  deadline.setHours(deadline.getHours() + 14, deadline.getMinutes() + 37, 22, 0);
  return deadline;
}
