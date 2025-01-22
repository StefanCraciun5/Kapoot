import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
    selector: 'app-join-game-username',
    templateUrl: './join-game-username.component.html',
    styleUrls: ['./join-game-username.component.scss']
})

export class JoinGameUsernameComponent {
    @Output() userNameSent = new EventEmitter<string>();
    @Input() invalidUsername: boolean;
    @Input() invalidCode: boolean;
    userName: string;

    sendUserName() {
        if (!this.userName.trim()) {
            return;
        }
        this.userNameSent.emit(this.userName.trim());
    }

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.sendUserName()
        }
        if (event.key !== 'Enter') {
            this.invalidUsername = this.invalidCode = false;
        }
    }
}
