// src/services/aiService.ts

import { DifficultyLevel, GameMode, Question, IconData, ShapeType } from '../../types';

export const generateAiQuestionsBatch = async (
    mode: GameMode,
    difficulty: DifficultyLevel,
    numQuestions: number,
    availableIcons: IconData[]
): Promise<{ questions: Question[], iconsUsed: ShapeType[] }> => {
    try {
        // Lệnh fetch này trỏ đến hàm serverless của Vercel tại địa chỉ /api/generate.ts
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mode,
                difficulty,
                numQuestions,
                availableIcons,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Không thể phân tích lỗi từ server.' }));
            console.error(`Lỗi gọi API đến serverless function với status ${response.status}:`, errorData);
            // Trả về mảng rỗng để UI có thể hiển thị thông báo lỗi thân thiện với người dùng.
            return { questions: [], iconsUsed: [] };
        }

        const data = await response.json();
        
        // Hàm serverless trả về dữ liệu theo đúng định dạng mong muốn.
        const questions: Question[] = data.questions || [];
        const iconsUsed: ShapeType[] = data.iconsUsed || [];

        return { questions, iconsUsed };

    } catch (error) {
        // Bắt lỗi mạng (ví dụ: người dùng offline) hoặc các vấn đề khác với chính lệnh fetch.
        console.error('Lỗi mạng hoặc lỗi client khi fetch từ endpoint /api/generate:', error);
        return { questions: [], iconsUsed: [] };
    }
};
