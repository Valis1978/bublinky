// Procedural math problem generator for 4th grade (4. třída ZŠ)

export type MathOperation = 'add' | 'subtract' | 'multiply' | 'divide';
export type MathDifficulty = 1 | 2 | 3;

export interface MathProblem {
  id: string;
  question: string;       // "7 × 8 = ?"
  answer: number;
  options: number[];       // 4 choices (including correct)
  operation: MathOperation;
  difficulty: MathDifficulty;
  hint?: string;
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateWrongAnswers(correct: number, count: number): number[] {
  const wrongs = new Set<number>();
  const range = Math.max(10, Math.abs(correct));

  while (wrongs.size < count) {
    let wrong: number;
    const r = Math.random();
    if (r < 0.3) {
      // Close to correct
      wrong = correct + rand(-3, 3);
    } else if (r < 0.6) {
      // Off by factor
      wrong = correct + rand(-range, range);
    } else {
      // Common mistake (e.g., switched digits)
      wrong = correct + rand(1, 5) * (Math.random() > 0.5 ? 1 : -1);
    }

    if (wrong !== correct && wrong >= 0 && !wrongs.has(wrong)) {
      wrongs.add(wrong);
    }
  }

  return Array.from(wrongs);
}

// Addition
function genAdd(difficulty: MathDifficulty): MathProblem {
  let a: number, b: number;
  if (difficulty === 1) { a = rand(1, 20); b = rand(1, 20); }
  else if (difficulty === 2) { a = rand(10, 99); b = rand(10, 99); }
  else { a = rand(100, 999); b = rand(100, 999); }

  const answer = a + b;
  const wrongs = generateWrongAnswers(answer, 3);

  return {
    id: `add_${Date.now()}_${rand(0, 999)}`,
    question: `${a} + ${b} = ?`,
    answer,
    options: shuffle([answer, ...wrongs]),
    operation: 'add',
    difficulty,
  };
}

// Subtraction
function genSubtract(difficulty: MathDifficulty): MathProblem {
  let a: number, b: number;
  if (difficulty === 1) { a = rand(5, 30); b = rand(1, a); }
  else if (difficulty === 2) { a = rand(20, 99); b = rand(10, a); }
  else { a = rand(100, 999); b = rand(50, a); }

  const answer = a - b;
  const wrongs = generateWrongAnswers(answer, 3);

  return {
    id: `sub_${Date.now()}_${rand(0, 999)}`,
    question: `${a} − ${b} = ?`,
    answer,
    options: shuffle([answer, ...wrongs]),
    operation: 'subtract',
    difficulty,
  };
}

// Multiplication
function genMultiply(difficulty: MathDifficulty): MathProblem {
  let a: number, b: number;
  if (difficulty === 1) { a = rand(2, 5); b = rand(2, 5); }
  else if (difficulty === 2) { a = rand(2, 10); b = rand(2, 10); }
  else { a = rand(6, 12); b = rand(6, 12); }

  const answer = a * b;
  const wrongs = generateWrongAnswers(answer, 3);

  return {
    id: `mul_${Date.now()}_${rand(0, 999)}`,
    question: `${a} × ${b} = ?`,
    answer,
    options: shuffle([answer, ...wrongs]),
    operation: 'multiply',
    difficulty,
    hint: difficulty === 1 ? `${a} × ${b} = ${a} + `.concat(Array(b - 1).fill(String(a)).join(' + ')) : undefined,
  };
}

// Division
function genDivide(difficulty: MathDifficulty): MathProblem {
  let divisor: number, quotient: number;
  if (difficulty === 1) { divisor = rand(2, 5); quotient = rand(2, 5); }
  else if (difficulty === 2) { divisor = rand(2, 10); quotient = rand(2, 10); }
  else { divisor = rand(3, 12); quotient = rand(3, 12); }

  const dividend = divisor * quotient; // Always divisible
  const wrongs = generateWrongAnswers(quotient, 3);

  return {
    id: `div_${Date.now()}_${rand(0, 999)}`,
    question: `${dividend} ÷ ${divisor} = ?`,
    answer: quotient,
    options: shuffle([quotient, ...wrongs]),
    operation: 'divide',
    difficulty,
  };
}

// Word problems (slovní úlohy)
const WORD_TEMPLATES: Array<{
  template: (a: number, b: number) => string;
  operation: MathOperation;
  getAnswer: (a: number, b: number) => number;
}> = [
  {
    template: (a, b) => `Petr má ${a} kuliček. Dostal od kamaráda ${b}. Kolik jich má celkem?`,
    operation: 'add',
    getAnswer: (a, b) => a + b,
  },
  {
    template: (a, b) => `V košíku bylo ${a} jablek. Maminka ${b} snědla. Kolik jich zbylo?`,
    operation: 'subtract',
    getAnswer: (a, b) => a - b,
  },
  {
    template: (a, b) => `V jedné krabici je ${a} bonbónů. Máme ${b} krabic. Kolik je bonbónů celkem?`,
    operation: 'multiply',
    getAnswer: (a, b) => a * b,
  },
  {
    template: (a, b) => `${a} dětí se rozdělilo do ${b} stejných skupin. Kolik dětí je v každé skupině?`,
    operation: 'divide',
    getAnswer: (a, b) => a / b,
  },
  {
    template: (a, b) => `Na školním výletě je ${a} žáků. V jednom autobusu se vejde ${b} žáků. Kolik autobusů potřebujeme?`,
    operation: 'divide',
    getAnswer: (a, b) => a / b,
  },
  {
    template: (a, b) => `Každý den Viki přečte ${a} stránek. Za ${b} dní přečte kolik stránek?`,
    operation: 'multiply',
    getAnswer: (a, b) => a * b,
  },
];

function genWordProblem(difficulty: MathDifficulty): MathProblem {
  const tmpl = WORD_TEMPLATES[rand(0, WORD_TEMPLATES.length - 1)];
  let a: number, b: number;

  if (tmpl.operation === 'divide') {
    b = rand(2, difficulty === 1 ? 5 : 10);
    const quotient = rand(2, difficulty === 1 ? 5 : 10);
    a = b * quotient;
  } else if (tmpl.operation === 'subtract') {
    a = rand(10, difficulty === 1 ? 30 : 100);
    b = rand(1, a - 1);
  } else if (tmpl.operation === 'multiply') {
    a = rand(2, difficulty === 1 ? 5 : 10);
    b = rand(2, difficulty === 1 ? 5 : 8);
  } else {
    a = rand(5, difficulty === 1 ? 20 : 50);
    b = rand(5, difficulty === 1 ? 20 : 50);
  }

  const answer = tmpl.getAnswer(a, b);
  const wrongs = generateWrongAnswers(answer, 3);

  return {
    id: `word_${Date.now()}_${rand(0, 999)}`,
    question: tmpl.template(a, b),
    answer,
    options: shuffle([answer, ...wrongs]),
    operation: tmpl.operation,
    difficulty,
  };
}

// Main generator
export function generateProblem(options?: {
  operation?: MathOperation | 'word';
  difficulty?: MathDifficulty;
}): MathProblem {
  const difficulty = options?.difficulty || 1;
  const operation = options?.operation || (['add', 'subtract', 'multiply', 'divide', 'word'] as const)[rand(0, 4)];

  switch (operation) {
    case 'add': return genAdd(difficulty);
    case 'subtract': return genSubtract(difficulty);
    case 'multiply': return genMultiply(difficulty);
    case 'divide': return genDivide(difficulty);
    case 'word': return genWordProblem(difficulty);
    default: return genMultiply(difficulty);
  }
}

// Generate a set of problems
export function generateSet(count: number, options?: {
  operation?: MathOperation | 'word';
  difficulty?: MathDifficulty;
}): MathProblem[] {
  return Array.from({ length: count }, () => generateProblem(options));
}
