// used for mocking private method: generateRoomId
/* eslint-disable @typescript-eslint/no-explicit-any */
import { RoomsManager } from '@app/services/rooms-manager-service/rooms-manager.service';
import { expect } from 'chai';
import * as sinon from 'sinon';

const MAX_ROOMS = 10000;

describe('RoomsManager', () => {
    let roomsManager: RoomsManager;

    beforeEach(() => {
        roomsManager = new RoomsManager();
    });

    describe('openRoom', () => {
        it('should successfully open a new room and return its ID', () => {
            (sinon.stub(roomsManager as any, 'generateRoomId') as sinon.SinonStub).returns('0001');
            const quizId = 'quiz123';
            const organizerId = 'org123';

            const roomId = roomsManager.openRoom(quizId, organizerId);

            expect(roomId).to.equal('0001');
            const room = roomsManager.getRoomById(roomId);
            expect(room).to.not.equal(null);
            // expect(room?.getQuizId()).to.equal(quizId);
            expect(room?.getOrganizer()).to.equal(organizerId);
        });
    });

    describe('closeRoom', () => {
        it('should successfully close and remove a room by its ID', () => {
            const quizId = 'quiz123';
            const organizerId = 'org123';
            (sinon.stub(roomsManager as any, 'generateRoomId') as sinon.SinonStub).returns('0001');
            const roomId = roomsManager.openRoom(quizId, organizerId);

            roomsManager.closeRoom(roomId);
            const room = roomsManager.getRoomById(roomId);
            expect(room).to.equal(null);
        });
    });

    describe('getRoomById', () => {
        it('should return the correct room instance given a room ID', () => {
            const quizId = 'quiz123';
            const organizerId = 'org123';
            (sinon.stub(roomsManager as any, 'generateRoomId') as sinon.SinonStub).returns('0001');
            const roomId = roomsManager.openRoom(quizId, organizerId);

            const room = roomsManager.getRoomById(roomId);
            expect(room).to.not.equal(null);
            // expect(room?.getQuizId()).to.equal(quizId);
            expect(room?.getOrganizer()).to.equal(organizerId);
        });

        it('should return null if the room ID does not exist', () => {
            const room = roomsManager.getRoomById('nonExistentId');
            expect(room).to.equal(null);
        });
    });

    describe('getRooms', () => {
        it('should return all rooms', () => {
            const quizId = 'quiz123';
            const organizerId = 'org123';
            const roomId1 = roomsManager.openRoom(quizId, organizerId);
            const roomId2 = roomsManager.openRoom(quizId, organizerId);
            const rooms = roomsManager.getRooms();
            expect(Array.from(rooms.keys())).to.include(roomId1);
            expect(Array.from(rooms.keys())).to.include(roomId2);
        });
    });

    describe('generateRoomId', () => {
        it('should return a random roomId on room creation', () => {
            const quizId = 'quiz123';
            const organizerId = 'org123';
            const roomId1 = roomsManager.openRoom(quizId, organizerId);
            expect(Number(roomId1)).to.lessThan(MAX_ROOMS);
            expect(Number(roomId1)).to.greaterThanOrEqual(0);
        });
    });

    afterEach(() => {
        sinon.restore();
    });
});
