

import { DifficultyLevel, ComparisonQuestion, GameMode, StandardComparisonQuestion, ExpressionComparisonQuestion } from '../../../types';
import { generateId, shuffleArray } from '../questionUtils';
import { MIN_EQUALS_IN_COMPARISON_ROUND } from '../../../constants';

const getComparisonSignature = (parts: (number|string)[]): string => {
    return `comp-${parts.join('vs')}`;
};

const generateStandardComparison = (
    difficulty: DifficultyLevel,
    existingSignatures: Set<string>
): StandardComparisonQuestion | null => {
    let num1, num2, answer, q: StandardComparisonQuestion;
    let signature: string;
    let attempts = 0;
    const maxRange = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? 10 : 20;

    do {
        attempts++;
        if (attempts > 50) return null;

        if (difficulty === DifficultyLevel.PRE_SCHOOL_CHOI) {
            // For Chồi level, make numbers closer to each other to increase difficulty.
            const minNum = 5; // Numbers should be larger
            num1 = Math.floor(Math.random() * (maxRange - minNum + 1)) + minNum; // num1 is [5, 20]
            const maxDiff = 5;
            const offset = Math.floor(Math.random() * (maxDiff * 2 + 1)) - maxDiff; // -5 to +5
            num2 = num1 + offset;

            // Clamp num2 to be within the valid range
            if (num2 < 1) num2 = 1;
            if (num2 > maxRange) num2 = maxRange;
        } else {
            // Mầm level keeps the original simpler logic
            num1 = Math.floor(Math.random() * maxRange) + 1;
            num2 = Math.floor(Math.random() * maxRange) + 1;
        }
        
        if (num1 < num2) answer = '<';
        else if (num1 > num2) answer = '>';
        else answer = '=';
        
        signature = getComparisonSignature([num1, num2].sort((a,b)=>a-b));

    } while (existingSignatures.has(signature));
    
    existingSignatures.add(signature);
    
    q = { 
        id: generateId(), type: 'comparison', variant: 'standard', mode: GameMode.COMPARISON, 
        difficulty: difficulty, number1: num1, number2: num2, answer: answer, 
        promptText: 'Chọn dấu thích hợp:' 
    };
    return q;
};


const generateExpressionComparison = (
    difficulty: DifficultyLevel,
    existingSignatures: Set<string>
): ExpressionComparisonQuestion | null => {
    let expOp1, expOp2, expRes, compareTo, answer, q: ExpressionComparisonQuestion;
    let signature: string;
    let attempts = 0;
    const maxRange = 20;
    let expOperator: '+' | '-';

    do {
        attempts++;
        if (attempts > 50) return null;
        
        expOperator = Math.random() < 0.6 ? '+' : '-';
        
        if (expOperator === '+') {
            expOp1 = Math.floor(Math.random() * 10) + 1; // 1-10
            expOp2 = Math.floor(Math.random() * 10) + 1; // 1-10
            expRes = expOp1 + expOp2;
        } else { // '-'
            expOp1 = Math.floor(Math.random() * 10) + 10; // 10-19
            expOp2 = Math.floor(Math.random() * (expOp1 - 1)) + 1; // 1 to op1-1
            expRes = expOp1 - expOp2;
        }
        
        // Generate compareTo number with a bias to be close to the result
        const offset = shuffleArray([-3, -2, -1, 0, 1, 2, 3])[0];
        compareTo = expRes + offset;
        if (compareTo < 0) compareTo = expRes + 1; // ensure non-negative

        if (expRes < compareTo) answer = '<';
        else if (expRes > compareTo) answer = '>';
        else answer = '=';
        
        signature = `exp-${expOp1}${expOperator}${expOp2}vs${compareTo}`;
    } while (existingSignatures.has(signature) || expRes > maxRange);

    existingSignatures.add(signature);
    
    q = { 
        id: generateId(), type: 'comparison', variant: 'expression_comparison', mode: GameMode.COMPARISON, 
        difficulty: difficulty, expOperand1: expOp1, expOperand2: expOp2, expOperator, 
        compareTo, answer, promptText: 'So sánh kết quả phép tính:' 
    };
    return q;
};


export const generateComparisonQuestion = (
    difficulty: DifficultyLevel, 
    existingSignatures: Set<string>, 
): ComparisonQuestion | null => {
    const variantProb = Math.random();

    if (difficulty === DifficultyLevel.PRE_SCHOOL_MAM) {
        return generateStandardComparison(difficulty, existingSignatures);
    } else { // Chồi
        // 70% standard, 30% expression
        if (variantProb < 0.7) {
            return generateStandardComparison(difficulty, existingSignatures);
        } else {
            return generateExpressionComparison(difficulty, existingSignatures);
        }
    }
};

// This function is kept for its logic of generating a balanced set for Choi level
export const generateComparisonQuestionsForChoi = (difficulty: DifficultyLevel, existingSignatures: Set<string>, count: number): ComparisonQuestion[] => {
    const questions: ComparisonQuestion[] = [];
    
    // Ensure a minimum number of equals
    for (let i = 0; i < MIN_EQUALS_IN_COMPARISON_ROUND; i++) {
        let q: ComparisonQuestion | null = null;
        let attempts = 0;
        do {
            q = generateStandardComparison(difficulty, existingSignatures);
            attempts++;
        } while(q && q.answer !== '=' && attempts < 20);
        if (q) questions.push(q);
    }
    
    // Fill the rest
    while(questions.length < count) {
        const q = generateComparisonQuestion(difficulty, existingSignatures);
        if(q) {
           questions.push(q);
        } else {
            break; // Stop if generator fails
        }
    }

    let shuffledQuestions = shuffleArray(questions.slice(0, count));

    // Simple de-dupe for consecutive equals
    for (let i = 0; i < shuffledQuestions.length - 1; i++) {
        const currentQ = shuffledQuestions[i];
        const nextQ = shuffledQuestions[i+1];
        if (currentQ.type === 'comparison' && currentQ.variant === 'standard' &&
            nextQ.type === 'comparison' && nextQ.variant === 'standard' &&
            currentQ.answer === '=' && nextQ.answer === '=') {
            
            // find a non-equal to swap with
            const swapIndex = shuffledQuestions.findIndex((q, idx) => idx > i+1 && (q.type !== 'comparison' || (q as StandardComparisonQuestion).answer !== '='));
            if(swapIndex > -1) {
                [shuffledQuestions[i+1], shuffledQuestions[swapIndex]] = [shuffledQuestions[swapIndex], shuffledQuestions[i+1]];
            }
        }
    }
    return shuffledQuestions;
}