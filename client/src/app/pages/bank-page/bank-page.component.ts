import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { QuestionListComponent } from '@app/components/question-list/question-list.component';
import { AuthService } from '@app/services/auth-service/auth.service';
import { BankService } from '@app/services/bank-service/bank-service';
import { CommunicationService } from '@app/services/communication-service/communication.service';

@Component({
    selector: 'app-bank-page',
    templateUrl: './bank-page.component.html',
    styleUrls: ['./bank-page.component.scss'],
})
export class BankPageComponent implements OnInit {
    questionIDs: string[] = [];
    lastModifs: string[] = [];
    @ViewChild('questionList') questionList: QuestionListComponent;
    filterMCQ: boolean = false;
    filterLAQ: boolean = false;

    constructor(
        private readonly communicationService: CommunicationService,
        private readonly router: Router,
        private readonly authGuard: AuthService,
    ) {}

    async ngOnInit(): Promise<void> {
        const isLoggedIn = await this.authGuard.isLoggedIn();
        if (!isLoggedIn) {
            await this.router.navigate(['/login']);
            return;
        }
        const questionBank = JSON.parse(await this.getQuestionBank());
        questionBank.forEach((question: JSON) => {
            this.questionIDs.push(JSON.parse(JSON.stringify(question)).question);
            this.lastModifs.push(JSON.parse(JSON.stringify(question)).lastMod);
        });
    }
    async getQuestionBank(): Promise<string> {
        return await BankService.getBankQuestions(this.communicationService);
    }
    callFilterMCQ() {
        this.filterMCQ = !this.filterMCQ;
        this.questionList.filter('MCQ', this.filterMCQ);
    }
    callFilterLAQ() {
        this.filterLAQ = !this.filterLAQ;
        this.questionList.filter('LAQ', this.filterLAQ);
    }
}
