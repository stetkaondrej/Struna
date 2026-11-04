// Rodičovský PIN. Ukládá se jen otisk (SHA-256), ne samotná čísla.
export const isValidPin = (pin) => /^\d{4}$/.test(pin);

export async function hashPin(pin) {
  const data = new TextEncoder().encode(`struna-pin:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function checkPin(pin, hash) {
  return Boolean(hash) && isValidPin(pin) && (await hashPin(pin)) === hash;
}

// Otázka pro „Zapomněl jsem PIN“: násobení dvou dvojciferných čísel (pro dítě aspoň malá překážka).
export function resetQuestion(random = Math.random) {
  const a = 23 + Math.floor(random() * 70);
  const b = 13 + Math.floor(random() * 80);
  return { a, b, answer: a * b };
}
