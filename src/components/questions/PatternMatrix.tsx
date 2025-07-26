import React from 'react';
import { theme } from '../../config/theme';

interface PatternMatrixProps {
  sequence: string[];
  cols?: number;
  showNumbers?: boolean;
  animated?: boolean;
}

const PatternMatrix: React.FC<PatternMatrixProps> = ({ 
  sequence, 
  cols = 3, 
  showNumbers = true, 
  animated = true 
}) => {
  const gridClass = `grid grid-cols-${cols} gap-3`;
  
  return (
    <div className="relative">
      <div className={`${gridClass} p-4 ${theme.colors.bg.visualPatternSequenceBg} rounded-xl shadow-lg border-2 border-sky-200`}>
        {sequence.map((emoji, index) => (
          <div 
            key={index} 
            className={`${theme.colors.bg.visualPatternMatrixCell} ${theme.colors.border.visualPatternMatrixCell} border-2 rounded-lg p-3 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 ${
              animated ? 'pattern-sequence-item' : ''
            } relative group`}
          >
            {/* Background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-70 transition-opacity duration-300 rounded-lg"></div>
            
            {/* Content */}
            <div className="relative z-10 flex flex-col items-center space-y-2">
              <span className={`${theme.fontSizes.visualPatternMatrixItem} select-none text-center transition-transform group-hover:scale-110`}>
                {emoji}
              </span>
              
              {showNumbers && (
                <div className="text-xs font-bold text-gray-500 bg-white/80 px-2 py-1 rounded-full shadow-sm">
                  {index + 1}
                </div>
              )}
            </div>
            
            {/* Hover effect */}
            <div className="absolute inset-0 border-2 border-blue-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        ))}
        
        {/* Question mark cell */}
        <div className={`${theme.colors.bg.visualPatternMatrixBlank} ${theme.colors.border.visualPatternMatrixBlank} border-2 border-dashed rounded-lg p-3 shadow-sm flex items-center justify-center animate-pulse relative group`}>
          {/* Background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-orange-50 opacity-70 rounded-lg"></div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center space-y-2">
            <span className="text-4xl md:text-5xl text-pink-500 font-bold select-none animate-bounce">
              ?
            </span>
            {showNumbers && (
              <div className="text-xs font-bold text-pink-600 bg-pink-100 px-2 py-1 rounded-full">
                {sequence.length + 1}
              </div>
            )}
          </div>
          
          {/* Pulsing border effect */}
          <div className="absolute inset-0 border-2 border-pink-400 rounded-lg animate-pulse"></div>
        </div>
      </div>
      
      {/* Matrix info */}
      <div className="mt-3 text-center">
        <div className="inline-flex items-center space-x-2 bg-white/80 px-3 py-1 rounded-full text-xs text-gray-600 border border-gray-200">
          <span>📊</span>
          <span>Ma trận {cols}×{Math.ceil((sequence.length + 1) / cols)}</span>
        </div>
      </div>
    </div>
  );
};

export default PatternMatrix;