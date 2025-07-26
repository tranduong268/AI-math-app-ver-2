import React, { useState } from 'react';

interface PatternHintsProps {
  gameType: 'visual_pattern' | 'odd_one_out';
  difficulty?: 'easy' | 'medium' | 'hard';
  showHints?: boolean;
}

const PatternHints: React.FC<PatternHintsProps> = ({ 
  gameType, 
  difficulty = 'medium', 
  showHints = true 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const visualPatternHints = [
    "🔍 Quan sát thứ tự của các hình ảnh",
    "🔄 Tìm kiếm quy luật lặp lại",
    "📈 Chú ý đến sự thay đổi dần dần", 
    "🎨 Xem xét màu sắc và hình dạng",
    "🔢 Đếm số lượng các yếu tố"
  ];

  const oddOneOutHints = [
    "🎯 Tìm điểm khác biệt rõ ràng nhất",
    "🏷️ Nhóm các vật giống nhau lại",
    "🌈 So sánh màu sắc và kích thước",
    "📚 Xem xét loại và nhóm đối tượng",
    "⚡ Tin vào cảm giác đầu tiên"
  ];

  const currentHints = gameType === 'visual_pattern' ? visualPatternHints : oddOneOutHints;
  const gameTitle = gameType === 'visual_pattern' ? 'Tìm Quy Luật' : 'Tìm Khác Biệt';

  if (!showHints) return null;

  return (
    <div className="w-full max-w-md mx-auto mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-gradient-to-r from-yellow-100 to-orange-100 hover:from-yellow-200 hover:to-orange-200 border border-yellow-300 rounded-lg p-3 transition-all duration-300 shadow-sm hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">💡</span>
            <span className="font-medium text-gray-700">
              Mẹo chơi {gameTitle}
            </span>
          </div>
          <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${
        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="bg-white border border-yellow-200 rounded-b-lg p-4 shadow-sm">
          <div className="space-y-3">
            <div className="space-y-2">
              {currentHints.map((hint, index) => (
                <div 
                  key={index}
                  className="flex items-start space-x-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                >
                  <span className="text-xs font-bold text-gray-400 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700 leading-relaxed">
                    {hint}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">🎮</span>
                <p className="text-xs text-blue-700 font-medium">
                  Hãy thử nghiệm và đừng ngại sai! Mỗi lần thử đều giúp bé học hỏi thêm.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternHints;