
import React, { useState, useEffect } from 'react';
import { OddOneOutQuestion } from '../../../types';
import { useAudio } from '../../contexts/AudioContext';
import { theme } from '../../config/theme';
import { QuestionComponentProps } from './QuestionProps';
import PatternHints from './PatternHints';

const OddOneOutDisplay: React.FC<QuestionComponentProps<OddOneOutQuestion>> = ({ question, onAnswer, disabled, lastAnswer }) => {
  const { playSound } = useAudio();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [highlightPattern, setHighlightPattern] = useState(false);

  const handleOptionClick = (optionId: string) => {
    if (disabled) return;
    setSelectedOption(optionId);
    playSound('BUTTON_CLICK');
    onAnswer(optionId);
  };
  
  const numOptions = question.options.length;
  let gridColsClass = 'grid-cols-2 sm:grid-cols-4'; // Default for 4 options
  if (numOptions === 3) gridColsClass = 'grid-cols-3';
  else if (numOptions === 5) gridColsClass = 'grid-cols-3 sm:grid-cols-5';
  else if (numOptions === 6) gridColsClass = 'grid-cols-2 sm:grid-cols-3';

  const answeredCorrectly = disabled && lastAnswer === question.correctAnswerId;

  useEffect(() => {
    if (answeredCorrectly) {
      setTimeout(() => {
        setShowExplanation(true);
        setHighlightPattern(true);
      }, 500);
    }
  }, [answeredCorrectly]);

  // Animation for highlighting similar items
  useEffect(() => {
    if (highlightPattern) {
      const timer = setTimeout(() => setHighlightPattern(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightPattern]);

  return (
      <div className="flex flex-col items-center w-full space-y-6">
          <div className="text-center space-y-2">
            <p className={`text-xl md:text-2xl lg:text-3xl font-semibold ${theme.colors.text.secondary} max-w-2xl`}>
              {question.promptText}
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                Tìm vật khác biệt
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{numOptions} lựa chọn</span>
            </div>
                     </div>

          {/* Pattern Hints */}
          {!disabled && (
            <PatternHints 
              gameType="odd_one_out" 
              difficulty="medium" 
              showHints={true}
            />
          )}

          {/* Enhanced Options Grid */}
          <div className="relative w-full max-w-4xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="grid grid-cols-6 h-full gap-1">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="bg-indigo-200 rounded-sm"></div>
                ))}
              </div>
            </div>

            <div className={`grid ${gridColsClass} gap-4 md:gap-6 relative z-10 p-4`}>
                {question.options.map((option, index) => {
                    const isCorrect = option.id === question.correctAnswerId;
                    const wasSelected = selectedOption === option.id || lastAnswer === option.id;
                    const isSelectedCorrect = wasSelected && isCorrect;
                    const isSelectedIncorrect = wasSelected && !isCorrect && disabled;
                    const shouldHighlight = highlightPattern && !isCorrect;

                    return (
                                                 <div 
                           key={option.id}
                           className="relative group odd-option-item"
                         >
                          <button
                              onClick={() => handleOptionClick(option.id)}
                              disabled={disabled}
                              className={`relative w-full rounded-2xl shadow-lg font-semibold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl disabled:cursor-not-allowed flex items-center justify-center p-6 min-h-[120px] md:min-h-[140px] aspect-square overflow-hidden
                                  ${isSelectedCorrect ? 
                                    `${theme.buttons.optionCorrect} ring-4 ${theme.colors.border.answerCorrect} animate-pulse scale-105` : 
                                    isSelectedIncorrect ?
                                    `${theme.buttons.optionIncorrect} ring-4 ${theme.colors.border.answerIncorrect} animate-shake` :
                                    disabled && isCorrect ?
                                    `${theme.buttons.optionCorrect} ring-4 ${theme.colors.border.answerCorrect} scale-105` :
                                    shouldHighlight ?
                                    'bg-blue-100 border-2 border-blue-300 animate-pulse' :
                                    `${theme.colors.bg.oddOneOutDefault} hover:bg-indigo-300 border-2 border-indigo-200 hover:border-indigo-400`}`}
                               aria-label={`Lựa chọn ${index + 1}: ${option.emoji}`}
                          >
                              {/* Dynamic Background Pattern */}
                              <div className="absolute inset-0 opacity-20 transition-all duration-300">
                                <div className={`w-full h-full bg-gradient-to-br ${
                                  isCorrect ? 'from-red-100 to-orange-100' : 
                                  'from-indigo-100 to-purple-100'
                                } group-hover:from-indigo-200 group-hover:to-purple-200`}></div>
                              </div>

                              {/* Ripple Effect on Hover */}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute top-1/2 left-1/2 w-0 h-0 bg-white/30 rounded-full group-hover:w-full group-hover:h-full group-hover:-translate-x-1/2 group-hover:-translate-y-1/2 transition-all duration-500"></div>
                              </div>
                              
                              {/* Option Content */}
                              <div className="relative z-10 flex flex-col items-center space-y-3">
                                <span className={`${theme.fontSizes.oddOneOutOption} transition-all duration-300 group-hover:scale-110 ${
                                  isCorrect && highlightPattern ? 'animate-bounce' : ''
                                }`}>
                                  {option.emoji}
                                </span>
                                
                                {/* Option Label */}
                                <div className="flex flex-col items-center space-y-1">
                                  <div className="text-xs font-bold text-indigo-600 bg-white/80 px-2 py-1 rounded-full shadow-sm">
                                    {String.fromCharCode(65 + index)}
                                  </div>
                                  {isCorrect && highlightPattern && (
                                    <div className="text-xs text-red-600 font-bold animate-pulse">
                                      KHÁC BIỆT!
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Selection Indicator */}
                              {wasSelected && (
                                <div className="absolute top-3 right-3 z-20">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg transform transition-all duration-300 ${
                                    isCorrect ? 'bg-green-500 scale-110' : 'bg-red-500 animate-shake'
                                  }`}>
                                    {isCorrect ? '✓' : '✗'}
                                  </div>
                                </div>
                              )}

                              {/* Correct Answer Highlight */}
                              {disabled && isCorrect && (
                                <div className="absolute inset-0 border-4 border-green-400 rounded-2xl animate-pulse"></div>
                              )}

                              {/* Similarity Indicator for Wrong Answers */}
                              {highlightPattern && !isCorrect && (
                                <div className="absolute bottom-2 left-2 right-2">
                                  <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full text-center animate-pulse">
                                    Giống nhau
                                  </div>
                                </div>
                              )}
                          </button>

                          {/* Option Number Badge */}
                          <div className="absolute -top-2 -left-2 bg-indigo-500 text-white text-sm rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg z-30">
                            {index + 1}
                          </div>
                        </div>
                    );
                })}
            </div>

            {/* Progress Indicator */}
            <div className="mt-4 flex justify-center">
              <div className="flex space-x-1">
                {question.options.map((_, index) => (
                  <div 
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      disabled ? 'bg-green-400' : 'bg-gray-300'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Enhanced Explanation Display */}
          {showExplanation && answeredCorrectly && question.explanation && (
               <div className="w-full max-w-2xl transform transition-all duration-500 ease-out">
                  <div className={`text-base md:text-lg font-medium text-green-800 ${theme.colors.bg.feedbackPositive} p-4 rounded-xl shadow-lg border-l-4 border-green-500 relative overflow-hidden`}>
                      {/* Background Decoration */}
                      <div className="absolute top-0 right-0 text-green-200 text-6xl opacity-20">🎯</div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-green-600 text-xl">🔍</span>
                          <h4 className="font-bold text-green-700">Tại sao đây là đáp án đúng?</h4>
                        </div>
                        <p className="leading-relaxed">{question.explanation}</p>
                        
                        {/* Tips Section */}
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <div className="flex items-start space-x-2">
                            <span className="text-green-600 text-sm">💡</span>
                            <p className="text-sm text-green-700 italic">
                              Mẹo: Hãy tìm điểm khác biệt về màu sắc, hình dạng, kích thước hoặc nhóm đối tượng!
                            </p>
                          </div>
                        </div>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
};

export default OddOneOutDisplay;