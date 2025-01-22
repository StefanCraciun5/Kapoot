import { ChoiceInterface } from '@app/classes/database-types/choice-interface/choice-interface';
export interface Filter {}
export interface IDFilter extends Filter {
    id?: {
        $in: string[];
    };
}

export interface QuestionFilter extends Filter {
    question?: {
        $in: string[];
    };
}

export interface QuestionTypeFilter extends Filter {
    type?: {
        $in: string[];
    };
}

export interface QuizQueryFilter extends Filter {
    $set: {
        title?: string;
        description?: string;
        visible?: boolean;
        duration?: number;
        questions?: string[];
        lastModification: Date;
    };
}
export interface QuestionQueryFilter extends Filter {
    $set: {
        type?: string;
        question?: string;
        points?: number;
        choices?: ChoiceInterface[];
        lastModified?: Date; // not in the allowed keys
    };
}
export const ALLOWED_KEYS_FOR_QUIZ: string[] = ['title', 'description', 'visible', 'duration', 'questions'];
export const ALLOWED_KEYS_FOR_QUESTION: string[] = ['question', 'points', 'choices', 'type'];
