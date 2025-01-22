import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { DEFAULT_TIMER } from '@common/constant';

@Component({
    selector: 'app-pre-game-wait',
    templateUrl: './pre-game-wait.component.html',
    styleUrls: ['./pre-game-wait.component.scss'],
})
export class PreGameWaitComponent implements OnInit {
    @Output() gameStart = new EventEmitter<void>();
    timer: number = DEFAULT_TIMER;

    constructor(public socketService: SocketClientService) {}

    ngOnInit(): void {
        if (!this.socketService) {
            return;
        }
        this.configureBaseSocketFeatures();
    }

    configureBaseSocketFeatures(): void {
        this.socketService.on('countdown', (count: number) => {
            this.timer = count;
            if (this.timer <= 0) {
                this.timerOver();
            }
        });
    }
    timerOver(): void {
        this.gameStart.emit();
    }
}
