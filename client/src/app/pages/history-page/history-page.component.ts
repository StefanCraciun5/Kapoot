import { Component, OnInit } from '@angular/core';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { HistoryObj } from '@common/message';

@Component({
    selector: 'app-history',
    templateUrl: './history-page.component.html',
    styleUrls: ['./history-page.component.scss']
})

export class HistoryPageComponent implements OnInit {

    history: HistoryObj[] = [];
    formattedDates: string[] = [];
    reverse: boolean;
    sortDate: boolean;
    sortAlphabet: boolean;
    original: HistoryObj[] = [];


    constructor(
        private readonly communicationService: CommunicationService,
    ) {
        this.sortDate = this.sortAlphabet = this.reverse = false;
    }

    async ngOnInit(): Promise<void> {
        this.history = await this.communicationService.getHistory();
        this.original = [...this.history];
        this.formatDates()
    }

    clearHistory() {
        if (window.confirm("Voulez vous effacer l'historique des jeux?")) {
            this.communicationService.deleteHistory();
            this.history = [];
        }
    }

    sortByAlphabet() {
        this.sortAlphabet = !this.sortAlphabet;
        this.sortDate = false;
        this.sort()
    }

    sortByDate() {
        this.sortDate = !this.sortDate;
        this.sortAlphabet = false;
        this.sort()
    }

    sortReverse() {
        this.reverse = !this.reverse;
        this.history = this.history.reverse();
        this.formatDates();
    }

    sort() {
        if (this.sortDate) {
            this.history = this.history.sort((first, second) => {
                return new Date(first.date).getTime() - new Date(second.date).getTime();
            });
        }
        if (this.sortAlphabet) {
            this.history = this.history.sort((first, second) => {
                if (first.title.toLocaleLowerCase() > second.title.toLocaleLowerCase()) {
                    return 1;
                } else if (first.title.toLocaleLowerCase() === second.title.toLocaleLowerCase()) {
                    return 0;
                } else {
                    return -1;
                }
            });
        }
        if (!this.sortDate && !this.sortAlphabet) {
            this.history = this.original;
        }
        this.formatDates();
    }
    private formatDates() {
        this.formattedDates = this.history.map((log) => {
            const date = new Date(log.date);
            return String(date.getFullYear()) + '-' +
                (date.getMonth() > 9 ? '' : '0') + String(date.getMonth()) + '-' +
                (date.getDay() > 9 ? '' : '0') + String(date.getDay()) + ' ' +
                String(date.toLocaleTimeString());
        });
    }
}
