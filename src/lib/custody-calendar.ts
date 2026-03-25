/**
 * Custody Calendar — střídavá péče 9/5
 * Based on OS Hodonín ruling (0 Nc 682/2023)
 *
 * Rule: Odd Tuesday 8:00 → mother (9 days)
 *       Even Thursday 8:00 → father (5 days)
 * Odd/Even = ISO week number in the year
 */

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export type Guardian = 'father' | 'mother';

export interface CustodyInfo {
  guardian: Guardian;
  dogName: string;
  dogNicknames: string[];
  daysUntilSwitch: number;
  nextSwitchDate: Date;
}

/**
 * Get all transition dates for a given year
 */
function getTransitions(year: number): { date: Date; guardian: Guardian }[] {
  const transitions: { date: Date; guardian: Guardian }[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const week = getISOWeek(d);
    const isOdd = week % 2 === 1;
    const dow = d.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu

    if (isOdd && dow === 2) {
      // Odd Tuesday → to mother
      transitions.push({ date: new Date(d), guardian: 'mother' });
    } else if (!isOdd && dow === 4) {
      // Even Thursday → to father
      transitions.push({ date: new Date(d), guardian: 'father' });
    }
  }

  return transitions;
}

/**
 * Determine which parent has custody on a given date
 */
export function getGuardian(date: Date = new Date()): Guardian {
  const year = date.getFullYear();
  // Get transitions for current and previous year (for Jan edge cases)
  const transitions = [...getTransitions(year - 1), ...getTransitions(year)];

  let guardian: Guardian = 'mother'; // default
  for (const t of transitions) {
    if (t.date <= date) {
      guardian = t.guardian;
    } else {
      break;
    }
  }

  return guardian;
}

/**
 * Get full custody context for AI
 */
export function getCustodyInfo(date: Date = new Date()): CustodyInfo {
  const guardian = getGuardian(date);
  const year = date.getFullYear();
  const transitions = [...getTransitions(year), ...getTransitions(year + 1)];

  // Find next switch
  let nextSwitch = transitions.find(t => t.date > date && t.guardian !== guardian);
  if (!nextSwitch) {
    nextSwitch = { date: new Date(date.getTime() + 5 * 86400000), guardian: guardian === 'father' ? 'mother' : 'father' };
  }

  const daysUntil = Math.ceil((nextSwitch.date.getTime() - date.getTime()) / 86400000);

  return {
    guardian,
    dogName: guardian === 'father' ? 'Sakio' : 'Poppy',
    dogNicknames: guardian === 'father'
      ? ['Saki', 'Sakísek', 'Sakísko']
      : ['Poppinka', 'Poppy'],
    daysUntilSwitch: daysUntil,
    nextSwitchDate: nextSwitch.date,
  };
}

/**
 * Get dog name for AI prompt (random nickname)
 */
export function getDogNickname(guardian?: Guardian): string {
  const g = guardian || getGuardian();
  const nicknames = g === 'father'
    ? ['Sakísek', 'Saki', 'Sakísko']
    : ['Poppinka', 'Poppy'];
  return nicknames[Math.floor(Math.random() * nicknames.length)];
}

/**
 * Get family context string for AI prompt
 */
export function getFamilyContext(date: Date = new Date()): string {
  const info = getCustodyInfo(date);
  const atFather = info.guardian === 'father';

  return `Viki je teď u ${atFather ? 'TÁTY (Vlastimil)' : 'MÁMY'}.
${atFather ? 'U táty je taky Domča (tátova manželka) a malá Olivka (sestřička, miminko).' : ''}
Pes: ${info.dogName} (${info.dogNicknames.join(', ')}).
Za ${info.daysUntilSwitch} dní se stěhuje k ${atFather ? 'mamce' : 'tátovi'}.`;
}
