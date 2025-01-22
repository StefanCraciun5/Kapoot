// mocking several classes used in testing
// eslint-disable-next-line max-classes-per-file
import { Room } from '@app/classes/room/room'; // Adjust the import path as necessary
import { Server } from '@app/server';
import { RoomsManager } from '@app/services/rooms-manager-service/rooms-manager.service';
import { expect } from 'chai';
import { Socket, io as ioClient } from 'socket.io-client';
import { Container } from 'typedi';
import { SocketManager } from './socket-manager.service';
import { QuestionObj, ChoicesObj } from '@common/message';
import { Player } from '@common/player';

const ROOM_ID = '1234';
const RESPONSE_DELAY = 200;
// const LETTER_POOL = 36;
// const LETTERS_SELECTED = 7;
// const LAQ_DURATION = 60;

class MockRoomsManager extends RoomsManager {
    private mockRoom: Room;
    constructor(mockRoom: Room) {
        super();
        this.mockRoom = mockRoom;
    }

    override getRoomById(roomId: string): Room {
        return this.mockRoom ?? super.getRoomById(roomId);
    }
}

class MockRoom extends Room {
    roomId: string = ROOM_ID;
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(quizId: string, organizerId: string) {
        super(quizId, organizerId);
    }
    override isOrganizer(socketId: string): boolean {
        return false ?? Boolean(socketId);
    }

    override getPlayers(): Map<string, Player> {
        return new Map<string, Player>();
    }
}

