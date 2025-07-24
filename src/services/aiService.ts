// src/services/aiService.ts

import { GoogleGenAI, Type } from "@google/genai";
import { DifficultyLevel, OddOneOutQuestion, VisualPatternQuestion, GameMode, VisualPatternOption, OddOneOutOption, Question, IconData, ShapeType } from '../../types';
import { generateId, shuffleArray, getVietnameseName } from './questionUtils';

// Helper functions for prompt and schema generation are moved here from the backend.
const generateBaseSchemaProperties = () => ({
    explanation: {
        type: Type.STRING,
        description: "Lời giải thích ngắn gọn, dễ hiểu bằng tiếng Việt về logic của câu trả lời đúng."
    }
});

const generateOddOneOutSchema = () => ({
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            ...generateBaseSchemaProperties(),
            options_emojis: {
                type: Type.ARRAY,
                description: "Một mảng chứa chính xác 4 emoji (string) cho câu hỏi này.",
                items: { type: Type.STRING }
            },
            correct_emoji: {
                type: Type.STRING,
                description: "Emoji (string) là đáp án đúng trong 4 options_emojis."
            },
        },
        required: ['options_emojis', 'correct_emoji', 'explanation']
    }
});

const generateVisualPatternSchema = () => ({
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            ...generateBaseSchemaProperties(),
            sequence_emojis: {
                type: Type.ARRAY,
                description: "Một mảng chứa 3-5 emoji (string) thể hiện quy luật.",
                items: { type: Type.STRING }
            },
            options_emojis: {
                type: Type.ARRAY,
                description: "Một mảng chứa chính xác 4 emoji (string) cho các lựa chọn.",
                items: { type: Type.STRING }
            },
            correct_emoji: {
                type: Type.STRING,
                description: "Emoji (string) là đáp án đúng trong 4 options_emojis."
            },
        },
        required: ['sequence_emojis', 'options_emojis', 'correct_emoji', 'explanation']
    }
});

const generatePrompt = (
    mode: GameMode,
    difficulty: DifficultyLevel,
    numQuestions: number,
    availableIcons: IconData[]
): string => {
    const age = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? "3-4 tuổi" : "4-5 tuổi";
    
    let iconListForPrompt: string;
    if (mode === GameMode.VISUAL_PATTERN) {
        iconListForPrompt = `Dưới đây là danh sách các icon bạn có thể sử dụng, coi chúng như các biểu tượng trừu tượng: ${availableIcons.map(i => i.emoji).join(', ')}`;
    } else { // ODD_ONE_OUT
        iconListForPrompt = `Dưới đây là danh sách các icon bạn có thể sử dụng:
${availableIcons.map(icon =>
        `- ${icon.emoji} (${icon.name}): Chủ đề chính là '${getVietnameseName(icon.primaryCategory)}'${icon.subCategory ? `, chủ đề phụ '${getVietnameseName(icon.subCategory)}'` : ''}.`
    ).join('\n')}`;
    }

    const basePrompt = `Bạn là một chuyên gia thiết kế game giáo dục cho trẻ em ${age}. Nhiệm vụ của bạn là tạo ra một danh sách gồm ${numQuestions} câu hỏi.
${iconListForPrompt}

Yêu cầu chung:
1.  Mỗi câu hỏi phải sử dụng một bộ icon hoàn toàn khác nhau. KHÔNG sử dụng lại bất kỳ icon nào đã dùng trong các câu hỏi trước đó trong danh sách này.
2.  Cung cấp lời giải thích (explanation) ngắn gọn, dễ hiểu bằng tiếng Việt cho trẻ em.
`;

    if (mode === GameMode.ODD_ONE_OUT) {
        let difficultyInstructions = '';
        if (difficulty === DifficultyLevel.PRE_SCHOOL_MAM) {
            difficultyInstructions = "Logic của câu hỏi phải cực kỳ đơn giản, dựa trên **chủ đề chính** (primaryCategory). Ví dụ: 3 động vật vs 1 xe cộ, 3 trái cây vs 1 quần áo.";
        } else { // PRE_SCHOOL_CHOI
            difficultyInstructions = `Logic của câu hỏi phải phức tạp và sâu sắc hơn. **TUYỆT ĐỐI KHÔNG** dùng logic về chủ đề chính đơn giản. Thay vào đó, hãy dùng các quy tắc sau:
-   **Khác biệt về môi trường/đặc tính:** 3 động vật trên cạn vs 1 động vật dưới nước; 3 phương tiện có bánh xe vs 1 không có bánh xe.
-   **Khác biệt về phân loại hẹp:** 3 thú cưng vs 1 động vật hoang dã; 3 loại rau củ vs 1 loại trái cây.
-   **Khác biệt về chức năng:** 3 dụng cụ để ăn vs 1 dụng cụ để viết.`;
        }

        return `${basePrompt}
Yêu cầu cụ thể cho mỗi câu hỏi "TÌM VẬT KHÁC BIỆT":
1.  Chọn 4 icon từ danh sách trên.
2.  ${difficultyInstructions}
3.  Icon còn lại phải khác biệt rõ ràng với 3 icon kia theo logic đã chọn.
Hãy trả về kết quả dưới dạng một mảng JSON.`;
    }

    // VISUAL_PATTERN
    const patternTypes = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? "ABAB, AABB, AABC" : "AABB, ABCA, AABC, ABBC, AAAB, ABC";
    return `${basePrompt}
Yêu cầu cụ thể cho mỗi câu hỏi "TÌM QUY LUẬT HÌNH ẢNH":
1.  **QUAN TRỌNG:** Quy luật phải dựa trên sự lặp lại của các hình ảnh (visual repetition), KHÔNG phải quy luật về ý nghĩa hay chủ đề. Hãy coi các icon như các ký tự A, B, C.
2.  Tạo ra một quy luật lặp lại đơn giản theo một trong các dạng sau: ${patternTypes}. Ví dụ: nếu quy luật là ABAB và A là 🍎, B là 🍌, thì dãy sẽ là [🍎, 🍌, 🍎, 🍌].
3.  Dựa trên quy luật đó, tạo một \`sequence_emojis\` (dãy hiển thị cho bé) gồm 3 đến 5 icon. Icon tiếp theo trong quy luật sẽ là đáp án đúng.
4.  Ví dụ: Cho quy luật AABB với A=🍎, B=🍌. Dãy hiển thị có thể là [🍎, 🍎, 🍌], đáp án đúng là 🍌. Hoặc dãy hiển thị là [🍎, 🍎, 🍌, 🍌], đáp án đúng là 🍎.
5.  Tạo \`options_emojis\` gồm 4 lựa chọn, trong đó có 1 đáp án đúng (icon tiếp theo) và 3 đáp án gây nhiễu hợp lý (có thể là các icon khác trong dãy hoặc icon mới).
6.  \`explanation\` phải mô tả rõ quy luật lặp lại. Ví dụ: "Cứ 2 quả táo lại đến 2 quả chuối." hoặc "Quy luật là một quả táo, rồi đến một quả chuối, lặp lại."
7.  Mỗi câu hỏi phải sử dụng một bộ icon khác nhau (cả trong dãy và lựa chọn).
Hãy trả về kết quả dưới dạng một mảng JSON.`;
};


