


export enum GameMode {
  ADDITION = 'PHÉP CỘNG (+)',
  SUBTRACTION = 'PHÉP TRỪ (-)',
  COMPARISON = 'SO SÁNH (<, >, =)',
  COUNTING = 'ĐẾM HÌNH',
  NUMBER_RECOGNITION = 'NHẬN BIẾT SỐ',
  MATCHING_PAIRS = 'TÌM CẶP TƯƠNG ỨNG',
  NUMBER_SEQUENCE = 'HOÀN THIỆN DÃY SỐ',
  VISUAL_PATTERN = 'TÌM QUY LUẬT HÌNH ẢNH',
  ODD_ONE_OUT = 'TÌM VẬT KHÁC BIỆT',
  COMPREHENSIVE_CHALLENGE = 'THỬ THÁCH TỔNG HỢP', // New timed mode
}

export enum DifficultyLevel {
  PRE_SCHOOL_MAM = 'Mầm (3-4 tuổi)', // Seedling
  PRE_SCHOOL_CHOI = 'Chồi (4-5 tuổi)', // Sprout
  // TODO: Add more levels for older kids later
}

export interface BaseQuestion {
  id: string;
  mode: GameMode;
  difficulty: DifficultyLevel; // Add difficulty to all questions
  promptText: string; // Add promptText to all questions for dynamic AI prompts
}

export type MathQuestionUnknownSlot = 'operand1' | 'operand2' | 'result';

// =================================================================
// MATH QUESTION TYPES (NEW STRUCTURE)
// =================================================================
export interface BaseMathQuestion extends BaseQuestion {
  type: 'math';
  operator: '+' | '-';
}

export interface StandardMathQuestion extends BaseMathQuestion {
    variant: 'standard';
    operand1True: number;
    operand2True: number;
    resultTrue: number;
    unknownSlot: MathQuestionUnknownSlot;
    answer: number;
}

export interface BalancingEquationQuestion extends BaseMathQuestion {
    variant: 'balancing_equation';
    // e.g. 5 + 3 = 4 + ?
    operand1: number;
    operand2: number;
    operand3: number;
    answer: number; // The unknown value
}

export interface MultipleChoiceMathOption {
    id: string;
    value: number;
    isCorrect: boolean;
}

export interface MultipleChoiceMathQuestion extends BaseMathQuestion {
    variant: 'multiple_choice';
    operand1: number;
    operand2: number;
    options: MultipleChoiceMathOption[];
    answer: number; // The correct value
}

export type MathQuestion = StandardMathQuestion | BalancingEquationQuestion | MultipleChoiceMathQuestion;


// =================================================================
// COMPARISON QUESTION TYPES (NEW STRUCTURE)
// =================================================================
export interface BaseComparisonQuestion extends BaseQuestion {
  type: 'comparison';
  answer: '<' | '>' | '=';
}

export interface StandardComparisonQuestion extends BaseComparisonQuestion {
    variant: 'standard';
    number1: number;
    number2: number;
}

export interface ExpressionComparisonQuestion extends BaseComparisonQuestion {
    variant: 'expression_comparison';
    // e.g. 3 + 4 [?] 8
    expOperand1: number;
    expOperand2: number;
    expOperator: '+' | '-';
    compareTo: number;
}

export type ComparisonQuestion = StandardComparisonQuestion | ExpressionComparisonQuestion;

export type ShapeType = string; // Emoji string

