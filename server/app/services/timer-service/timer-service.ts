import { RoomsManager } from '@app/services/rooms-manager-service/rooms-manager.service';
import { RoomPair } from '@app/services/socket-manager-service/socket-manager.service';
import { LAQ_ACTIVITY_INTERVAL, LAQ_DURATION, MS_IN_SECONDS, MS_QUARTER_SECONDS } from '@common/constant';
import * as io from 'socket.io';

export class TimerService {
    startCountdown(sio: io.Server, roomsManager: RoomsManager, roomId: string): void {
        const room = roomsManager.getRoomById(roomId);
        if (room) {
            if (!room.isTimerPaused) {
                room.timer = room.currentQst.type === 'MCQ' ? room.currentTimer : LAQ_DURATION;
            }
            if (room.isPanicMode) {
                this.panicModeCountdown(sio, roomsManager, roomId);
                return;
            }
            room.isTimerPaused = false;
            sio.to(roomId).emit('countdown', room.timer);
            room.initializeAllPlayersHeatBeat(LAQ_ACTIVITY_INTERVAL);
            const roomPair: RoomPair = { room, roomId };
            this.handleLAQInputFrames(roomPair, room.timer, sio);
            room.timer--;
            clearInterval(room.intervalId);
            room.intervalId = setInterval(() => {
                if (room.timer >= 0) {
                    sio.to(roomId).emit('countdown', room.timer);
                    if (!room.isPanicMode) {
                        this.handleLAQInputFrames(roomPair, room.timer, sio);
                        room.timer--;
                    } else {
                        this.panicModeCountdown(sio, roomsManager, roomId);
                    }
                    room.currentTimer = room.timer;
                } else {
                    sio.to(roomId).emit('playerAnswers', Array.from(room.getPlayers().values()));
                    clearInterval(room.intervalId);
                }
            }, MS_IN_SECONDS);
        }
    }

    panicModeCountdown(sio: io.Server, roomsManager: RoomsManager, roomId: string) {
        const room = roomsManager.getRoomById(roomId);
        if (room) {
            clearInterval(room.intervalId);
            room.isTimerPaused = false;
            sio.to(roomId).emit('countdown', room.timer);
            room.timer--;
            room.intervalId = setInterval(() => {
                if (room.timer >= 0) {
                    sio.to(roomId).emit('countdown', room.timer);
                    const roomPair: RoomPair = { room, roomId };
                    this.handleLAQInputFrames(roomPair, room.timer, sio);
                    room.timer--;
                } else {
                    sio.to(roomId).emit('playerAnswers', Array.from(room.getPlayers().values()));
                    clearInterval(room.intervalId);
                }
            }, MS_QUARTER_SECONDS);
        }
    }

    nextQuestionCountdown(sio: io.Server, roomsManager: RoomsManager, roomId: string) {
        const room = roomsManager.getRoomById(roomId);
        if (room) {
            let count = 3;
            sio.to(roomId).emit('nextQuestionCountdown', count);
            count--;
            clearInterval(room.intervalId);
            room.intervalId = setInterval(() => {
                if (count >= 0) {
                    sio.to(roomId).emit('nextQuestionCountdown', count);
                    count--;
                } else {
                    clearInterval(room.intervalId);
                    room.launchQst();
                    room.resetAllPlayerHeartBeat();
                    this.startCountdown(sio, roomsManager, roomId);
                    sio.to(roomId).emit('questionView');
                    sio.to(roomId).emit('newCurrentQst', room.currentQst);
                    sio.to(roomId).emit('newPreviewQst', room.previewQst);
                    sio.to(roomId).emit('players', room.getPlayersList());
                    sio.to(roomId).emit('startQuestion');
                }
            }, MS_IN_SECONDS);
        }
    }

    showResultsCountdown(sio: io.Server, roomsManager: RoomsManager, roomId: string) {
        const room = roomsManager.getRoomById(roomId);
        if (room) {
            let count = 3;
            sio.to(roomId).emit('nextQuestionCountdown', count);
            count--;
            clearInterval(room.intervalId);
            room.intervalId = setInterval(() => {
                if (count >= 0) {
                    sio.to(roomId).emit('nextQuestionCountdown', count);
                    count--;
                } else {
                    room.handleEndQuestion();
                    const serializedMap = JSON.stringify(Array.from(room.answers.entries()));
                    sio.to(roomId).emit('finishedQuizInfo', serializedMap);
                    sio.to(roomId).emit('finishedQuizQuestions', room.questions);
                    sio.to(roomId).emit('resultView');
                    sio.to(roomId).emit('players', room.getPlayersList());
                }
            }, MS_IN_SECONDS);
        }
    }

    startPreQuizCountdown(sio: io.Server, roomsManager: RoomsManager, roomId: string): void {
        const room = roomsManager.getRoomById(roomId);
        if (room) {
            let count = 5;
            sio.to(roomId).emit('preQuizStarted');
            sio.to(roomId).emit('countdown', count);
            count--;
            clearInterval(room.intervalId);
            room.intervalId = setInterval(() => {
                if (count >= 0) {
                    sio.to(roomId).emit('countdown', count);
                    count--;
                } else {
                    clearInterval(room.intervalId);
                }
            }, MS_IN_SECONDS);
        }
    }

    getCurrentTime(): string {
        const currentTime: Date = new Date();
        const hours: string = currentTime.getHours().toString().padStart(2, '0');
        const minutes: string = currentTime.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    handleLAQInputFrames(roomPair: RoomPair, currentTimer: number, sio: io.Server) {
        if (roomPair.room.currentQst.type === 'LAQ') {
            roomPair.room.clearAfterInterval();
            roomPair.room.updateHeartBeats();
            sio.to(roomPair.roomId).emit(
                'LAQOptions',
                JSON.stringify({
                    modifications: roomPair.room.getTotalPlayersAlive(LAQ_ACTIVITY_INTERVAL),
                    numOfPlayers: roomPair.room.players.size - 1,
                }),
            );
        }
    }
}