export const generateAiQuestionsBatch = async (
    mode: GameMode,
    difficulty: DifficultyLevel,
    numQuestions: number,
    availableIcons: IconData[]
): Promise<{ questions: Question[], iconsUsed: ShapeType[] }> => {
    // QUAN TRỌNG: Việc sử dụng VITE_API_KEY sẽ làm lộ khóa API ra phía client.
    // Điều này được thực hiện theo yêu cầu của người dùng để giải quyết vấn đề triển khai.
    // Đối với các ứng dụng sản phẩm, phương pháp an toàn được khuyến nghị là sử dụng proxy phía máy chủ (giống như /api/generate trước đây).
    const apiKey = import.meta.env.VITE_API_KEY;

    if (!apiKey) {
        console.error("VITE_API_KEY chưa được định nghĩa trong biến môi trường.");
        // Trả về mảng rỗng để UI có thể hiển thị lỗi thân thiện.
        return { questions: [], iconsUsed: [] };
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = generatePrompt(mode, difficulty, numQuestions, availableIcons);
        const schema = mode === GameMode.ODD_ONE_OUT ? generateOddOneOutSchema() : generateVisualPatternSchema();
        const allIconsUsedInBatch = new Set<ShapeType>();

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema },
        });

        const rawQuestions = JSON.parse(response.text);
        const processedQuestions: Question[] = [];

        if (mode === GameMode.ODD_ONE_OUT) {
            rawQuestions.forEach((q: any) => {
                if (!q.options_emojis || !q.correct_emoji || q.options_emojis.length !== 4) return;
                
                let correctAnswerId = '';
                const options: OddOneOutOption[] = q.options_emojis.map((emoji: string) => {
                    const id = generateId();
                    if (emoji === q.correct_emoji) {
                        correctAnswerId = id;
                    }
                    allIconsUsedInBatch.add(emoji);
                    return { id, emoji };
                });

                if (correctAnswerId) {
                    processedQuestions.push({
                        id: generateId(), type: 'odd_one_out', mode, difficulty,
                        options, correctAnswerId,
                        promptText: "", // Placeholder, will be filled by questionService
                        explanation: q.explanation || "Vì vật này khác với các vật còn lại."
                    });
                }
            });
        } else { // VISUAL_PATTERN
            rawQuestions.forEach((q: any) => {
                if (!q.sequence_emojis || !q.options_emojis || !q.correct_emoji || q.options_emojis.length !== 4) return;

                const options: VisualPatternOption[] = q.options_emojis.map((emoji: string) => {
                     allIconsUsedInBatch.add(emoji);
                     return {
                        id: generateId(),
                        emoji,
                        isCorrect: emoji === q.correct_emoji
                    }
                });

                q.sequence_emojis.forEach((emoji: string) => allIconsUsedInBatch.add(emoji));

                processedQuestions.push({
                    id: generateId(), type: 'visual_pattern', mode, difficulty,
                    displayedSequence: q.sequence_emojis,
                    options: shuffleArray(options),
                    promptText: "", // Placeholder, will be filled by questionService
                    explanation: q.explanation || "Vì đó là hình đúng theo quy luật."
                });
            });
        }
        
        return { 
            questions: processedQuestions.slice(0, numQuestions), 
            iconsUsed: Array.from(allIconsUsedInBatch) 
        };

    } catch (error) {
        console.error(`Lỗi khi gọi trực tiếp Gemini API từ client cho chế độ ${mode}:`, error);
        return { questions: [], iconsUsed: [] };
    }
};
