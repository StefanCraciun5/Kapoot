import { Component, Input } from '@angular/core';
import { QuestionObj } from '@common/message';
import { Player } from '@common/player';

@Component({
    selector: 'app-stats',
    templateUrl: './stats.component.html',
    styleUrls: ['./stats.component.scss'],
})
export class StatsComponent {
    @Input() answeredPlayers: Player[];
    @Input() playerAnswers: number[];
    @Input() timer: number;
    @Input() currentQuestion: QuestionObj;
    choiceLabels: string[] = ['a', 'b', 'c', 'd']; // Choice labels corresponding to indexes 0, 1, 2, 3
}
