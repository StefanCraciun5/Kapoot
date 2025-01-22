// mocking several classes used in testing
// eslint-disable-next-line max-classes-per-file
import { Room } from '@app/classes/room/room';
import { Server } from '@app/server';
import { RoomsManager } from '@app/services/rooms-manager-service/rooms-manager.service';
import { expect } from 'chai';
import { Socket, io as ioClient } from 'socket.io-client';
import { Container } from 'typedi';
import { SocketManager } from './socket-manager.service';
import { QuestionObj, ChoicesObj } from '@common/message';
import { Player } from '@common/player';

const ROOM_ID = '1234';
const LETTER_POOL = 36;
const LETTERS_SELECTED = 7;

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
    constructor() {
        super('quizId', 'organizerId');
    }
    override isOrganizer(socketId: string): boolean {
        return false ?? Boolean(socketId);
    }
    override getPlayers(): Map<string, Player> {
        return new Map<string, Player>();
    }
}

describe('SocketManager', () => {
    let server: Server;
    let service: SocketManager;
    let clientSocket: Socket;
    let mockRoom: MockRoom;
    let roomsManagerMock: MockRoomsManager;
    const urlString = 'http://localhost:3000';

    beforeEach(async () => {
        mockRoom = new MockRoom();
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
    it('should create a room and notify the client', (done) => {
        const quizId = 'quiz123';
        clientSocket.emit('createRoom', quizId);
        clientSocket.on('createdRoom', (roomId) => {
            expect(roomId).to.be.a('string');
            const room = roomsManagerMock.getRoomById(roomId);
            expect(room).to.not.equal(null);
            done();
        });
    });
    describe('Joining Room', () => {
        it('should handle the unlocked room scenario', (done) => {
            clientSocket.emit('joinRoom', ROOM_ID);
            clientSocket.on('joined', (receivedRoomId: string) => {
                expect(receivedRoomId).to.equal(ROOM_ID);
                done();
            });
        });
        it('should handle joinRoom event if the room does not exist', (done) => {
            const wrongRoomId = '1111';
            clientSocket.emit('joinRoom', wrongRoomId);
            roomsManagerMock.getRoomById = () => null;
            clientSocket.on('joined', () => {
                expect(mockRoom.players.size).to.equal(1);
                done();
            });
        });
    });
    describe('Username Validation', () => {
        let username = 'testUser';
        beforeEach(() => {
            username = `testUser_${Math.random().toString(LETTER_POOL).substring(LETTERS_SELECTED)}`;
        });

        it('should validate username in an unlocked room', (done) => {
            mockRoom.isQuizLocked = false;

            clientSocket.emit('joinRoom', ROOM_ID);
            clientSocket.on('joined', () => {
                clientSocket.emit('validateUsername', { roomId: ROOM_ID, username });
                clientSocket.on('validated', (validated) => {
                    expect(validated).to.equal(true);
                    done();
                });
            });
        });
        it('should not validate name if room is locked', (done) => {
            mockRoom.isQuizLocked = true;
            clientSocket.emit('joinRoom', ROOM_ID);
            clientSocket.on('joined', () => {
                clientSocket.emit('validateUsername', { roomId: ROOM_ID, username });
                clientSocket.on('joined', () => {
                    expect(mockRoom.players.size).to.equal(1);
                    done();
                });
            });
        });
    });
    describe('Leaving Room', () => {
        it('should handle a regular participant leaving the room', (done) => {
            clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
            clientSocket.emit('leaveRoom');
            mockRoom.isOrganizer = () => false;
            clientSocket.on('playersUpdated', () => {
                expect(mockRoom.players.size).to.equal(1);
                done();
            });
        });
    });
    describe('Is room empty event', () => {
        it('should return false to the client if the room is empty', (done) => {
            clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
            clientSocket.emit('isRoomEmpty');
            mockRoom.isRoomEmpty = () => false;
            clientSocket.on('roomEmpty', (empty: boolean) => {
                expect(empty).to.equal(false);
                done();
            });
        });
        it('should return true to the client if the room is not empty', (done) => {
            clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
            clientSocket.emit('isRoomEmpty');
            mockRoom.isRoomEmpty = () => true;
            clientSocket.on('roomEmpty', (empty: boolean) => {
                expect(empty).to.equal(true);
                done();
            });
        });
    });
    it('should return true to the client when unlocking room', (done) => {
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('lockRoom');
        mockRoom.isQuizLocked = false;
        clientSocket.on('roomLocked', (empty: boolean) => {
            expect(empty).to.equal(true);
            done();
        });
    });
    it('should ban player', (done) => {
        const expectedSize = 1;
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('banPlayer', 'a');
        clientSocket.on('playersUpdated', () => {
            expect(mockRoom.players.size).to.equal(expectedSize);
            done();
        });
    });
    it('should handle getUsers event', (done) => {
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('getUsers');
        mockRoom.getUsernameList = () => ['org', 'player1'];
        clientSocket.on('users', (usernames: string[]) => {
            expect(usernames.length).to.equal(2);
            done();
        });
    });
    it('should handle endQuiz event', (done) => {
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('endQuiz', ROOM_ID);

        const question: QuestionObj = {
            id: '1',
            question: 'Question 1',
            points: 10,
            choices: [],
            type: 'MCQ',
        };
        mockRoom.currentQst = question;
        mockRoom.playerAnswers = [0, 0, 0, 0];
        clientSocket.on('resultView', () => {
            expect(mockRoom.isFirst).to.equal(true);
            done();
        });
    });
    it('should handle startQuiz event', (done) => {
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('startQuiz', ROOM_ID);

        const choicesObj: ChoicesObj[] = [
            { choice: '1', isCorrect: true },
            { choice: '2', isCorrect: false },
        ];
        mockRoom.isPanicMode = true;
        const question: QuestionObj = {
            id: '1',
            question: 'Question 1',
            points: 10,
            choices: choicesObj,
            type: 'MCQ',
        };
        mockRoom.questions = [question];
        clientSocket.on('quizStarted', () => {
            expect(true).to.equal(true);
            done();
        });
    });
    it('the timer should be 4 time faster after clicking', (done) => {
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('startQuiz', ROOM_ID);

        const choicesObj: ChoicesObj[] = [
            { choice: '1', isCorrect: true },
            { choice: '2', isCorrect: false },
        ];
        mockRoom.isPanicMode = false;
        const question: QuestionObj = {
            id: '1',
            question: 'Question 1',
            points: 10,
            choices: choicesObj,
            type: 'MCQ',
        };
        mockRoom.questions = [question];
        clientSocket.on('quizStarted', () => {
            expect(mockRoom.isPanicMode).to.equal(false);
            done();
        });
    });
    it('should handle startPreQuizTimer event', (done) => {
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('startPreQuizTimer', ROOM_ID);
        const expectedCount = 5;
        clientSocket.on('countdown', (count: number) => {
            expect(count).to.equal(expectedCount);
            done();
        });
    });
    it('should handle player forfeit event', (done) => {
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'player1' });
        clientSocket.emit('forfeit');
        clientSocket.on('inGamePlayersUpdated', (players: Player[]) => {
            expect(players.length).to.equal(2);
            done();
        });
    });
    it('should handle launchQuestion event', (done) => {
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('launchQuestion');
        const expectedCount = 3;
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
        mockRoom.playerAnswers = [0, 0, 0, 0];
        mockRoom.currentQst = questionObj;
        mockRoom.questions = [questionObj, questionObj];
        clientSocket.on('nextQuestionCountdown', (count: number) => {
            expect(count).to.equal(expectedCount);
            done();
        });
    });
    it('should handle allPlayerAnswered event', (done) => {
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('allPlayerAnswered');
        const choicesObj: ChoicesObj[] = [
            { choice: '1', isCorrect: true },
            { choice: '2', isCorrect: false },
        ];
        mockRoom.playerAnswers = [0, 0];
        const questionObj: QuestionObj = {
            id: '1',
            question: 'Question 1',
            points: 10,
            choices: choicesObj,
            type: 'LAQ',
        };
        mockRoom.currentQst = questionObj;
        clientSocket.on('correctAnswerQuestion', (question: QuestionObj) => {
            expect(question.choices.length).to.equal(2);
            done();
        });
    });
    it('should handle allPlayerAnswered event when it is a random quiz', (done) => {
        mockRoom.isRandomQuiz = true;
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('allPlayerAnswered');
        const choicesObj: ChoicesObj[] = [
            { choice: '1', isCorrect: true },
            { choice: '2', isCorrect: false },
        ];
        mockRoom.playerAnswers = [0, 0];
        const questionObj: QuestionObj = {
            id: '1',
            question: 'Question 1',
            points: 10,
            choices: choicesObj,
            type: 'MCQ',
        };
        mockRoom.currentQst = questionObj;
        mockRoom.previewQst = undefined;
        clientSocket.on('transitionView', () => {
            expect(mockRoom.isRandomQuiz).to.equal(true);
            done();
        });
    });
    it('should handle toggleMute event', (done) => {
        const player: Player = {
            username: 'a',
            points: 0,
            goodAnswer: false,
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        };
        clientSocket.emit('validateUsername', { roomId: ROOM_ID, username: 'a' });
        clientSocket.emit('toggleMute', player);
        clientSocket.on('mute', (res: Player) => {
            expect(res.isMuted).to.equal(true);
            done();
        });
    });
});
