import { Component, Input } from '@angular/core';
import { QuestionObj } from '@common/message';
import { Player } from '@common/player';

@Component({
    selector: 'app-game-result',
    templateUrl: './game-result.component.html',
    styleUrls: ['./game-result.component.scss'],
})
export class GameResultComponent {
    @Input() answers: Map<string, number[]> = new Map(); // questionId to histogram
    @Input() questions: QuestionObj[];
    @Input() players: Player[];
    @Input() isAdmin: boolean;
}
