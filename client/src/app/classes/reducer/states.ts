export enum QuizStates {
    Initialize,
    // Update States
    UpdateQuizTitle,
    UpdateQuizDescription,
    UpdateQuizDuration,
    UpdateQuizQuestions,
    UpdateQuizVisibility,
    // Create State
    CreateQuiz,
    // Remove State
    SaveQuiz,
}

export enum QuestionStates {
    Initialize,
    Save,
    // Update States
    UpdateQuestionQuestion,
    UpdateQuestionPoints,
    UpdateQuestionChoices,
    UpdateQuestionType,
    // Create State
    CreateQuestion,
    DeleteQuestion,
}
