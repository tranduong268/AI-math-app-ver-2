import { Question } from '../../../types';

export interface QuestionComponentProps<T extends Question = Question> {
  question: T;
  onAnswer: (answer: string | number | string[]) => void;
  disabled: boolean;
  lastAnswer?: string | number | string[];
}
