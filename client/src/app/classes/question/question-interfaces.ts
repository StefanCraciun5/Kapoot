export interface Question {
    id: string;
    question: string;
    points: number;
    lastModified: Date;
    type: string;
    formattedDate?: string;
}

export interface Option {
    choice: string;
    isCorrect: boolean;
}

export interface MCQuestion extends Question {
    choices: Option[];
}
