const SIGNS: { sign: string; month: number; day: number }[] = [
  { sign: 'Capricorn', month: 1,  day: 19 },
  { sign: 'Aquarius',  month: 2,  day: 18 },
  { sign: 'Pisces',    month: 3,  day: 20 },
  { sign: 'Aries',     month: 4,  day: 19 },
  { sign: 'Taurus',    month: 5,  day: 20 },
  { sign: 'Gemini',    month: 6,  day: 20 },
  { sign: 'Cancer',    month: 7,  day: 22 },
  { sign: 'Leo',       month: 8,  day: 22 },
  { sign: 'Virgo',     month: 9,  day: 22 },
  { sign: 'Libra',     month: 10, day: 22 },
  { sign: 'Scorpio',   month: 11, day: 21 },
  { sign: 'Sagittarius', month: 12, day: 21 },
  { sign: 'Capricorn', month: 12, day: 31 },
]

export function getZodiacSign(dateOfBirth: Date): string {
  const month = dateOfBirth.getMonth() + 1
  const day = dateOfBirth.getDate()
  for (const { sign, month: m, day: d } of SIGNS) {
    if (month < m || (month === m && day <= d)) return sign
  }
  return 'Capricorn'
}
