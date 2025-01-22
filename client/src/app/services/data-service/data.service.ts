import { Injectable } from '@angular/core';
import { QuizObj, QuestionObj, ChoicesObj, Message } from '@common/message';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

@Injectable({
    providedIn: 'root',
})
export class DataService {
    private apiUrl = 'client/game';

    constructor(private readonly communicationSerivce: CommunicationService) {}

    setSharedQuiz(quiz: QuizObj): Observable<HttpResponse<string>> {
        const setQuizUrl = `${this.apiUrl}/quiz`;
        const message = { title: '', body: JSON.stringify(quiz) };
        return this.communicationSerivce.basicPost(message, setQuizUrl);
    }

    getSharedQuiz(): Observable<Message> {
        const getQuizUrl = `${this.apiUrl}/quiz`;
        return this.communicationSerivce.basicGet(getQuizUrl);
    }

    setSharedQuestions(questions: QuestionObj[]): Observable<HttpResponse<string>> {
        const setQuestionsUrl = `${this.apiUrl}/quiz/questions`;
        const message = { title: '', body: JSON.stringify(questions) };
        return this.communicationSerivce.basicPost(message, setQuestionsUrl);
    }

    getSharedQuestions(): Observable<Message> {
        const getQuestionsUrl = `${this.apiUrl}/quiz/questions`;
        return this.communicationSerivce.basicGet(getQuestionsUrl);
    }

    validateAnswer(questionId: string, selectedAnswers: ChoicesObj[]): Observable<HttpResponse<string>> {
        const validateUrl = `${this.apiUrl}/validate`;
        const payload = { questionId, selectedAnswers };
        const message = { title: '', body: JSON.stringify(payload) };
        return this.communicationSerivce.basicPost(message, validateUrl);
    }
}
