
import React, { useState, useEffect } from 'react';
import { ComparisonQuestion, StandardComparisonQuestion, ExpressionComparisonQuestion } from '../../../types';
import { useAudio } from '../../contexts/AudioContext';
import { theme } from '../../config/theme';
import { QuestionComponentProps } from './QuestionProps';

// --- Standard Comparison Display (A vs B) ---
const StandardComparisonDisplay: React.FC<QuestionComponentProps<StandardComparisonQuestion>> = ({ question, onAnswer, disabled, lastAnswer }) => {
  const [displayOperator, setDisplayOperator] = useState<string | null>(null);

  useEffect(() => {
    if (!disabled) {
      setDisplayOperator(null);
    } else if (typeof lastAnswer === 'string' && ['<', '>', '='].includes(lastAnswer)) {
      setDisplayOperator(lastAnswer);
    }
  }, [question.id, disabled, lastAnswer]);

  return (
    <div className="flex items-center justify-center space-x-1 md:space-x-2 lg:space-x-4">
      <span className={`${theme.fontSizes.mathOperand} font-bold ${theme.colors.text.operand}`}>{question.number1}</span>
      <div className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 border border-dashed border-gray-400 rounded-lg flex items-center justify-center ${theme.fontSizes.comparisonAnswerBox} font-bold ${theme.colors.text.comparisonAnswer}`}>
        {displayOperator || ''}
      </div>
      <span className={`${theme.fontSizes.mathOperand} font-bold ${theme.colors.text.operand}`}>{question.number2}</span>
    </div>
  );
};

// --- Expression Comparison Display (A+B vs C) ---
const ExpressionComparisonDisplay: React.FC<QuestionComponentProps<ExpressionComparisonQuestion>> = ({ question, onAnswer, disabled, lastAnswer }) => {
  const [displayOperator, setDisplayOperator] = useState<string | null>(null);

  useEffect(() => {
    if (!disabled) {
      setDisplayOperator(null);
    } else if (typeof lastAnswer === 'string' && ['<', '>', '='].includes(lastAnswer)) {
      setDisplayOperator(lastAnswer);
    }
  }, [question.id, disabled, lastAnswer]);
  
  const expressionText = `${question.expOperand1} ${question.expOperator} ${question.expOperand2}`;
  
  return (
    <div className="flex items-center justify-center space-x-1 md:space-x-2 lg:space-x-4">
      <div className={`py-2 px-3 md:px-4 rounded-lg bg-white shadow-inner ${theme.fontSizes.mathOperand} font-bold ${theme.colors.text.operand}`}>
        {expressionText}
      </div>
      <div className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 border border-dashed border-gray-400 rounded-lg flex items-center justify-center ${theme.fontSizes.comparisonAnswerBox} font-bold ${theme.colors.text.comparisonAnswer}`}>
        {displayOperator || ''}
      </div>
      <span className={`${theme.fontSizes.mathOperand} font-bold ${theme.colors.text.operand}`}>{question.compareTo}</span>
    </div>
  );
};

// --- Main Component ---
const ComparisonQuestionDisplay: React.FC<QuestionComponentProps<ComparisonQuestion>> = (props) => {
  const { question, onAnswer, disabled, lastAnswer } = props;
  const { playSound } = useAudio();
  const [displayOperator, setDisplayOperator] = useState<string | null>(null);

  useEffect(() => {
    if (!disabled) {
      setDisplayOperator(null);
    } else if (typeof lastAnswer === 'string' && ['<', '>', '='].includes(lastAnswer)) {
      setDisplayOperator(lastAnswer);
    }
  }, [question.id, disabled, lastAnswer]);

  const handleOperatorClick = (operator: '<' | '>' | '=') => {
    if (disabled) return;
    playSound('BUTTON_CLICK');
    setDisplayOperator(operator);
    onAnswer(operator);
  };

  const renderQuestionVariant = () => {
    switch (question.variant) {
      case 'standard':
        return <StandardComparisonDisplay {...props as QuestionComponentProps<StandardComparisonQuestion>} />;
      case 'expression_comparison':
        return <ExpressionComparisonDisplay {...props as QuestionComponentProps<ExpressionComparisonQuestion>} />;
      default:
        return <div>Loại câu hỏi so sánh không xác định.</div>;
    }
  };

  return (
    <div className='w-full flex flex-col items-center'>
      <div className={`${theme.colors.bg.questionSubtle} p-3 md:p-4 lg:p-5 rounded-lg shadow-sm w-full mb-4`}>
        {renderQuestionVariant()}
      </div>
      <div className="flex justify-center space-x-3 md:space-x-4 lg:space-x-5 mt-4 md:mt-6">
        {(['<', '>', '='] as Array<'<' | '>' | '='>).map((op) => (
          <button
            key={op}
            onClick={() => handleOperatorClick(op)}
            disabled={disabled}
            className={`${theme.buttons.base} ${theme.buttons.comparisonOperator} ${theme.fontSizes.comparisonOperatorButton} ${displayOperator === op && disabled ? `ring-4 ${theme.colors.border.answerCorrect}` : ''}`}
          >
            {op}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ComparisonQuestionDisplay;