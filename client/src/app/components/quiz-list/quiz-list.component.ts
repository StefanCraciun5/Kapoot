import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MCQuestion } from '@app/classes/question/question-interfaces';
import { QuizInterface } from '@app/classes/quiz/quiz-interface';
import { QuestionRenderer } from '@app/classes/renderer/question-renderer/question-renderer';
import { QuizRenderer } from '@app/classes/renderer/quiz-renderer/quiz-renderer';
import { AlertService } from '@app/services/alert-service/alert.service';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { ToggleService } from '@app/services/toggle-service/toggle.service';
import { Validator } from '@app/services/validation-service/validator.service';
import { QUIZ_PATH } from '@common/constant';

@Component({
    selector: 'app-quiz-list',
    templateUrl: './quiz-list.component.html',
    styleUrls: ['./quiz-list.component.scss'],
})
export class QuizListComponent implements OnInit {
    quizzes: QuizInterface[];
    toggler: ToggleService;
    selectedFile: File | undefined;
    constructor(
        public communicationService: CommunicationService,
        private router: Router,
        private readonly alertService: AlertService,
    ) {
        this.quizzes = [];
        this.toggler = new ToggleService();
    }

    ngOnInit(): void {
        this.populateQuizzes();
    }
    async populateQuizzes(): Promise<void> {
        const quizzes = JSON.parse(await this.getQuizzes());
        for (const quiz of quizzes) {
            const lastModif = JSON.parse(JSON.stringify(quiz)).lastModification;
            const quizOBJ: QuizInterface = {
                id: JSON.parse(JSON.stringify(quiz)).id,
                title: JSON.parse(JSON.stringify(quiz)).title,
                description: JSON.parse(JSON.stringify(quiz)).description,
                questionIDs: JSON.parse(JSON.stringify(quiz)).questions,
                duration: JSON.parse(JSON.stringify(quiz)).duration,
                visibility: JSON.parse(JSON.stringify(quiz)).visible,
                lastModification: lastModif,
                formattedDate: new Date(lastModif).toLocaleDateString(),
            };
            this.quizzes.push(quizOBJ);
        }
        return;
    }
    async getQuizzes(): Promise<string> {
        return new Promise<string>((resolve) => {
            this.communicationService.basicGet(QUIZ_PATH).subscribe({
                next: (res) => {
                    resolve(res.body);
                },
            });
        });
    }
    async download(index: number) {
        const quiz = this.quizzes[index];
        const quizCopy = { ...quiz };
        const questions: MCQuestion[] = [];
        for (const questionID of quizCopy.questionIDs) {
            const question = await QuestionRenderer.getQuestion(questionID, this.communicationService);
            questions.push(JSON.parse(question));
        }
        const quizDownloadFormat = {
            quizID: quizCopy.id,
            title: quizCopy.title,
            description: quizCopy.description,
            duration: quizCopy.duration,
            questions,
        };
        const blob = new Blob([JSON.stringify(quizDownloadFormat, null, 2)], { type: 'json/application' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${quiz.title}.json`;
        link.click();
    }
    onFileChange(event: Event) {
        const files = (event.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
            return;
        }
        const file = files.item(0);
        if (!file || file.name.split('.')[file.name.split('.').length - 1] !== 'json') {
            // this verification isn't necessary, it's just to make ESLint happy
            return;
        }
        this.selectedFile = file;
    }
    uploadQuiz() {
        // check the quiz and send it as a JSON obj to the '/quiz/0' route
        if (!this.selectedFile) {
            this.alertService.showError('Téléversez un fichier valide', 'Erreur');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const jsonData = JSON.parse(reader.result as string);
            jsonData.visible = false;
            if (!Validator.validateQuizJSON(jsonData)) {
                this.alertService.showError('Le format du fichier est invalide', 'Erreur');
                return;
            }
            this.router.navigate(['/quiz/0'], { state: { data: jsonData } });
        };
        reader.readAsText(this.selectedFile);
    }
    goToQuizPage(id: string) {
        this.router.navigate([`/quiz/${id}`]);
    }
    async toggle(index: number) {
        while (this.toggler.state !== this.quizzes[index].visibility) {
            this.toggler.toggle();
        }
        this.toggler.toggle();
        await QuizRenderer.toggleVisibility(this.quizzes[index].id, this.toggler.state, this.communicationService);
        this.quizzes[index].visibility = this.toggler.state;
    }
    async delete(index: number) {
        if (window.confirm('Voulez vous supprimer le questionnaire?')) {
            const quizName = this.quizzes[index].title;
            await QuizRenderer.staticDelete(this.quizzes[index].id, this.communicationService);
            this.quizzes.splice(index, 1);
            this.alertService.showSuccess('', `Supprimé "${quizName}" avec succès`);
        }
    }
}
