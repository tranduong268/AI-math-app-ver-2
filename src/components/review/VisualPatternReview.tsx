
import React from 'react';
import { VisualPatternQuestion } from '../../../types';
import { theme } from '../../config/theme';
import { AttemptReviewProps } from './AttemptReviewProps';
import AnswerDisplay from './AnswerDisplay';

const VisualPatternReview: React.FC<AttemptReviewProps> = ({ attempt }) => {
  const q = attempt.question as VisualPatternQuestion;

  const questionPreview = (
    <div className="text-center my-4 space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
        <p className={`text-md md:text-lg lg:text-xl font-medium ${theme.colors.text.secondary} mb-3`}>
          {q.promptText}
        </p>
        
        {/* Enhanced Sequence Display */}
        <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 max-w-lg mx-auto p-4 bg-white/80 rounded-xl shadow-sm border border-gray-200">
          {q.displayedSequence.map((emoji, index) => (
            <div key={index} className="relative">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 shadow-sm transition-all hover:shadow-md">
                <span className="text-2xl md:text-3xl p-0.5 select-none block">{emoji}</span>
              </div>
              {/* Sequence number */}
              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {index + 1}
              </div>
            </div>
          ))}
          
          {/* Enhanced Question Mark */}
          <div className="relative">
            <div className="bg-pink-50 border-2 border-dashed border-pink-300 rounded-lg p-2 shadow-sm">
              <span className="text-2xl md:text-3xl p-0.5 text-pink-500 font-bold select-none block animate-pulse">?</span>
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                Cần tìm
              </div>
            </div>
          </div>
        </div>
        
        {/* Pattern Progress Bar */}
        <div className="mt-4 mx-auto max-w-sm">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(q.displayedSequence.length / (q.displayedSequence.length + 1)) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Tiến độ dãy: {q.displayedSequence.length}/{q.displayedSequence.length + 1}
          </p>
        </div>
      </div>
    </div>
  );

  const selectedOpt = q.options.find(opt => opt.id === attempt.userAnswer);
  const correctOpt = q.options.find(opt => opt.isCorrect);

  const userAnswerDisplay = selectedOpt 
    ? (
        <div className="flex flex-col items-center space-y-2">
          <span className="text-4xl font-bold">{selectedOpt.emoji}</span>
          <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            Bạn đã chọn
          </div>
        </div>
      )
    : (
        <div className="flex flex-col items-center space-y-2">
          <span className="text-2xl text-gray-400">❌</span>
          <span className="text-sm text-gray-500">Không chọn</span>
        </div>
      );

  const correctAnswerDisplay = correctOpt 
    ? (
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <span className="text-4xl font-bold">{correctOpt.emoji}</span>
            <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              ✓
            </div>
          </div>
          <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            Đáp án đúng
          </div>
          
          {q.explanation && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg max-w-xs">
              <div className="flex items-start space-x-2">
                <span className="text-green-600 text-sm">💡</span>
                <div>
                  <h5 className="text-sm font-bold text-green-700 mb-1">Giải thích:</h5>
                  <p className="text-xs text-green-700 leading-relaxed">
                    {q.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) 
    : (
        <span className="text-gray-500">Không tìm thấy đáp án</span>
      );

  return (
    <div className="space-y-4">
      {questionPreview}
      <div className="bg-gray-50 p-4 rounded-xl">
        <AnswerDisplay
          userAnswerDisplay={userAnswerDisplay}
          correctAnswerDisplay={correctAnswerDisplay}
          isCorrectSimple={attempt.isCorrect}
        />
      </div>
    </div>
  );
};

export default VisualPatternReview;