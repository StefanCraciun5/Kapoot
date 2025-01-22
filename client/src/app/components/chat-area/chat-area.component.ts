import { Component, HostListener, Input, OnInit } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { MAXIMUM_MESSAGE_LENGTH } from '@common/constant';
import { Player } from '@common/player';
import { environment } from 'src/environments/environment';

enum MessageTypes {
    Message,
    Alert,
}

const MESSAGE_TYPE_INDEX = 0;
const TIME_INDEX = 1;
const USERNAME_INDEX = 2;

@Component({
    selector: 'app-chat-area',
    templateUrl: './chat-area.component.html',
    styleUrls: ['./chat-area.component.scss'],
})
export class ChatAreaComponent implements OnInit {
    @Input() roomId: string;
    @Input() username: string;
    logs: string[][] = [];
    message: string;
    longMessage: boolean;
    quizStarted: boolean;

    constructor(
        public socketService: SocketClientService,
    ) {}

    @HostListener('document:keydown', ['$event'])
    keyboardDetect(event: KeyboardEvent) {
        const activeElement = document.getElementById('input-message') as HTMLInputElement;
        if (event.key === 'Enter' && activeElement === document.activeElement) {
            event.preventDefault();
            this.enterMessage();
        }
    }

    ngOnInit(): void {
        this.configureBaseSocketFeatures();
    }

    configureBaseSocketFeatures(): void {
        this.socketService.on('updateChat', (message: string) => {
            const threatedTime = this.threatTime(message[0], environment.production);
            let name = message[1].split(':')[0];
            if (name.toLocaleLowerCase() === this.username.toLocaleLowerCase()) {
                name = 'Vous';
            }
            const messageContent = message[1].split(':').slice(1).join(':');
            this.logs.push([`${MessageTypes.Message}`, threatedTime, name, messageContent]);
            console.log(message[1]);
            this.scrollToBottom();
        });
        this.socketService.on('skedaddle', (username: string) => {
            const message = `${username} a quitté la partie`;
            this.logs.push([`${MessageTypes.Alert}`, '', '', message]);
        });
        this.socketService.on('mute', (player: Player) => {
            const message = player.isMuted ? `${player.username} a été mis en sourdine` : `${player.username} a été activé`;
            this.logs.push([`${MessageTypes.Alert}`, '', '', message]);
        });
        this.socketService.on('quizStarted', () => {
            this.quizStarted = true;
        });
    }

    enterMessage(): void {
        const regex: RegExp = /[^ ]/;
        if (this.message && regex.test(this.message)) {
            if (this.message.length <= MAXIMUM_MESSAGE_LENGTH) {
                this.socketService.send('sendMessage', this.message);
                this.longMessage = false;
                this.message = '';
            } else {
                this.longMessage = true;
            }
        }
        this.scrollToBottom();
    }

    scrollToBottom() {
        setTimeout(() => {
            const chatContainer = document.getElementById('messages-area');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }, 0);
    }

    isAlert(index: number): boolean {
        return this.logs[index][MESSAGE_TYPE_INDEX] === `${MessageTypes.Alert}`
    }

    renderDate(index: number): boolean {
        return index === 0 || this.logs[index][TIME_INDEX] !== this.logs[index - 1][TIME_INDEX];
    }

    renderName(index: number): boolean {
        return index === 0 || this.logs[index][USERNAME_INDEX] !== this.logs[index - 1][USERNAME_INDEX];
    }

    private threatTime(time: string, inProduction: boolean): string {
        const [hours, minutes] = time.split(':').map(Number);
        const originalDate = new Date();
        originalDate.setUTCHours(hours);
        originalDate.setUTCMinutes(minutes);
        const atlanticDate = new Date(originalDate.getTime() - (4 * 60 * 60 * 1000));
        const atlanticTime = `${atlanticDate.getUTCHours().toString().padStart(2, '0')}:${atlanticDate.getUTCMinutes().toString().padStart(2, '0')}`;
        return inProduction ? atlanticTime : time;
    }
}
