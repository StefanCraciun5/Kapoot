export interface QuizInterface {
    id: string;
    title: string;
    description: string;
    lastModification: Date;
    questionIDs: string[];
    duration: number;
    visibility: boolean;
    formattedDate?: string;
}