describe('SocketManager 2', () => {
    let server: Server;
    let service: SocketManager;
    let clientSocket: Socket;
    let mockRoom: MockRoom;
    let roomsManagerMock: MockRoomsManager;
    const urlString = 'http://localhost:3000';

    beforeEach(async () => {
        mockRoom = new MockRoom('quizId', 'organizerId');
        roomsManagerMock = new MockRoomsManager(mockRoom as unknown as Room);

        Container.set(RoomsManager, roomsManagerMock);

        server = Container.get(Server);
        server.init();

        service = server['socketManager'];
        clientSocket = ioClient(urlString, { forceNew: true });

        service['roomsManager'] = roomsManagerMock;
        await new Promise<void>((resolve) => clientSocket.once('connect', () => resolve()));
    });
    afterEach(() => {
        clientSocket.close();
        service['sio'].close();
        Container.reset();
    });
    // it('should handle allPlayerAnswered event when it is a random quiz and it is not the last question', (done) => {
    //     mockRoom = new MockRoom('0', 'organizerId');
    //     const choicesObj: ChoicesObj[] = [
    //         { choice: '1', isCorrect: true },
    //         { choice: '2', isCorrect: false },
    //     ];
    //     mockRoom.playerAnswers = [0, 0];
    //     const questionObj: QuestionObj = {
    //         id: '1',
    //         question: 'Question 1',
    //         points: 10,
    //         choices: choicesObj,
    //         type: 'MCQ',
    //     };
    //     const questionObj2: QuestionObj = {
    //         id: '2',
    //         question: 'Question 2',
    //         points: 10,
    //         choices: choicesObj,
    //         type: 'MCQ',
    //     };
    //     mockRoom.currentQst = questionObj;
    //     mockRoom.previewQst = questionObj2;

    //     clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
    //     clientSocket.emit('allPlayerAnswered');
    //     clientSocket.on('countdown', () => {
    //         expect(mockRoom.isRandomQuiz).to.equal(true);
    //         done();
    //     });
    // });
    it('should handle submitAnswer event', (done) => {
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'player1' });
        clientSocket.emit('submitAnswer', [0, 1]);
        const choicesObj: ChoicesObj[] = [
            { choice: '1', isCorrect: true },
            { choice: '2', isCorrect: false },
        ];
        const questionObj: QuestionObj = {
            id: '1',
            question: 'Question 1',
            points: 10,
            choices: choicesObj,
            type: 'MCQ',
        };
        mockRoom.answerOrder.enqueue([0, 1]);
        mockRoom.currentQst = questionObj;

        clientSocket.on('players', () => {
            expect(mockRoom.isFirst).to.equal(true);
            done();
        });
    });
    it('should handle sendLiveChoices event', (done) => {
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'player1' });
        mockRoom.playerAnswers = [0, 1];
        clientSocket.emit('sendLiveChoices', [0, 1]);
        clientSocket.on('liveChoices', () => {
            expect(mockRoom.isFirst).to.be.equal(true);
            done();
        });
    });
    it('should handle lockQuiz event', (done) => {
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('lockQuiz', ROOM_ID);
        clientSocket.on('quizLocked', () => {
            expect(mockRoom.isQuizLocked).to.equal(true);
            done();
        });
    });
    it('should handle toggle event when timer is not paused', (done) => {
        const questionObj: QuestionObj = {
            question: 'question',
            points: 10,
            type: 'LAQ',
            id: 'id1',
            choices: [],
        };
        mockRoom.isTimerPaused = false;
        mockRoom.currentQst = questionObj;
        mockRoom.intervalId = setInterval(() => {
            mockRoom.currentQst = questionObj;
        }, 1);
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('toggleTimer');
        setTimeout(() => {
            expect(mockRoom.isTimerPaused).to.equal(true);
            done();
        }, RESPONSE_DELAY);
    });
    it('should handle toggle event when timer is paused', (done) => {
        const questionObj: QuestionObj = {
            question: 'question',
            points: 10,
            type: 'LAQ',
            id: 'id1',
            choices: [],
        };
        mockRoom.isTimerPaused = true;
        mockRoom.currentQst = questionObj;
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('toggleTimer', ROOM_ID);
        clientSocket.on('countdown', (count: number) => {
            expect(count).to.equal(null);
            done();
        });
    });
    it('should handle panic event', (done) => {
        mockRoom.isTimerPaused = true;
        clientSocket.emit('joinRoom', ROOM_ID);
        clientSocket.emit('panicMode', ROOM_ID);
        done();
    });
    it('should handle sendMessage event', (done) => {
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'player1' });
        clientSocket.emit('sendMessage', 'hello');

        const currentTime: Date = new Date();
        const hours: string = currentTime.getHours().toString().padStart(2, '0');
        const minutes: string = currentTime.getMinutes().toString().padStart(2, '0');
        clientSocket.on('updateChat', (message: string[]) => {
            expect(message[0]).to.equal(`${hours}:${minutes}`);
            expect(message[1]).to.equal('player1: hello');
            done();
        });
    });
    it('should return null values for room and roomId if the clientId does not exist', () => {
        const clientId = 'nonexistentClientId';
        const result = service['findRoom'](clientId);
        expect(result).to.deep.equal({ room: null, roomId: null });
    });
    it('should handle panicMode event', (done) => {
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('panicMode');
        clientSocket.on('panicSound', () => {
            expect(mockRoom.isPanicMode).to.equal(true);
            done();
        });
    });
    it('should handle isRandomGame event', (done) => {
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('isRandomGame');
        mockRoom.isRandomQuiz = true;
        clientSocket.on('isRandomGameAns', (res: boolean) => {
            expect(res).to.equal(true);
            done();
        });
    });
    it('should handle isRoomEmpty event when it is a random quiz', (done) => {
        mockRoom.isRandomQuiz = true;
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('isRoomEmpty');
        clientSocket.on('roomEmpty', (res: boolean) => {
            expect(res).to.equal(false);
            done();
        });
    });
    // it('should handle forfeit event when the organizer leave', (done) => {
    //     clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
    //     clientSocket.id = 'organizerId';
    //     clientSocket.emit('forfeit');
    //     clientSocket.on('organizerDisconnected', () => {
    //         expect(true).to.equal(true);
    //         done();
    //     });
    // });
    it('should handle skipQuestion event and offset is 1', (done) => {
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('skipQuestion', 1);
        const questionObj: QuestionObj = {
            question: 'question',
            points: 10,
            type: 'LAQ',
            id: 'id1',
            choices: [],
        };
        mockRoom.currentQst = questionObj;
        mockRoom.previewQst = questionObj;
        clientSocket.on('questionSkipped', () => {
            expect(mockRoom.isFirst).to.equal(true);
            done();
        });
    });
    it('should handle skipQuestion event and offset is not 1', (done) => {
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('skipQuestion', 0);
        const questionObj: QuestionObj = {
            question: 'question',
            points: 10,
            type: 'LAQ',
            id: 'id1',
            choices: [],
        };
        mockRoom.previewQst = questionObj;
        clientSocket.on('questionSkipped', () => {
            expect(mockRoom.isFirst).to.equal(true);
            done();
        });
    });
    it('should handle forceJoin event', (done) => {
        clientSocket.emit('forceJoin', ROOM_ID);
        clientSocket.on('forcedJoin', (roomId) => {
            expect(roomId).to.equal(ROOM_ID);
            done();
        });
    });
    // it('should handle leaveRoom event when it is the organizer', (done) => {
    //     mockRoom = new MockRoom('1', clientSocket.id);
    //     clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
    //     clientSocket.emit('leaveRoom');
    //     clientSocket.on('organizerDisconnected', () => {
    //         expect(mockRoom.isFirst).to.equal(true);
    //         done();
    //     });
    // });
    // it('should handle typeLAQ event', (done) => {
    //     clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
    //     clientSocket.emit('typeLAQ');
    //     clientSocket.on('LAQOptions', () => {
    //         expect(mockRoom.isFirst).to.equal(true);
    //         done();
    //     });
    // });
    it('should handle submitLAQAnswer event', (done) => {
        mockRoom.timer = 10;
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('submitLAQAnswer', 'allo');
        clientSocket.on('transitionView', () => {
            expect(mockRoom.isFirst).to.equal(true);
            done();
        });
    });
    it('should handle evaluateAnswers event', (done) => {
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('evaluateAnswers');
        clientSocket.on('evaluating', (list) => {
            expect(list.length).to.equal(0);
            done();
        });
    });
    it('should handle validateLAQ event', (done) => {
        const questionObj: QuestionObj = {
            question: 'question',
            points: 10,
            type: 'LAQ',
            id: 'id1',
            choices: [],
        };
        mockRoom.currentQst = questionObj;
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('validateLAQ', { username: 'a', percentage: 1 });
        setTimeout(() => {
            expect(mockRoom.isQuizLocked).to.equal(false);
            done();
        }, RESPONSE_DELAY);
    });
});
