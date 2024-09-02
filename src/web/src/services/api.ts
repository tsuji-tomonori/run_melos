import axios from 'axios';

const API_BASE_URL = 'https://ai7bjjjaoe.execute-api.ap-northeast-1.amazonaws.com/v1/';  // ここを実際のAPIエンドポイントに置き換えてください

interface InitResponse {
    chat_id: string;
    story: string;
    memories: string[];
}

interface StoryResponse {
    chat_id: string;
    story: string;
    memories: string[];
}

export const initGame = async (): Promise<InitResponse> => {
    const response = await axios.post<InitResponse>(`${API_BASE_URL}/init`);
    return response.data;
};

export const fetchStory = async (chatId: string, memories: string[]): Promise<StoryResponse> => {
    const response = await axios.post<StoryResponse>(`${API_BASE_URL}/story/${chatId}`, { memories });
    return response.data;
};
