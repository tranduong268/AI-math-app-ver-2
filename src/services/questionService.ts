// src/services/questionService.ts

import { GameMode, DifficultyLevel, Question, ShapeType, IconData, ComparisonQuestion } from '../../types';
import { getAllBaseUnlockedIcons, shuffleArray } from './questionUtils';
import { ICON_DATA } from '../data/iconData';
import { clearMasterUsedIcons } from './localStorageService';

// Import individual question generators
import { generateAdditionQuestion, generateSubtractionQuestion } from './generators/mathQuestionGenerator';
import { generateComparisonQuestion, generateComparisonQuestionsForChoi } from './generators/comparisonQuestionGenerator';
import { generateCountingQuestion } from './generators/countingQuestionGenerator';
import { generateMatchingPairsQuestion } from './generators/matchingPairsGenerator';
import { generateNumberRecognitionQuestion } from './generators/numberRecognitionGenerator';
import { generateNumberSequenceQuestion } from './generators/numberSequenceGenerator';
// AI-based generators are now used for these modes
import { generateAiQuestionsBatch } from './aiService'; 
import { COMPREHENSIVE_CHALLENGE_QUESTIONS, ODD_ONE_OUT_PROMPTS, VISUAL_PATTERN_PROMPTS } from '../../constants';

export const generateQuestionsForRound = async (
  mode: GameMode,
  difficulty: DifficultyLevel,
  unlockedSetIds: string[],
  numQuestions: number,
  masterUsedIcons: ShapeType[], // Changed from globallyRecentIcons
  iconsToExcludeFromGeneration: Set<ShapeType> = new Set()
): Promise<{ questions: Question[], iconsUsedInRound: Set<ShapeType> }> => {
  const iconsUsedInCurrentGenerationCycle = new Set<ShapeType>(iconsToExcludeFromGeneration);
  
  // --- AI Mode Handling (Batch Generation) ---
  if (mode === GameMode.ODD_ONE_OUT || mode === GameMode.VISUAL_PATTERN) {
    const allUnlockedIconsData = getAllBaseUnlockedIcons(unlockedSetIds)
      .map(emoji => ICON_DATA.find(d => d.emoji === emoji))
      .filter((d): d is IconData => d !== undefined);

    const masterUsedSet = new Set(masterUsedIcons);
    let availableIconPool = allUnlockedIconsData.filter(iconData => !masterUsedSet.has(iconData.emoji));

    // Fallback: If the pool of "fresh" icons is too small, reset the master list and use all icons.
    // This creates a long-term rotation cycle for all available icons.
    const MIN_FRESH_ICONS_REQUIRED = 80;
    if (availableIconPool.length < MIN_FRESH_ICONS_REQUIRED) {
        clearMasterUsedIcons(); 
        availableIconPool = allUnlockedIconsData; 
    }
    
    // Call the AI service with the curated pool of fresh icons.
    const { questions: rawAiQuestions, iconsUsed } = await generateAiQuestionsBatch(
        mode,
        difficulty,
        numQuestions,
        shuffleArray(availableIconPool) // Shuffle the pool before sending to AI
    );
    
    // Assign random, safe prompts to the questions
    const finalAiQuestions = rawAiQuestions.map(q => {
        let prompts: string[] = [];
        if (q.mode === GameMode.ODD_ONE_OUT) {
            prompts = ODD_ONE_OUT_PROMPTS;
        } else if (q.mode === GameMode.VISUAL_PATTERN) {
            prompts = VISUAL_PATTERN_PROMPTS;
        }

        if (prompts.length > 0) {
            q.promptText = prompts[Math.floor(Math.random() * prompts.length)];
        }
        return q;
    });


    iconsUsed.forEach(icon => iconsUsedInCurrentGenerationCycle.add(icon));

    return { questions: finalAiQuestions, iconsUsedInRound: iconsUsedInCurrentGenerationCycle };
  }


  // --- Standard Mode Handling (Loop-based Generation) ---
  const questions: Question[] = [];
  const existingSignatures = new Set<string>();
  
  const iconsUsedThisModeCycle = new Set<ShapeType>();

  const allBaseIcons = getAllBaseUnlockedIcons(unlockedSetIds);

  // Handle Comprehensive Challenge Mode separately
  if (mode === GameMode.COMPREHENSIVE_CHALLENGE) {
    const totalQuestions = COMPREHENSIVE_CHALLENGE_QUESTIONS;
    const numSeq = 3;
    const numComp = 4;
    const numSub = 4;
    const numAdd = totalQuestions - numSeq - numComp - numSub;

    const modesToGenerate = [
      ...Array(numAdd).fill(GameMode.ADDITION),
      ...Array(numSub).fill(GameMode.SUBTRACTION),
      ...Array(numComp).fill(GameMode.COMPARISON),
      ...Array(numSeq).fill(GameMode.NUMBER_SEQUENCE),
    ];

    const allGeneratedQuestions: Question[] = [];
    const signaturesForChallenge = new Set<string>();

    for (const gameMode of modesToGenerate) {
      let q: Question | null = null;
      let attempt = 0;
      while (!q && attempt < 10) {
        attempt++;
        switch (gameMode) {
          case GameMode.ADDITION:
            q = generateAdditionQuestion(difficulty, signaturesForChallenge);
            break;
          case GameMode.SUBTRACTION:
            q = generateSubtractionQuestion(difficulty, signaturesForChallenge);
            break;
          case GameMode.COMPARISON:
            q = generateComparisonQuestion(difficulty, signaturesForChallenge);
            break;
          case GameMode.NUMBER_SEQUENCE:
            q = generateNumberSequenceQuestion(difficulty, signaturesForChallenge);
            break;
        }
      }
      if (q) {
        allGeneratedQuestions.push(q);
      }
    }
    return { questions: shuffleArray(allGeneratedQuestions), iconsUsedInRound: new Set() };
  }

  // Special handling for Comparison 'Choi' level to get a balanced set
  if (mode === GameMode.COMPARISON && difficulty === DifficultyLevel.PRE_SCHOOL_CHOI) {
      const comparisonQuestions = generateComparisonQuestionsForChoi(difficulty, existingSignatures, numQuestions);
      return { questions: comparisonQuestions, iconsUsedInRound: new Set() };
  }


  for (let i = 0; i < numQuestions; i++) {
    let question: Question | null = null;
    let attempts = 0;
    const MAX_ATTEMPTS_PER_QUESTION = 20;

    while (!question && attempts < MAX_ATTEMPTS_PER_QUESTION) {
        attempts++;
        switch (mode) {
          case GameMode.ADDITION:
            question = generateAdditionQuestion(difficulty, existingSignatures);
            break;
          case GameMode.SUBTRACTION:
            question = generateSubtractionQuestion(difficulty, existingSignatures);
            break;
          case GameMode.COMPARISON:
            question = generateComparisonQuestion(difficulty, existingSignatures);
            break;
          case GameMode.COUNTING:
            question = generateCountingQuestion(difficulty, existingSignatures, allBaseIcons, masterUsedIcons, iconsUsedInCurrentGenerationCycle);
            break;
          case GameMode.NUMBER_RECOGNITION:
            question = generateNumberRecognitionQuestion(difficulty, existingSignatures, allBaseIcons, masterUsedIcons, iconsUsedInCurrentGenerationCycle, iconsUsedThisModeCycle);
            break;
          case GameMode.MATCHING_PAIRS:
            question = generateMatchingPairsQuestion(difficulty, existingSignatures, allBaseIcons, masterUsedIcons, iconsUsedInCurrentGenerationCycle, iconsUsedThisModeCycle);
            break;
          case GameMode.NUMBER_SEQUENCE:
            question = generateNumberSequenceQuestion(difficulty, existingSignatures);
            break;
          // AI modes are now handled at the top of the function
        }
    }

    if (question) {
      questions.push(question);
    } else {
      console.warn(`Failed to generate a question for mode ${mode} at index ${i} after ${MAX_ATTEMPTS_PER_QUESTION} attempts. Round may be shorter than intended.`);
    }
  }

  return { questions, iconsUsedInRound: iconsUsedInCurrentGenerationCycle };
};