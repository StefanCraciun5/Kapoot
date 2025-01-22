import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';

@Component({
    selector: 'app-wait-room',
    templateUrl: './wait-room.component.html',
    styleUrls: ['./wait-room.component.scss'],
})
export class WaitRoomComponent implements OnInit {
    @Input() roomId: string;
    @Input() isCreator: boolean;
    @Output() preGameStart = new EventEmitter<void>();
    roomLocked: boolean;
    emptyRoom: boolean;
    isRandomGame: boolean;

    constructor(public socketService: SocketClientService) {}

    ngOnInit(): void {
        this.roomLocked = false;
        this.configureBaseSocketFeatures();
    }

    configureBaseSocketFeatures(): void {
        this.socketService.on('roomLocked', (locked: boolean) => {
            this.roomLocked = locked;
        });
        this.socketService.on('isRandomGameAns', (isRandom: boolean) => {
            this.isRandomGame = isRandom;
        });
        this.socketService.on('roomEmpty', (empty: boolean) => {
            this.emptyRoom = empty;
            if (empty) {
                this.socketService.send('lockRoom');
            } else {
                this.preGameStart.emit();
            }
        });
        this.socketService.on('users', (usernames: string[]) => {
            this.emptyRoom = usernames.length === 0;
        });
    }

    lockRoom(): void {
        // this.emptyRoom = false;
        this.socketService.send('lockRoom');
        this.socketService.send('isRandomGame');
    }

    navigateToGameOrgPage(): void {
        this.socketService.send('isRoomEmpty');
    }
}
