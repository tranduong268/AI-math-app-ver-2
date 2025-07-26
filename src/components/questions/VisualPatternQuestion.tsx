
import React, { useState, useEffect } from 'react';
import { VisualPatternQuestion } from '../../../types';
import { useAudio } from '../../contexts/AudioContext';
import { theme } from '../../config/theme';
import { QuestionComponentProps } from './QuestionProps';
import PatternMatrix from './PatternMatrix';
import PatternHints from './PatternHints';

const VisualPatternDisplay: React.FC<QuestionComponentProps<VisualPatternQuestion>> = ({ question, onAnswer, disabled, lastAnswer }) => {
  const { playSound } = useAudio();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const handleOptionClick = (optionId: string) => {
    if (disabled) return;
    setSelectedOption(optionId);
    playSound('BUTTON_CLICK');
    onAnswer(optionId);
  };
  
  const correctOption = question.options.find(opt => opt.isCorrect);
  const answeredCorrectly = disabled && lastAnswer === correctOption?.id;

  useEffect(() => {
    if (answeredCorrectly) {
      setTimeout(() => setShowExplanation(true), 500);
    }
  }, [answeredCorrectly]);

  // Detect if this is a matrix pattern (more than 6 items)
  const isMatrixPattern = question.displayedSequence.length > 6;
  const sequenceLength = question.displayedSequence.length;

  return (
      <div className="flex flex-col items-center w-full space-y-6">
          <p className={`text-xl md:text-2xl lg:text-3xl font-semibold ${theme.colors.text.secondary} text-center max-w-2xl`}>
            {question.promptText}
          </p>
          
          {/* Pattern Hints */}
          {!disabled && (
            <PatternHints 
              gameType="visual_pattern" 
              difficulty="medium" 
              showHints={true}
            />
          )}
          
          {/* Enhanced Sequence Display */}
                     {isMatrixPattern ? (
             // Matrix Layout for larger sequences
             <PatternMatrix 
               sequence={question.displayedSequence} 
               cols={3} 
               showNumbers={true} 
               animated={true} 
             />
           ) : (
            // Linear Layout for shorter sequences
            <div className="relative w-full max-w-4xl">
              <div className={`flex flex-wrap items-center justify-center gap-3 md:gap-4 p-4 ${theme.colors.bg.visualPatternSequenceBg} rounded-xl shadow-lg border-2 border-sky-200 relative overflow-hidden`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="grid grid-cols-8 h-full">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div key={i} className="border border-sky-300"></div>
                    ))}
                  </div>
                </div>
                
                {/* Sequence Items */}
                {question.displayedSequence.map((emoji, index) => (
                  <div 
                    key={index}
                    className="relative pattern-sequence-item transform transition-all duration-300 hover:scale-110"
                  >
                    <div className={`${theme.colors.bg.visualPatternMatrixCell} rounded-lg p-3 shadow-md border border-gray-200`}>
                      <span className={`${theme.fontSizes.visualPatternOption} select-none block`}>
                        {emoji}
                      </span>
                    </div>
                    {/* Sequence Number */}
                    <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                  </div>
                ))}
                
                {/* Question Mark with Enhanced Animation */}
                <div className="relative">
                  <div className={`${theme.colors.bg.visualPatternMatrixBlank} ${theme.colors.border.visualPatternMatrixBlank} border-2 border-dashed rounded-lg p-3 shadow-md flex items-center justify-center animate-pulse`}>
                    <span className="text-4xl md:text-5xl lg:text-6xl text-pink-500 font-bold select-none animate-bounce">
                      ?
                    </span>
                  </div>
                  {/* Arrow pointing to question mark */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                    <div className="bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                      Tiếp theo?
                    </div>
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-pink-100 mx-auto"></div>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(sequenceLength / (sequenceLength + 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Enhanced Options Display */}
          <div className="w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">Chọn đáp án đúng:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {question.options.map((option, index) => {
                  const isCorrect = option.isCorrect;
                  const wasSelected = selectedOption === option.id || lastAnswer === option.id;
                  const isSelectedCorrect = wasSelected && isCorrect;
                  const isSelectedIncorrect = wasSelected && !isCorrect && disabled;
                  
                  return (
                      <button
                          key={option.id}
                          onClick={() => handleOptionClick(option.id)}
                          disabled={disabled}
                          className={`relative group p-4 rounded-xl shadow-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed min-h-[120px] flex flex-col items-center justify-center aspect-square overflow-hidden
                              ${isSelectedCorrect ? 
                                `${theme.buttons.optionCorrect} ring-4 ${theme.colors.border.answerCorrect} animate-pulse` : 
                                isSelectedIncorrect ?
                                `${theme.buttons.optionIncorrect} ring-4 ${theme.colors.border.answerIncorrect} animate-shake` :
                                disabled && isCorrect ?
                                `${theme.buttons.optionCorrect} ring-4 ${theme.colors.border.answerCorrect}` :
                                'bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300'}`}
                           aria-label={`Lựa chọn ${option.emoji}`}
                      >
                          {/* Background Pattern for Option */}
                          <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100"></div>
                          </div>
                          
                          {/* Option Content */}
                          <div className="relative z-10 flex flex-col items-center space-y-2">
                            <span className={`${theme.fontSizes.visualPatternOption} transition-transform group-hover:scale-110`}>
                              {option.emoji}
                            </span>
                            <div className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {String.fromCharCode(65 + index)}
                            </div>
                          </div>
                          
                          {/* Selection Indicator */}
                          {wasSelected && (
                            <div className="absolute top-2 right-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold
                                ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                                {isCorrect ? '✓' : '✗'}
                              </div>
                            </div>
                          )}
                          
                          {/* Hover Effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      </button>
                  );
                })}
            </div>
          </div>

          {/* Enhanced Explanation Display */}
          {showExplanation && answeredCorrectly && question.explanation && (
               <div className="w-full max-w-2xl transform transition-all duration-500 ease-out">
                  <div className={`text-base md:text-lg font-medium text-green-800 ${theme.colors.bg.feedbackPositive} p-4 rounded-xl shadow-lg border-l-4 border-green-500 relative overflow-hidden`}>
                      {/* Background Pattern */}
                      <div className="absolute top-0 right-0 text-green-200 text-6xl opacity-20">🎉</div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-green-600 text-xl">💡</span>
                          <h4 className="font-bold text-green-700">Giải thích:</h4>
                        </div>
                        <p className="leading-relaxed">{question.explanation}</p>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
};

export default VisualPatternDisplay;