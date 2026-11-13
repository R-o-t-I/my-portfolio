/* Склонение существительных после числительных. */
export function pluralize(
  number: number,
  one: string,
  two: string,
  many: string,
): string {
  const absNumber = Math.abs(number);
  const digit = absNumber % 10;
  const lastTwoDigits = absNumber % 100;

  if (digit === 1 && lastTwoDigits !== 11) {
    return one;
  }

  if (digit >= 2 && digit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return two;
  }

  return many;
}
