

import { useState, useEffect, useCallback } from 'react';
import { GameMode, DifficultyLevel, Question, IncorrectAttempt, MatchingPairsQuestion, EndGameMessageInfo, GameLogicState, GameLogicActions, NumberSequenceQuestion, VisualPatternQuestion, VisualPatternOption, NumberRecognitionOption, OddOneOutQuestion, ShapeType, MathQuestion, ComparisonQuestion, MultipleChoiceMathQuestion, StandardMathQuestion, BalancingEquationQuestion, StandardComparisonQuestion, ExpressionComparisonQuestion, SortSequenceQuestion } from '../../types';
import { useAudio } from '../contexts/AudioContext';
import { generateQuestionsForRound } from '../services/questionService';
import { NUM_QUESTIONS_PER_ROUND, POSITIVE_FEEDBACKS, ENCOURAGING_FEEDBACKS, NEXT_QUESTION_DELAY_MS, SLOW_NEXT_QUESTION_DELAY_MS, CONGRATS_MESSAGES, CONGRATS_ICONS, ENCOURAGE_TRY_AGAIN_MESSAGE, ENCOURAGE_TRY_AGAIN_ICONS, POSITIVE_FEEDBACK_EMOJIS, ENCOURAGING_FEEDBACK_EMOJIS, VISUAL_PATTERN_QUESTIONS_MAM, VISUAL_PATTERN_QUESTIONS_CHOI, ODD_ONE_OUT_QUESTIONS_MAM, ODD_ONE_OUT_QUESTIONS_CHOI, COMPREHENSIVE_CHALLENGE_QUESTIONS, COMPREHENSIVE_CHALLENGE_TIME_MAM, COMPREHENSIVE_CHALLENGE_TIME_CHOI } from '../../constants';
import { shuffleArray } from '../services/questionUtils';
import { clearMasterUsedIcons } from '../services/localStorageService';

declare var confetti: any;

interface UseGameLogicProps {
  mode: GameMode;
  difficulty: DifficultyLevel;
  unlockedSetIds: string[];
  masterUsedIcons: string[]; // New prop for long-term icon diversity
  onEndGame: (
    incorrectAttempts: IncorrectAttempt[],
    score: number,
    starsEarnedThisRound: number,
    numQuestionsInRound: number,
    iconsUsedInRound: string[], // New: icons used in this specific round
    timeTaken: number | null
  ) => void;
}

