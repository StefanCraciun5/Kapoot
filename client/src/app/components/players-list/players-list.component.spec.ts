import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Player } from '@common/player';
import { PlayersListComponent, SortState } from './players-list.component';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { Socket } from 'socket.io-client';
import { QuestionObj } from '@common/message';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('PlayersListComponent', () => {
    let component: PlayersListComponent;
    let fixture: ComponentFixture<PlayersListComponent>;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        
        await TestBed.configureTestingModule({
            declarations: [PlayersListComponent],
            providers: [{ provide: SocketClientService, useValue: socketServiceMock }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlayersListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should sort players by points and then by username', () => {
        const players: Player[] = [
            { username: 'Player1', points: 100, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player2', points: 75, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player3', points: 120, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player4', points: 90, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player5', points: 110, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player6', points: 100, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
        ];
        

        component.players = players;
        component.sortState = 1;
        component.ngOnChanges({ players: true } as any);

    });
    
    it('should sort players by username', () => {
        component.sortState = SortState.Name;

        const players: Player[] = [
            { username: 'Player1', points: 100, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player2', points: 75, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player3', points: 120, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player4', points: 90, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player5', points: 110, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player6', points: 100, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
        ];
        
        component.players = players;
        component.onSortChange();

        expect(component.players[0].username).toBe('Player1');
    });
    
    it('should not sort players', () => {
        component.sortState = SortState.NoSort;

        const players: Player[] = [
            { username: 'Player1', points: 100, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player2', points: 75, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player3', points: 120, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player4', points: 90, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player5', points: 110, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player6', points: 100, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
        ];
        
        component.players = players;
        component.onSortChange();

        expect(component.players[0].username).toBe('Player1');
    });

    it('should sort players by points and then by username', () => {
        component.sortState = SortState.Points;

        const players: Player[] = [
            { username: 'Player1', points: 100, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player2', points: 75, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player3', points: 120, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player4', points: 90, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player5', points: 110, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player6', points: 100, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
        ];
        
        component.players = players;
        component.onSortChange();

        expect(component.players[0].username).toBe('Player3');
    });

    it('should sort players by points and then by username', () => {
        component.sortState = SortState.State;

        const players: Player[] = [
            { username: 'Player1', points: 100, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: true, isAnswering: false, isMuted: false },
            { username: 'Player2', points: 75, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player3', points: 120, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player4', points: 90, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player5', points: 110, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: true, isMuted: false },
            { username: 'Player6', points: 100, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
        ];
        
        component.players = players;
        component.onSortChange();

        expect(component.players[0].username).toBe('Player1');
    });

    it('should reverse player list', () => {
        const players: Player[] = [
            { username: 'Player1', points: 100, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player2', points: 75, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player3', points: 120, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player4', points: 90, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player5', points: 110, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
            { username: 'Player6', points: 100, goodAnswer: true, isFinal: true, isConnected: true, nBonus: 1, isSubmitted: false, isAnswering: false, isMuted: false },
        ];
        
        component.players = players;
        component.reverse();

        expect(component.players[0].username).toBe('Player6');
    });
    it('should send toggleMute event', () => {
        const player: Player = {
            username: 'Player1',
            points: 100,
            goodAnswer: true,
            isFinal: true,
            isConnected: true,
            nBonus: 1,
            isSubmitted: false,
            isAnswering: false,
            isMuted: false
        };
        const spy = spyOn(component.socketService, 'send');
        component.toggleMute(player);
        expect(spy).toHaveBeenCalled();
    })
    it('should handle newCurrentQst event', () => {
        component.configureSockets();
        const questionObj: QuestionObj = {
            id: '1',
            question: 'question',
            points: 10,
            type: 'LAQ',
            choices: []
        }
        socketHelper.peerSideEmit('newCurrentQst', questionObj )
        expect(component.currentQuestion).toBeTruthy();
    });

});
