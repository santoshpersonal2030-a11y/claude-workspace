// Converts a whole-rupee amount to Indian-system words, e.g.
// amountInWords(1230) -> "Rupees One Thousand Two Hundred Thirty Only".

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigit(n: number): string {
  return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : "");
}

function threeDigit(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return (
    (h ? `${ONES[h]} Hundred${r ? " " : ""}` : "") + (r ? twoDigit(r) : "")
  );
}

function inWords(num: number): string {
  if (num <= 0) return "Zero";
  let result = "";
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  if (crore) result += `${twoDigit(crore)} Crore `;
  if (lakh) result += `${twoDigit(lakh)} Lakh `;
  if (thousand) result += `${twoDigit(thousand)} Thousand `;
  if (num) result += `${threeDigit(num)} `;
  return result.trim();
}

export function amountInWords(rupees: number): string {
  return `Rupees ${inWords(Math.round(rupees))} Only`;
}
