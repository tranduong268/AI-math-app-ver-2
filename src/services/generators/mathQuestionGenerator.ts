
import { DifficultyLevel, MathQuestion, MathQuestionUnknownSlot, GameMode, StandardMathQuestion, BalancingEquationQuestion, MultipleChoiceMathQuestion, MultipleChoiceMathOption } from '../../../types';
import { generateId, shuffleArray } from '../questionUtils';

const getMathSignature = (oper: '+' | '-', parts: (number|string)[]): string => {
  return `math-${oper}-${parts.join('-')}`;
};

const generateStandardMathQuestion = (
    difficulty: DifficultyLevel, 
    operator: '+' | '-', 
    existingSignatures: Set<string>
): StandardMathQuestion | null => {
    let qData: { operand1True: number, operand2True: number, resultTrue: number, unknownSlot: MathQuestionUnknownSlot, answer: number };
    let signature: string;
    let attempts = 0;

    do {
        attempts++;
        if (attempts > 50) return null;

        const slotProb = Math.random();
        let chosenSlot: MathQuestionUnknownSlot;

        // Same slot distribution logic for now
        if (difficulty === DifficultyLevel.PRE_SCHOOL_MAM) {
            if (slotProb < 0.6) chosenSlot = 'result'; else if (slotProb < 0.8) chosenSlot = 'operand2'; else chosenSlot = 'operand1';
        } else {
            if (slotProb < 0.4) chosenSlot = 'result'; else if (slotProb < 0.7) chosenSlot = 'operand2'; else chosenSlot = 'operand1';
        }

        let o1t=0, o2t=0, resT=0, ans=0;

        if (operator === '+') {
            const minResult = difficulty === DifficultyLevel.PRE_SCHOOL_CHOI ? 11 : 2;
            const maxResult = difficulty === DifficultyLevel.PRE_SCHOOL_CHOI ? 20 : 10;
            resT = Math.floor(Math.random() * (maxResult - minResult + 1)) + minResult;
            
            if (difficulty === DifficultyLevel.PRE_SCHOOL_CHOI) {
                // For Chồi level, ensure operands are not trivial (e.g. > 1)
                o1t = Math.floor(Math.random() * (resT - 4)) + 2; // Ensures o1t is at least 2
                o2t = resT - o1t; // Ensures o2t is also at least 2
            } else {
                 if (resT < 2 && chosenSlot !== 'result') { 
                     o1t = 1; o2t = 0; resT=1;
                } else {
                    o1t = Math.floor(Math.random() * (resT));
                    o2t = resT - o1t;
                }
            }


            if (chosenSlot === 'result') {
                ans = resT;
            } else if (chosenSlot === 'operand2') {
                ans = o2t;
            } else { // operand1
                ans = o1t;
            }
        } else { // operator '-'
            const minMinuend = difficulty === DifficultyLevel.PRE_SCHOOL_CHOI ? 11 : 1;
            const maxMinuend = difficulty === DifficultyLevel.PRE_SCHOOL_CHOI ? 20 : 10;
            
            o1t = Math.floor(Math.random() * (maxMinuend - minMinuend + 1)) + minMinuend;
            
            if (difficulty === DifficultyLevel.PRE_SCHOOL_CHOI) {
                // For Chồi, ensure subtrahend is not 0 and the result is not too simple (e.g. 1)
                 o2t = Math.floor(Math.random() * (o1t - 2)) + 1; // Makes o2t in [1, o1t-2], so result is >= 2
            } else {
                o2t = Math.floor(Math.random() * o1t);
            }
            resT = o1t - o2t;

            if (chosenSlot === 'result') {
                ans = resT;
            } else if (chosenSlot === 'operand2') {
                ans = o2t;
            } else { // operand1
                ans = o1t;
            }
        }

        qData = { operand1True: o1t, operand2True: o2t, resultTrue: resT, unknownSlot: chosenSlot, answer: ans };
        signature = getMathSignature(operator, [qData.operand1True, qData.operand2True, qData.resultTrue, qData.unknownSlot]);

    } while (existingSignatures.has(signature));

    existingSignatures.add(signature);
    return {
        id: generateId(), type: 'math', mode: operator === '+' ? GameMode.ADDITION : GameMode.SUBTRACTION,
        difficulty: difficulty, operator: operator, promptText: 'Bé hãy điền số còn thiếu:',
        variant: 'standard', ...qData
    };
};

