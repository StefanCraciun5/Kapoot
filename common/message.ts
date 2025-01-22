export interface Message {
    title: string;
    body: string;
}
export interface QuizObj {
    title: string;
    description: string;
    questions: string[];
    id: string;
    visible: boolean;
    duration: number;
    lastModification: Date;
}

export interface QuestionObj {
    question: string;
    points: number;
    choices: ChoicesObj[];
    type: string;
    id: string;
}

export interface ChoicesObj {
    choice: string;
    isCorrect: boolean;
}

export interface SendMessage {
    roomId: string;
    message: string;
}

export interface JoinRoom {
    socketId: string;
    roomId: string;
}

export interface Joined {
    joined: boolean;
    roomId: string;
}

export interface HistoryObj {
    title: string;
    date: Date;
    players: number;
    maxPoints: number;
}

export interface ValidateUsername {
    roomId: string;
    username: string;
}