export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
};

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["Très faible", "Faible", "Moyen", "Fort", "Très fort"];
  const clamped = Math.min(score, 4) as PasswordStrength["score"];
  return { score: clamped, label: labels[clamped] };
}