const generateBalancingEquation = (
    difficulty: DifficultyLevel, 
    operator: '+' | '-', 
    existingSignatures: Set<string>
): BalancingEquationQuestion | null => {
    let o1, o2, o3, ans, sigParts: (number|string)[];
    let signature: string;
    let attempts = 0;

    do {
        attempts++;
        if (attempts > 50) return null;

        const total = difficulty === DifficultyLevel.PRE_SCHOOL_CHOI 
            ? Math.floor(Math.random() * 10) + 11 // Chồi: Total sum/minuend 11-20
            : Math.floor(Math.random() * 8) + 3;  // Mầm: Total sum/minuend 3-10
        
        o1 = Math.floor(Math.random() * (total - 1)) + 1;
        o2 = total - o1;

        o3 = Math.floor(Math.random() * (total - 1)) + 1;
        ans = total - o3;
        
        // Prevent trivial questions like 10 + 2 = 10 + ? or 5 + 5 = 10 + 0
        if(ans <= 0 || o1 === o3 || o2 === ans || o1 === ans || o2 === o3) continue;

        sigParts = [o1, o2, o3, ans].sort((a,b)=>a-b);
        signature = getMathSignature(operator, ['bal', ...sigParts]);
    } while (existingSignatures.has(signature));

    existingSignatures.add(signature);
    
    return {
        id: generateId(), type: 'math', mode: operator === '+' ? GameMode.ADDITION : GameMode.SUBTRACTION,
        difficulty: difficulty, operator: operator, variant: 'balancing_equation',
        promptText: 'Làm cho hai bên cân bằng nào!',
        operand1: o1, operand2: o2, operand3: o3, answer: ans
    };
};

const generateMultipleChoiceMath = (
    difficulty: DifficultyLevel, 
    operator: '+' | '-', 
    existingSignatures: Set<string>
): MultipleChoiceMathQuestion | null => {
    let o1, o2, ans, options: MultipleChoiceMathOption[];
    let signature: string;
    let attempts = 0;

    do {
        attempts++;
        if (attempts > 50) return null;

        const minResult = difficulty === DifficultyLevel.PRE_SCHOOL_CHOI ? 11 : 0;
        const maxResult = difficulty === DifficultyLevel.PRE_SCHOOL_CHOI ? 20 : 10;
        
        if (operator === '+') {
            const tempAns = Math.floor(Math.random() * (maxResult - minResult + 1)) + minResult;
            if (difficulty === DifficultyLevel.PRE_SCHOOL_CHOI) {
                o1 = Math.floor(Math.random() * (tempAns - 3)) + 2; // Ensures both operands are >= 2
            } else {
                 o1 = Math.floor(Math.random() * (tempAns + 1));
            }
            o2 = tempAns - o1;
            ans = tempAns;
        } else { // '-'
            o1 = Math.floor(Math.random() * (maxResult - minResult + 1)) + minResult;
            if (o1 === 0 && minResult === 0) o1 = Math.floor(Math.random() * (maxResult - 1)) + 1;
            
            if (difficulty === DifficultyLevel.PRE_SCHOOL_CHOI) {
                if (o1 < 3) o1 = Math.floor(Math.random() * (maxResult - 10)) + 10; // Ensure minuend is large enough
                 o2 = Math.floor(Math.random() * (o1 - 2)) + 1; // Avoid easy subtractions like A-0 or A-1
            } else {
                o2 = Math.floor(Math.random() * o1);
            }
            ans = o1 - o2;
        }

        const distractors = new Set<number>();
        while(distractors.size < 2) {
            const offset = shuffleArray([-2, -1, 1, 2])[0];
            const distractor = ans + offset;
            if (distractor >= 0 && distractor !== ans) {
                distractors.add(distractor);
            }
        }
        
        options = shuffleArray([
            { id: generateId(), value: ans, isCorrect: true },
            ...Array.from(distractors).map(d => ({ id: generateId(), value: d, isCorrect: false }))
        ]);

        signature = getMathSignature(operator, ['mc', o1, o2]);

    } while (existingSignatures.has(signature));
    
    existingSignatures.add(signature);
    
    return {
        id: generateId(), type: 'math', mode: operator === '+' ? GameMode.ADDITION : GameMode.SUBTRACTION,
        difficulty: difficulty, operator: operator, variant: 'multiple_choice',
        promptText: 'Chọn đáp án đúng nhé:',
        operand1: o1, operand2: o2, answer: ans, options
    };
};


const generateQuestion = (
  difficulty: DifficultyLevel, 
  operator: '+' | '-',
  existingSignatures: Set<string>
): MathQuestion | null => {
    const variantProb = Math.random();

    if (difficulty === DifficultyLevel.PRE_SCHOOL_MAM) {
        // Mầm: 80% standard, 20% multiple choice
        if (variantProb < 0.8) {
            return generateStandardMathQuestion(difficulty, operator, existingSignatures);
        } else {
            return generateMultipleChoiceMath(difficulty, operator, existingSignatures);
        }
    } else { // Chồi
        // Chồi: 60% standard, 20% balancing, 20% multiple choice
        if (variantProb < 0.6) {
            return generateStandardMathQuestion(difficulty, operator, existingSignatures);
        } else if (variantProb < 0.8) {
            return generateBalancingEquation(difficulty, operator, existingSignatures);
        } else {
            return generateMultipleChoiceMath(difficulty, operator, existingSignatures);
        }
    }
};

export const generateAdditionQuestion = (difficulty: DifficultyLevel, existingSignatures: Set<string>): MathQuestion | null => {
    return generateQuestion(difficulty, '+', existingSignatures);
};

export const generateSubtractionQuestion = (difficulty: DifficultyLevel, existingSignatures: Set<string>): MathQuestion | null => {
    return generateQuestion(difficulty, '-', existingSignatures);
};