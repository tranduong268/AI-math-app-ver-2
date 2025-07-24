
import React from 'react';
import { ComparisonQuestion, StandardComparisonQuestion, ExpressionComparisonQuestion } from '../../../types';
import { theme } from '../../config/theme';
import { AttemptReviewProps } from './AttemptReviewProps';
import AnswerDisplay from './AnswerDisplay';

const renderStandardReview = (question: StandardComparisonQuestion) => (
    <div className="flex items-center justify-center space-x-1 md:space-x-2 lg:space-x-3 my-2">
        <span className={`${theme.fontSizes.reviewMathOperand} font-bold ${theme.colors.text.operand}`}>{question.number1}</span>
        <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 border-2 border-dashed border-gray-400 rounded-md flex items-center justify-center text-2xl md:text-3xl lg:text-4xl font-bold text-purple-500">
            _
        </div>
        <span className={`${theme.fontSizes.reviewMathOperand} font-bold ${theme.colors.text.operand}`}>{question.number2}</span>
    </div>
);

const renderExpressionReview = (question: ExpressionComparisonQuestion) => {
    const expressionText = `${question.expOperand1} ${question.expOperator} ${question.expOperand2}`;
    return (
        <div className="flex items-center justify-center space-x-1 md:space-x-2 lg:space-x-3 my-2">
            <div className={`py-1 px-2 rounded-lg bg-gray-200 ${theme.fontSizes.reviewMathOperand} font-bold ${theme.colors.text.operand}`}>
                {expressionText}
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 border-2 border-dashed border-gray-400 rounded-md flex items-center justify-center text-2xl md:text-3xl lg:text-4xl font-bold text-purple-500">
                _
            </div>
            <span className={`${theme.fontSizes.reviewMathOperand} font-bold ${theme.colors.text.operand}`}>{question.compareTo}</span>
        </div>
    );
};

const ComparisonReview: React.FC<AttemptReviewProps> = ({ attempt }) => {
  const q = attempt.question as ComparisonQuestion;
  
  const questionPreview = q.variant === 'expression_comparison'
    ? renderExpressionReview(q)
    : renderStandardReview(q as StandardComparisonQuestion);

  const userAnswerDisplay = <span className={theme.fontSizes.reviewUserAnswer}>{attempt.userAnswer}</span>;
  const correctAnswerStyle = `font-bold ${theme.colors.text.positive} ${theme.fontSizes.reviewComparisonAnswer}`;
  const correctAnswerDisplay = <strong className={correctAnswerStyle}>{q.answer}</strong>;

  return (
    <div>
      {questionPreview}
      <AnswerDisplay
        userAnswerDisplay={userAnswerDisplay}
        correctAnswerDisplay={correctAnswerDisplay}
        isCorrectSimple={false}
      />
    </div>
  );
};

export default ComparisonReview;