// New interface for rich icon data, to be used by OddOneOut and VisualPattern
export interface IconData {
  emoji: ShapeType;
  name: string; // Vietnamese name for explanations
  primaryCategory: 'animal' | 'plant' | 'food' | 'drink' | 'vehicle' | 'clothing' | 'tool' | 'household' | 'nature' | 'celestial' | 'activity' | 'technology' | 'toy' | 'instrument' | 'building' | 'misc' | 'shape_color';
  subCategory?: 'mammal' | 'bird' | 'reptile' | 'amphibian' | 'fish' | 'insect' | 'invertebrate' | 'fruit' | 'vegetable' | 'flower' | 'tree' | 'dish' | 'dessert' | 'furniture' | 'appliance' | 'land_vehicle' | 'water_vehicle' | 'air_vehicle' | 'sports_equipment' | 'school_supply' | 'shape' | 'toy' | 'technology';
  tertiaryCategory?: 'pet' | 'livestock' | 'wild_animal' | 'poultry';
  attributes: {
    color?: ('red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'brown' | 'black' | 'white' | 'gray' | 'multi_color')[];
    is_living_organism?: boolean;
    is_edible?: boolean;
    environment?: 'land' | 'water' | 'sky' | 'underwater' | 'indoor' | 'space';
    can_fly?: boolean;
    propulsion?: 'road' | 'rail';
    diet?: 'carnivore' | 'herbivore' | 'omnivore';
    is_real?: boolean;
    temperature?: 'hot' | 'cold';
    power_source?: 'electric' | 'manual';
    function?: 'write' | 'cut' | 'cook' | 'eat' | 'sit' | 'clean';
  }
}

export interface CountingQuestion extends BaseQuestion {
  type: 'counting';
  shapes: ShapeType[]; 
  iconType: ShapeType; 
  answer: number; 
}

// For Number Recognition
export interface NumberRecognitionOption {
  id: string;
  display: ShapeType[] | string; // Array of emojis for item groups, or a number string
  isCorrect: boolean;
}
export interface NumberRecognitionQuestion extends BaseQuestion {
  type: 'number_recognition';
  variant: 'number-to-items' | 'items-to-number'; // Type of recognition task
  targetNumber?: number; // For number-to-items
  targetItems?: ShapeType[]; // For items-to-number
  targetItemIcon?: ShapeType; // For items-to-number, to display the prompt "How many X?"
  options: NumberRecognitionOption[];
}

// For Matching Pairs
export interface MatchableItem {
  id: string; // Unique ID for this item on the board
  matchId: string; // ID used to find its pair
  display: string; // Emoji, number as string, or dots as string
  type: 'matching_pairs_element'; // General type for elements within a matching pairs question
  visualType: 'digit' | 'dots' | 'emoji_icon'; // Specific visual representation
  isMatched: boolean; // Has this item been successfully matched?
  isSelected: boolean; // Is this item currently selected by the user?
}
export interface MatchingPairsQuestion extends BaseQuestion {
  type: 'matching_pairs';
  items: MatchableItem[]; // All items to be displayed on the board, shuffled
}

// =================================================================
// NUMBER SEQUENCE QUESTION TYPES (NEW STRUCTURE)
// =================================================================
export type SequenceTheme = 'train' | 'steps' | 'default';

export interface NumberSequenceBase extends BaseQuestion {
  type: 'number_sequence';
  theme: SequenceTheme;
}

export interface FillInTheBlanksQuestion extends NumberSequenceBase {
  variant: 'fill_in_the_blanks';
  fullSequence: number[]; // The complete, correct sequence
  rule: {
    type: 'skip_counting';
    step: number; // e.g., 1, -1, 2
  };
  sequence: (number | null)[]; // Sequence with nulls for blanks
  answers: number[]; // Correct answers for the blanks, in order
}

export interface FindAndFixErrorQuestion extends NumberSequenceBase {
  variant: 'find_and_fix_error';
  fullSequence: number[]; // The complete, correct sequence
  rule: {
    type: 'skip_counting';
    step: number; // e.g., 1, -1, 2
  };
  sequenceWithErrors: number[]; // Sequence with incorrect numbers
  errors: Record<number, number>; // Map of incorrect index to its correct value, e.g., { 3: 4 }
}

export interface SortSequenceQuestion extends NumberSequenceBase {
  variant: 'sort_sequence';
  scrambledSequence: number[];
  fullSequence: number[]; // The sorted sequence is the answer
  sortOrder: 'asc' | 'desc'; // Explicitly define the sorting order
}

export type NumberSequenceQuestion = FillInTheBlanksQuestion | FindAndFixErrorQuestion | SortSequenceQuestion;

// For Visual Pattern
export interface VisualPatternOption {
  id: string;
  emoji: ShapeType;
  isCorrect: boolean;
}

export interface VisualPatternQuestion extends BaseQuestion {
  type: 'visual_pattern';
  displayedSequence: ShapeType[];
  options: VisualPatternOption[];
  explanation: string; // The logic behind the correct answer
}

// For Odd One Out
export interface OddOneOutOption {
  id: string;
  emoji: ShapeType;
}

export interface OddOneOutQuestion extends BaseQuestion {
  type: 'odd_one_out';
  options: OddOneOutOption[]; // All items displayed to the user
  correctAnswerId: string;    // The ID of the OddOneOutOption that is the correct answer
  explanation: string; // The logic behind the correct answer
}

export type Question = 
  | MathQuestion 
  | ComparisonQuestion 
  | CountingQuestion 
  | NumberRecognitionQuestion 
  | MatchingPairsQuestion 
  | NumberSequenceQuestion 
  | VisualPatternQuestion
  | OddOneOutQuestion; // Added OddOneOutQuestion

export interface IncorrectAttempt {
  question: Question; 
  userAnswer: string | string[]; // Can be a single string or an array for multiple blanks or selected option ID
}

export interface StoredSession {
  id: string;
  timestamp: number;
  incorrectAttempts: IncorrectAttempt[];
  score: number;
  totalQuestions: number;
  difficulty?: DifficultyLevel; // Optionally store difficulty of the session
}

export interface EndGameMessageInfo {
  text: string;
  type: 'congrats' | 'encourage';
  icons: string[];
  timeTaken?: number | null; // Optional: for timed modes
}

export interface ImageSet {
  id: string;
  name: string;
  starsRequired: number;
  icons: ShapeType[];
}

// For useGameLogic hook
export interface GameLogicState {
  questions: Question[];
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  score: number;
  starsEarnedThisRound: number;
  incorrectAttempts: IncorrectAttempt[];
  incorrectAttemptsCount: number;
  feedbackMessage: string | null;
  feedbackType: 'positive' | 'encouraging' | null;
  isInputDisabled: boolean;
  lastSubmittedAnswer: string | number | string[] | null; 
  currentMatchingQuestionState: MatchingPairsQuestion | null;
  showEndGameOverlay: boolean;
  endGameMessageInfo: EndGameMessageInfo | null;
  progressPercent: number;
  gameModeTitle: string;
  isLoading: boolean;
  numQuestionsForRound: number; 
  // For timed mode
  gameStatus: 'idle' | 'countdown' | 'playing' | 'ended';
  timeLeft: number | null;
  totalTime: number | null;
}

export interface GameLogicActions {
  submitAnswer: (userAnswer: string | number | string[]) => void; 
  selectMatchingPairItem: (itemId: string) => void;
  confirmEndGameAndNavigate: () => void;
  goToNextQuestionAfterFeedback: () => void; 
  startGame: () => void; // To start the timer after countdown
}