import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { QuestionObj } from '@common/message';
import { Player } from '@common/player';

export enum SortState {
    NoSort,
    Name,
    Points,
    State,
}

@Component({
    selector: 'app-players-list',
    templateUrl: './players-list.component.html',
    styleUrls: ['./players-list.component.scss'],
})
export class PlayersListComponent implements OnChanges {
    @Input() players: Player[];
    @Input() isAdmin: boolean;
    sortState: SortState;
    currentQuestion: QuestionObj;

    constructor(public socketService: SocketClientService) {}

    ngOnInit() {
        this.sortState = SortState.NoSort;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.players) {
            this.sortPlayers();
        }
        this.configureSockets();
    }

    onSortChange() {
        this.sortPlayers();
    }

    configureSockets() {
        this.socketService.on('newCurrentQst', (question: QuestionObj) => {
            this.currentQuestion = question;
        });
    }

    private sortPlayers(): void {
        this.players = this.players.filter(player => player.username !== "organisateur");
        this.sortState = Number(this.sortState);
        switch (this.sortState) {
            case SortState.NoSort:
                break;
            case SortState.Name:
                this.sortByName();
                break;
            case SortState.Points:
                this.sortByPoints();
                break;
            case SortState.State:
                this.sortByState();
                break;
        }
    }
    reverse(): void {
        this.players.reverse();
    }
    toggleMute(player: Player): void {
        this.socketService.send('toggleMute', player);
    }
    private sortByPoints(): void {
        this.players = this.players.sort((player1, player2) => {
            return player2.points - player1.points;
        });
    }
    private sortByName(): void {
        this.players = this.players.sort((player1, player2) => {
            return player1.username.localeCompare(player2.username);
        });
    }
    private sortByState(): void {
        this.players = this.players.sort((player1, player2) => {
            const playersStateWeights: number[] = [0, 0];
            const players = [player1, player2];
            players.forEach((player, index) => {
                if (player.isConnected) { playersStateWeights[index]++; }
                if (player.isAnswering) { playersStateWeights[index]++; }
                if (player.isFinal) { playersStateWeights[index]++; }
                if (player.isSubmitted) { playersStateWeights[index]++; }
            });
            return playersStateWeights[1] - playersStateWeights[0];
        })
    }
}
