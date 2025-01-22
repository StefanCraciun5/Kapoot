import { Room } from '@app/classes/room/room';

const maxRooms = 10000;
const leadingZeroes = 4;

export class RoomsManager {
    private rooms: Map<string, Room> = new Map();

    openRoom(quizId: string, organizerId: string): string {
        const roomId = this.generateRoomId();
        this.rooms.set(roomId, new Room(quizId, organizerId));
        return roomId;
    }

    closeRoom(roomId: string): void {
        this.rooms.delete(roomId);
    }

    getRoomById(roomId: string): Room | null {
        return this.rooms.get(roomId) || null;
    }

    getRooms(): Map<string, Room> {
        return this.rooms;
    }

    private generateRoomId(): string {
        const randomNumber = Math.floor(Math.random() * maxRooms);
        return randomNumber.toString().padStart(leadingZeroes, '0');
    }
}
