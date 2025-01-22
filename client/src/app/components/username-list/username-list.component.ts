import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';

@Component({
    selector: 'app-username-list',
    templateUrl: './username-list.component.html',
    styleUrls: ['./username-list.component.scss'],
})
export class UsernameListComponent implements OnChanges {
    @Input() roomId: string;
    @Input() isCreator: boolean;
    usernames: string[] = [];

    constructor(public socketService: SocketClientService) {}

    ngOnChanges(changes: SimpleChanges): void {
        if ('roomId' in changes && this.roomId) {
            this.configureBaseSocketFeatures();
            this.fetchUsers();
        }
    }

    deleteUser(username: string): void {
        const newUsernames = this.usernames.filter((name) => name !== username);
        this.usernames = newUsernames;
        this.socketService.send('banPlayer', username);
    }

    fetchUsers(): void {
        this.socketService.send('getUsers');
    }

    configureBaseSocketFeatures(): void {
        this.socketService.on('users', (usernames: string[]) => {
            const newUsernames = usernames.filter((name) => name !== 'organisateur');
            this.usernames = newUsernames;
        });
        this.socketService.on('playersUpdated', () => {
            this.fetchUsers();
        });
    }
}