const useGameLogic = ({ mode, difficulty, unlockedSetIds, masterUsedIcons, onEndGame }: UseGameLogicProps): GameLogicState & GameLogicActions => {
  const { playSound, playLowTimeWarning, stopLowTimeWarning, isMuted } = useAudio();
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [starsEarnedThisRound, setStarsEarnedThisRound] = useState(0);
  const [incorrectAttempts, setIncorrectAttempts] = useState<IncorrectAttempt[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'positive' | 'encouraging' | null>(null);
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState<string | number | string[] | null>(null);
  const [currentMatchingQuestionState, setCurrentMatchingQuestionState] = useState<MatchingPairsQuestion | null>(null);
  const [showEndGameOverlay, setShowEndGameOverlay] = useState(false);
  const [endGameMessageInfo, setEndGameMessageInfo] = useState<EndGameMessageInfo | null>(null);
  const [numQuestionsForRound, setNumQuestionsForRound] = useState(NUM_QUESTIONS_PER_ROUND);
  const [iconsUsedThisRound, setIconsUsedThisRound] = useState<Set<ShapeType>>(new Set());

  // State for timed mode
  const [gameStatus, setGameStatus] = useState<'idle' | 'countdown' | 'playing' | 'ended'>('idle');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);


  const resetGameState = useCallback(async () => {
    setIsLoading(true);
    let questionsToGenerate = NUM_QUESTIONS_PER_ROUND;
    if (mode === GameMode.VISUAL_PATTERN) {
        questionsToGenerate = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? VISUAL_PATTERN_QUESTIONS_MAM : VISUAL_PATTERN_QUESTIONS_CHOI;
    } else if (mode === GameMode.ODD_ONE_OUT) {
        questionsToGenerate = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? ODD_ONE_OUT_QUESTIONS_MAM : ODD_ONE_OUT_QUESTIONS_CHOI;
    } else if (mode === GameMode.NUMBER_SEQUENCE) {
        questionsToGenerate = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? 10 : 15;
    } else if (mode === GameMode.COMPARISON && difficulty === DifficultyLevel.PRE_SCHOOL_CHOI) {
      questionsToGenerate = 25;
    } else if (mode === GameMode.COMPREHENSIVE_CHALLENGE) {
      questionsToGenerate = COMPREHENSIVE_CHALLENGE_QUESTIONS;
    }
    setNumQuestionsForRound(questionsToGenerate);
    
    // Setup timer if applicable
    if (mode === GameMode.COMPREHENSIVE_CHALLENGE) {
      const timeForLevel = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? COMPREHENSIVE_CHALLENGE_TIME_MAM : COMPREHENSIVE_CHALLENGE_TIME_CHOI;
      setTotalTime(timeForLevel);
      setTimeLeft(timeForLevel);
      setGameStatus('countdown');
    } else {
      setGameStatus('playing'); // Regular modes start immediately
    }


    // --- Simplified Question Generation ---
    const { questions: generatedQuestions, iconsUsedInRound } = await generateQuestionsForRound(
        mode, difficulty, unlockedSetIds, questionsToGenerate, masterUsedIcons
    );

    // Set initial state to start game
    setQuestions(generatedQuestions);
    setIconsUsedThisRound(iconsUsedInRound);
    setCurrentQuestionIndex(0);
    setScore(0);
    setStarsEarnedThisRound(0);
    setIncorrectAttempts([]);
    setFeedbackMessage(null);
    setFeedbackType(null);
    setIsInputDisabled(false);
    setShowEndGameOverlay(false);
    setEndGameMessageInfo(null);
    setLastSubmittedAnswer(null);
    if (generatedQuestions.length > 0 && generatedQuestions[0]?.type === 'matching_pairs') {
      setCurrentMatchingQuestionState(generatedQuestions[0] as MatchingPairsQuestion);
    } else {
      setCurrentMatchingQuestionState(null);
    }
    setIsLoading(false);

  }, [mode, difficulty, unlockedSetIds, masterUsedIcons]);

  useEffect(() => {
    resetGameState();
  }, [resetGameState]);

  const currentQuestion = questions[currentQuestionIndex] || null;
  const progressPercent = numQuestionsForRound > 0 ? ((currentQuestionIndex + 1) / numQuestionsForRound) * 100 : 0;
  const gameModeTitle = mode as string;
  
  const endGame = useCallback((isTimeUp: boolean = false) => {
    stopLowTimeWarning();
    setGameStatus('ended');
    const finalScore = score;
    let calculatedStars = 0;
    const percentageScore = numQuestionsForRound > 0 ? (finalScore / numQuestionsForRound) * 100 : 0;

    if (percentageScore >= 90) calculatedStars = 5;
    else if (percentageScore >= 75) calculatedStars = 4;
    else if (percentageScore >= 60) calculatedStars = 3;
    else if (percentageScore >= 40) calculatedStars = 2;
    else if (percentageScore >= 20) calculatedStars = 1;
    else calculatedStars = 0;
    setStarsEarnedThisRound(calculatedStars);

    if (calculatedStars >= 4) playSound('ROUND_WIN');
    else if (calculatedStars > 0) playSound('ENCOURAGEMENT');
    
    if (isTimeUp) playSound('TIMER_END');

    if (finalScore >= numQuestionsForRound * 0.8 && typeof confetti === 'function') {
      try { confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } }); } catch (e) { console.error("Confetti error:", e)}
    }
    
    let timeTaken: number | null = null;
    if (totalTime !== null && timeLeft !== null) {
        timeTaken = isTimeUp ? totalTime : totalTime - timeLeft;
    }

    let messageInfo: EndGameMessageInfo;
    if (finalScore >= numQuestionsForRound * 0.7) {
      messageInfo = {
        text: CONGRATS_MESSAGES[Math.floor(Math.random() * CONGRATS_MESSAGES.length)],
        type: 'congrats',
        icons: shuffleArray([...POSITIVE_FEEDBACK_EMOJIS, ...CONGRATS_ICONS]).slice(0, 3),
        timeTaken
      };
    } else {
      messageInfo = {
        text: isTimeUp ? "Hết giờ rồi! Cố gắng hơn lần sau nhé!" : ENCOURAGE_TRY_AGAIN_MESSAGE,
        type: 'encourage',
        icons: shuffleArray([...ENCOURAGING_FEEDBACK_EMOJIS]).slice(0, 3),
        timeTaken
      };
    }
    setEndGameMessageInfo(messageInfo);
    setShowEndGameOverlay(true);
  }, [score, numQuestionsForRound, playSound, timeLeft, totalTime, stopLowTimeWarning]);

  const proceedToNextQuestionOrEnd = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      const nextQ = questions[nextIndex];
      if (nextQ?.type === 'matching_pairs') {
        setCurrentMatchingQuestionState(nextQ as MatchingPairsQuestion);
      } else {
        setCurrentMatchingQuestionState(null);
      }
      setFeedbackMessage(null);
      setFeedbackType(null);
      setIsInputDisabled(false);
      setLastSubmittedAnswer(null);
    } else {
      endGame(false);
    }
  }, [currentQuestionIndex, questions, endGame]);


  // Timer logic for Comprehensive Challenge
  useEffect(() => {
    if (gameStatus === 'playing' && timeLeft !== null && timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timerId);
    } else if (gameStatus === 'playing' && timeLeft === 0) {
      endGame(true);
    }
  }, [gameStatus, timeLeft, endGame]);

  // New logic for continuous low time warning sound
  useEffect(() => {
    const isLowTime = gameStatus === 'playing' && timeLeft !== null && timeLeft > 0 && timeLeft <= 15;

    if (isLowTime && !isMuted) {
      playLowTimeWarning();
    } else {
      stopLowTimeWarning();
    }
    
    // Cleanup when the component unmounts or dependencies change, ensuring sound stops
    return () => {
      stopLowTimeWarning();
    };
  }, [gameStatus, timeLeft, isMuted, playLowTimeWarning, stopLowTimeWarning]);

  const startGame = useCallback(() => {
    setGameStatus('playing');
    playSound('ROCKET_WHOOSH');
  }, [playSound]);

  const handleCorrectAnswer = useCallback(() => {
    playSound('CORRECT_ANSWER');
    setScore((prev) => prev + 1);
    setFeedbackMessage(POSITIVE_FEEDBACKS[Math.floor(Math.random() * POSITIVE_FEEDBACKS.length)]);
    setFeedbackType('positive');
  }, [playSound]);

  const handleIncorrectAnswer = useCallback((userAnswerData: string | string[], questionToProcess: Question) => {
    playSound('WRONG_ANSWER');
    setFeedbackMessage(ENCOURAGING_FEEDBACKS[Math.floor(Math.random() * ENCOURAGING_FEEDBACKS.length)]);
    setFeedbackType('encouraging');
    setIncorrectAttempts((prev) => [...prev, { question: questionToProcess, userAnswer: userAnswerData }]);
  }, [playSound]);

  const submitAnswer = useCallback((userAnswer: string | number | string[]) => {
    if (isInputDisabled || !currentQuestion || currentQuestion.type === 'matching_pairs') return;
    if (gameStatus !== 'playing') return;

    setLastSubmittedAnswer(userAnswer);
    setIsInputDisabled(true);

    let isCorrect = false;
    const userAnswerStr = Array.isArray(userAnswer) ? userAnswer.join(',') : userAnswer.toString();

    if (currentQuestion.type === 'math') {
        const cq = currentQuestion as MathQuestion;
        if (cq.variant === 'multiple_choice') {
            const selectedOption = cq.options.find(opt => opt.id === userAnswerStr);
            isCorrect = selectedOption?.isCorrect || false;
        } else {
             isCorrect = parseInt(userAnswerStr, 10) === cq.answer;
        }
    } else if (currentQuestion.type === 'comparison') {
      isCorrect = userAnswerStr === currentQuestion.answer;
    } else if (currentQuestion.type === 'counting') {
      isCorrect = parseInt(userAnswerStr) === currentQuestion.answer;
    } else if (currentQuestion.type === 'number_recognition') {
      const selectedOption = currentQuestion.options.find((opt: NumberRecognitionOption) => opt.id === userAnswerStr);
      isCorrect = selectedOption?.isCorrect || false;
    } else if (currentQuestion.type === 'visual_pattern') {
      const selectedOption = currentQuestion.options.find((opt: VisualPatternOption) => opt.id === userAnswerStr);
      isCorrect = selectedOption?.isCorrect || false;
    } else if (currentQuestion.type === 'number_sequence') {
        const nsQ = currentQuestion as NumberSequenceQuestion;
        if (nsQ.variant === 'fill_in_the_blanks') {
            const userAnswersArray = Array.isArray(userAnswer) ? userAnswer : [userAnswerStr];
            isCorrect = userAnswersArray.every((ans, index) => parseInt(ans, 10) === nsQ.answers[index]);
        } else if (nsQ.variant === 'find_and_fix_error') {
            try {
                const userCorrections = JSON.parse(userAnswerStr) as Record<string, number>;
                const correctErrors = nsQ.errors;
                const userErrorIndices = Object.keys(userCorrections).map(Number).sort();
                const correctErrorIndices = Object.keys(correctErrors).map(Number).sort();
                
                isCorrect = userErrorIndices.length === correctErrorIndices.length && userErrorIndices.length > 0 &&
                    correctErrorIndices.every(index => 
                        userCorrections[index] !== undefined && 
                        Number(userCorrections[index]) === correctErrors[index]
                    );
            } catch (e) { isCorrect = false; }
        } else if (nsQ.variant === 'sort_sequence') {
            const userAnswersArray = Array.isArray(userAnswer) ? userAnswer.map(Number) : [];
            isCorrect = JSON.stringify(userAnswersArray) === JSON.stringify(nsQ.fullSequence);
        }
    } else if (currentQuestion.type === 'odd_one_out') {
        isCorrect = userAnswerStr === currentQuestion.correctAnswerId;
    }

    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleIncorrectAnswer(Array.isArray(userAnswer) ? userAnswer : userAnswerStr, currentQuestion);
    }

    const isSlowMode = [GameMode.VISUAL_PATTERN, GameMode.ODD_ONE_OUT].includes(currentQuestion.mode);
    const delay = isSlowMode ? SLOW_NEXT_QUESTION_DELAY_MS : NEXT_QUESTION_DELAY_MS;

    setTimeout(proceedToNextQuestionOrEnd, delay);
  }, [isInputDisabled, currentQuestion, proceedToNextQuestionOrEnd, handleCorrectAnswer, handleIncorrectAnswer, gameStatus]);

  const selectMatchingPairItem = useCallback((itemIdOrOutcome: string) => {
    if (!currentMatchingQuestionState || isInputDisabled || gameStatus !== 'playing') return;

    setIsInputDisabled(true);
    let currentQuestionState = currentMatchingQuestionState;
    let newItems = currentQuestionState.items.map(item =>
        item.id === itemIdOrOutcome ? { ...item, isSelected: !item.isSelected } : item
    );
    const selectedItems = newItems.filter(item => item.isSelected && !item.isMatched);

    if (selectedItems.length === 2) {
        const [first, second] = selectedItems;
        if (first.matchId === second.matchId && first.visualType !== second.visualType) {
            newItems = newItems.map(item =>
                item.matchId === first.matchId ? { ...item, isMatched: true, isSelected: false } :
                {...item, isSelected: false}
            );

            playSound('MATCHING_CONNECT');
            const updatedQuestionState = { ...currentQuestionState, items: newItems };
            setCurrentMatchingQuestionState(updatedQuestionState);

            const allMatched = newItems.every(item => item.isMatched);
            if (allMatched) {
                handleCorrectAnswer();
                setTimeout(() => proceedToNextQuestionOrEnd(), 300);
            } else {
                 setFeedbackMessage(POSITIVE_FEEDBACKS[Math.floor(Math.random() * POSITIVE_FEEDBACKS.length)]);
                 setFeedbackType('positive');
                 setTimeout(() => {
                    setFeedbackMessage(null);
                    setFeedbackType(null);
                    setIsInputDisabled(false);
                 }, NEXT_QUESTION_DELAY_MS / 2);
            }
        } else {
            playSound('WRONG_ANSWER');
            setFeedbackMessage(ENCOURAGING_FEEDBACKS[Math.floor(Math.random() * ENCOURAGING_FEEDBACKS.length)]);
            setFeedbackType('encouraging');
            setTimeout(() => {
                setCurrentMatchingQuestionState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        items: prevState.items.map(i =>
                            (i.id === first.id || i.id === second.id) ? { ...i, isSelected: false } : i
                        )
                    };
                });
                setFeedbackMessage(null);
                setFeedbackType(null);
                setIsInputDisabled(false);
            }, NEXT_QUESTION_DELAY_MS / 2 );
        }
    } else if (selectedItems.length === 1 || selectedItems.length === 0) {
        setCurrentMatchingQuestionState(prevState => ({ ...prevState!, items: newItems }));
        setIsInputDisabled(false);
    }
  }, [currentMatchingQuestionState, isInputDisabled, proceedToNextQuestionOrEnd, playSound, handleCorrectAnswer, gameStatus]);

  const confirmEndGameAndNavigate = useCallback(() => {
    setShowEndGameOverlay(false);
    onEndGame(incorrectAttempts, score, starsEarnedThisRound, numQuestionsForRound, Array.from(iconsUsedThisRound), endGameMessageInfo?.timeTaken ?? null);
  }, [onEndGame, incorrectAttempts, score, starsEarnedThisRound, numQuestionsForRound, iconsUsedThisRound, endGameMessageInfo]);

  return {
    isLoading,
    questions,
    currentQuestion,
    currentQuestionIndex,
    score,
    starsEarnedThisRound,
    incorrectAttempts,
    incorrectAttemptsCount: incorrectAttempts.length,
    feedbackMessage,
    feedbackType,
    isInputDisabled,
    lastSubmittedAnswer,
    currentMatchingQuestionState: currentQuestion?.type === 'matching_pairs' ? currentMatchingQuestionState : null,
    showEndGameOverlay,
    endGameMessageInfo,
    progressPercent,
    gameModeTitle,
    numQuestionsForRound,
    gameStatus,
    timeLeft,
    totalTime,
    submitAnswer,
    selectMatchingPairItem,
    confirmEndGameAndNavigate,
    goToNextQuestionAfterFeedback: proceedToNextQuestionOrEnd,
    startGame,
  };
};

export default useGameLogic;