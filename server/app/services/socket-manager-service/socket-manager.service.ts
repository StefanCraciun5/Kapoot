/* eslint-disable max-lines */
import { Room } from '@app/classes/room/room';
import { RoomsManager } from '@app/services/rooms-manager-service/rooms-manager.service';
import { TimerService } from '@app/services/timer-service/timer-service';
import { LAQ_ACTIVITY_INTERVAL } from '@common/constant';
import { ValidateUsername } from '@common/message';
import { Player, ValidateLAQ } from '@common/player';
import * as http from 'http';
import * as io from 'socket.io';

export interface RoomPair {
    room: Room;
    roomId: string;
}

export class SocketManager {
    private sio: io.Server;
    private roomsManager: RoomsManager;
    private timerService: TimerService;
    private clients: Map<string, string> = new Map();

    constructor(server: http.Server) {
        this.sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
        this.roomsManager = new RoomsManager();
        this.timerService = new TimerService();
    }

    handleSockets(): void {
        this.sio.on('connection', (socket) => {
            socket.on('createRoom', (quizId: string) => {
                const roomId = this.roomsManager.openRoom(quizId, socket.id);
                socket.join(roomId);
                this.sio.to(socket.id).emit('createdRoom', roomId);
                this.clients.set(socket.id, roomId);
            });
            socket.on('joinRoom', (roomId: string) => {
                const roomInstance = this.roomsManager.getRoomById(roomId);
                if (roomInstance && !roomInstance.isQuizLocked) {
                    this.sio.to(socket.id).emit('joined', roomId);
                    this.clients.set(socket.id, roomId);
                } else {
                    this.sio.to(socket.id).emit('joined');
                }
            });
            socket.on('forceJoin', (roomId: string) => {
                const roomInstance = this.roomsManager.getRoomById(roomId);
                if (roomInstance) {
                    socket.join(roomId);
                    this.clients.set(socket.id, roomId);
                    roomInstance.addPlayer(socket.id, 'organisateur ');
                    this.clients.set(socket.id, roomId);
                    this.sio.to(socket.id).emit('forcedJoin', roomId);
                }
            });
            socket.on('validateUsername', (data: ValidateUsername) => {
                const roomInstance = this.roomsManager.getRoomById(data.roomId);
                if (!roomInstance.isQuizLocked) {
                    socket.join(data.roomId);
                    const joined = roomInstance.addPlayer(socket.id, data.username);
                    this.clients.set(socket.id, data.roomId);
                    this.sio.to(socket.id).emit('validated', joined);
                } else {
                    this.sio.to(socket.id).emit('joined');
                }
            });

            socket.on('leaveRoom', () => {
                const { room, roomId } = this.findRoom(socket.id);
                if (room) {
                    if (room.isOrganizer(socket.id)) {
                        for (const playerId of room.getPlayers().keys()) {
                            room.removePlayer(playerId);
                            this.sio.to(playerId).emit('organizerDisconnected');
                            this.clients.delete(playerId);
                        }
                        this.roomsManager.closeRoom(roomId);
                    } else {
                        room.removePlayerInWaitRoom(socket.id);
                        this.clients.delete(socket.id);
                        this.sio.to(roomId).emit('playersUpdated');
                        socket.leave(roomId);
                    }
                }
            });
            socket.on('sendMessage', (chat: string) => {
                const { room, roomId } = this.findRoom(socket.id);
                if (room) {
                    if (!room.players.get(socket.id).isMuted) {
                        const time = this.timerService.getCurrentTime();
                        const username = room.getUsernameById(socket.id);
                        const message = `${username}: ${chat}`;
                        this.sio.to(roomId).emit('updateChat', [time, message]);
                    }
                }
            });
            socket.on('lockQuiz', () => {
                const { room, roomId } = this.findRoom(socket.id);
                if (room) {
                    room.lockQuiz();
                    this.sio.to(roomId).emit('quizLocked');
                }
            });
            socket.on('sendLiveChoices', (answers: number[]) => {
                const { room, roomId } = this.findRoom(socket.id);
                if (room) {
                    room.modifyLiveChoices(answers);
                    room.startAnswering(socket.id);
                    const response = {
                        answers: room.getPlayerAnswers(),
                        players: room.getPlayersList(),
                    };
                    this.sio.to(roomId).emit('liveChoices', JSON.stringify(response));
                }
            });
            socket.on('submitAnswer', (answer: number[]) => {
                const { room, roomId } = this.findRoom(socket.id);
                if (room) {
                    if (room.currentTimer >= 0) {
                        const player = { ...room.players.get(socket.id), isSubmitted: true };
                        room.players.set(socket.id, player);
                        room.players.set(socket.id, player);
                    }
                    room.answerOrder.enqueue(answer);
                    room.validateAnswer(socket.id);
                    this.sio.to(socket.id).emit('transitionView');
                    this.sio.to(roomId).emit('players', room.getPlayersList());
                }
            });
            socket.on('typeLAQ', () => {
                const { room, roomId } = this.findRoom(socket.id);
                room.startAnswering(socket.id);
                room.startTyping(socket.id);
                socket.to(roomId).emit(
                    'LAQOptions',
                    JSON.stringify({
                        modifications: room.getTotalPlayersAlive(LAQ_ACTIVITY_INTERVAL),
                        numOfPlayers: room.players.size - 1,
                    }),
                );
            });
            socket.on('submitLAQAnswer', (answer: string) => {
                const { room, roomId } = this.findRoom(socket.id);
                if (room) {
                    if (room.currentTimer >= 0) {
                        room.players.get(socket.id).isSubmitted = true;
                        this.sio.to(roomId).emit('players', room.getPlayersList());
                    }
                }
                room.submitLAQAnswer(socket.id, answer);
                this.sio.to(roomId).emit('players', room.getPlayersList());
                this.sio.to(socket.id).emit('transitionView');
            });
            socket.on('evaluateAnswers', () => {
                const { room, roomId } = this.findRoom(socket.id);
                if (room) {
                    clearInterval(room.intervalId);
                    this.sio.to(roomId).emit('evaluating', room.getSortedLAQAnswers());
                }
            });
            socket.on('validateLAQ', (validate: ValidateLAQ) => {
                const { room, roomId } = this.findRoom(socket.id);
                if (room) {
                    room.validateLAQ(validate.username, validate.percentage);
                }
                this.sio.to(roomId).emit('updatePlayersPoints', room.getPlayersList());
            });
            socket.on('allPlayerAnswered', () => {
                const { room, roomId } = this.findRoom(socket.id);
                if (room) {
                    clearInterval(room.intervalId);
                    room.setOrganizerFinal();
                    const players = room.getPlayers();
                    if (room.currentQst.type === 'LAQ') {
                        for (const playerID of room.players.keys()) {
                            this.sio.to(playerID).emit('LAQPoints', room.getPlayerLAQCurrentPoints(playerID));
                        }
                        this.sio.to(roomId).emit('orgView');
                        this.sio.to(roomId).emit('newCurrentQst', room.currentQst);
                        this.sio.to(roomId).emit('newPreviewQst', room.previewQst);
                        this.sio.to(roomId).emit('updatePlayersPoints', room.getPlayersList());
                        this.sio.to(roomId).emit('questionOver', true);
                        this.sio.to(roomId).emit(
                            'LAQOptions',
                            JSON.stringify({
                                modifications: room.getTotalPlayersAlive(LAQ_ACTIVITY_INTERVAL),
                                numOfPlayers: room.players.size - 1,
                            }),
                        );
                        room.resetAllPlayersLAQPoints();
                    }
                    for (const [id, player] of players.entries()) {
                        this.sio.to(id).emit('answerValidated', player.goodAnswer);
                    }
                }
                this.sio.to(roomId).emit('correctAnswerQuestion', room.currentQst);
                if (room.isRandomQuiz) {
                    if (room.previewQst) {
                        room.handleEndQuestion();
                        this.timerService.nextQuestionCountdown(this.sio, this.roomsManager, roomId);
                    } else {
                        this.sio.to(socket.id).emit('transitionView');
                        this.timerService.showResultsCountdown(this.sio, this.roomsManager, roomId);
                        room.insertHistory();
                    }
                    room.playerAnswers.fill(0);
                }
            });
            socket.on('launchQuestion', () => {
                const { room, roomId } = this.findRoom(socket.id);
                // room.launchQst();
                room.handleEndQuestion();

                if (room) {
                    room.playerAnswers = Array(room.currentQst.choices.length).fill(0);
                    room.clearAnswering();
                    this.timerService.nextQuestionCountdown(this.sio, this.roomsManager, roomId);
                }
            });
            socket.on('skipQuestion', (offset: number) => {
                const { room } = this.findRoom(socket.id);
                room.skipQuestion(offset === 1 ? 1 : 0);
                this.sio.to(socket.id).emit('questionSkipped', room.previewQst);
            });
            socket.on('forfeit', () => {
                const { room, roomId } = this.findRoom(socket.id);
                if (room) {
                    if (room.isOrganizer(socket.id)) {
                        for (const playerId of room.getPlayers().keys()) {
                            room.removePlayer(playerId);
                            this.sio.to(playerId).emit('organizerDisconnected');
                            this.clients.delete(playerId);
                        }
                        this.roomsManager.closeRoom(roomId);
                    } else {
                        room.removePlayer(socket.id);
                        const username = room.getUsernameById(socket.id);
                        this.sio.to(roomId).emit('skedaddle', username);
                        this.sio.to(roomId).emit('inGamePlayersUpdated', room.getPlayersList());
                        this.clients.delete(socket.id);
                        if (room.isOrganizerRemaining()) {
                            this.roomsManager.closeRoom(roomId);
                            this.sio.to(roomId).emit('gameEnded');
                            const organizerId = room.getOrganizer();
                            this.clients.delete(organizerId);
                            room.removePlayer(organizerId);
                        }
                    }
                }
            });
            socket.on('startPreQuizTimer', (roomId: string) => {
                const room = this.roomsManager.getRoomById(roomId);
                if (room) {
                    this.timerService.startPreQuizCountdown(this.sio, this.roomsManager, roomId);
                }
            });
            socket.on('startQuiz', (roomId: string) => {
                const room = this.findRoom(socket.id).room;
                if (room) {
                    room.startQuiz();
                    room.resetAllPlayerHeartBeat();
                    this.timerService.startCountdown(this.sio, this.roomsManager, roomId);
                    this.sio.to(roomId).emit('questionView');
                    this.sio.to(roomId).emit('newCurrentQst', room.currentQst);
                    this.sio.to(roomId).emit('newPreviewQst', room.previewQst);
                    this.sio.to(roomId).emit('players', room.getPlayersList());
                    this.sio.to(roomId).emit('quizStarted');
                }
            });
            socket.on('endQuiz', (roomId: string) => {
                const room = this.roomsManager.getRoomById(roomId);
                if (room) {
                    room.handleEndQuestion();
                    room.stopAnsweringAll();
                    const serializedMap = JSON.stringify(Array.from(room.answers.entries()));
                    this.sio.to(roomId).emit('finishedQuizInfo', serializedMap);
                    this.sio.to(roomId).emit('finishedQuizQuestions', room.questions);
                    this.sio.to(roomId).emit('players', room.getPlayersList());
                    this.sio.to(roomId).emit('resultView');
                    room.insertHistory();
                }
            });
            socket.on('getUsers', () => {
                const { room, roomId } = this.findRoom(socket.id);
                if (room) {
                    const usernames = room.getUsernameList();
                    this.sio.to(roomId).emit('users', usernames);
                }
            });
            socket.on('banPlayer', (username: string) => {
                const { room, roomId } = this.findRoom(socket.id);
                if (room) {
                    const socketId = room.banName(username);
                    this.sio.to(roomId).emit('playersUpdated');
                    this.sio.to(socketId).emit('banned');
                }
            });
            socket.on('lockRoom', () => {
                const { room, roomId } = this.findRoom(socket.id);
                if (room) {
                    room.toggleIsQuizLocked();
                    this.sio.to(roomId).emit('roomLocked', room.isQuizLocked);
                }
            });
            socket.on('isRoomEmpty', () => {
                const { room, roomId } = this.findRoom(socket.id);
                if (room) {
                    if (room.isRandomQuiz) {
                        this.sio.to(roomId).emit('roomEmpty', false);
                    } else {
                        const empty = room.isRoomEmpty();
                        this.sio.to(roomId).emit('roomEmpty', empty);
                    }
                }
            });
            socket.on('isRandomGame', () => {
                const { room, roomId } = this.findRoom(socket.id);
                if (room) {
                    this.sio.to(roomId).emit('isRandomGameAns', room.isRandomQuiz);
                }
            });
            socket.on('toggleTimer', () => {
                const { room, roomId } = this.findRoom(socket.id);
                if (room) {
                    if (!room.isTimerPaused) {
                        this.stopTimer(roomId);
                    } else {
                        this.timerService.startCountdown(this.sio, this.roomsManager, roomId);
                    }
                }
            });
            socket.on('panicMode', () => {
                const { room, roomId } = this.findRoom(socket.id);
                if (room) {
                    room.isPanicMode = true;
                    this.sio.to(roomId).emit('panicSound');
                }
            });
            socket.on('toggleMute', (player: Player) => {
                const { room, roomId } = this.findRoom(socket.id);
                if (room) {
                    for (const [roomPlayerId, roomPlayer] of room.players) {
                        if (player.username === roomPlayer.username) {
                            const newPlayer = { ...roomPlayer, isMuted: !roomPlayer.isMuted };
                            room.players.set(roomPlayerId, newPlayer);
                            this.sio.to(roomId).emit('mute', newPlayer);
                            return;
                        }
                    }
                }
            });
        });
    }
    private stopTimer(roomId: string): void {
        const room = this.roomsManager.getRoomById(roomId);
        if (room && room.intervalId) {
            room.isTimerPaused = true;
            clearInterval(room.intervalId);
            room.intervalId = null;
        }
    }
    private findRoom(clientId: string): RoomPair {
        if (!this.clients.has(clientId)) {
            return { room: null, roomId: null };
        }
        const roomId = this.clients.get(clientId);
        const room = this.roomsManager.getRoomById(roomId);
        return { room, roomId };
    }
}
