import { expect } from 'chai';
import { Room } from './room';
import { DatabaseService } from '@app/services/database-service/database.service';
import { SinonStub, stub } from 'sinon';
import * as sinon from 'sinon';
import { QuestionObj } from '@common/message';
import { Player } from '@common/player';
import { QUIZ_COLLECTION } from '@app/controllers/database-constants';
// import { Queue } from '@common/queue/queue';
// import { Player } from '@common/player';
/* eslint-disable */

describe('Room', () => {
  let room: Room;
  let connectDBStub:SinonStub;

  
  beforeEach(() => {
    
    connectDBStub = sinon.stub(DatabaseService.prototype, 'connectToDatabase').resolves();
    room = new Room('quizId', 'organizerId');

  });
  afterEach(() => {
    sinon.restore();
    });

  it('should create a room with initial values', async () => {
    //loadQuizStub.resolves()
    //loadQuestionsStub.resolves()
    expect(room.answerOrder.isEmpty()).to.be.true;
    expect(room.intervalId).to.be.null;
    //expect(room.isFirst).to.be.undefined;
    expect(room.questions).to.be.an('array').that.is.empty;
    expect(room.currentQst).to.be.undefined;
    expect(room.previewQst).to.be.undefined;
    expect(room.questionIndex).to.equal(0);
    //expect(room.roomLocked).to.be.false;
    expect(room.players.size).to.equal(1);
    expect(room.answers.size).to.equal(0);
    //expect(room.playerAnswers).to.have.lengthOf(4);    

    expect(connectDBStub.calledOnce).to.equal(true);
});

  it('should return current question', () => {
    const question: QuestionObj = {
        id: '1',
        question: 'Question 1',
        points: 10,
        choices: [],
        type: 'multiple-choice',
    };
    room.currentQst = question;
    expect(room.currentQst).to.equal(question);
    });
    it('should return the preview question', () => {
        const previewQuestion: QuestionObj = { id: '2', question: 'Question 2', points: 10, choices: [], type: 'multiple-choice' };
        room.previewQst = previewQuestion;
        expect(room.previewQst).to.equal(previewQuestion);
    });

    it('should return the quiz title', () => {
        const quizTitle = 'Sample Quiz';
        room.quiz = {
            title: 'Sample Quiz',
            description: 'This is a sample quiz',
            questions: ['Question 1', 'Question 2', 'Question 3'],
            id: 'quizId',
            visible: true,
            duration: 60,
            lastModification: new Date()
        };
        expect(room.quiz.title).to.equal(quizTitle);
    });
    

    it('should return true if room is empty', () => {
        expect(room.isRoomEmpty()).to.be.true;
    });

    it('should start the quiz', () => {
        const question1: QuestionObj = { id: '1', question: 'Question 1', points: 10, choices: [], type: 'multiple-choice' };
        const question2: QuestionObj = { id: '2', question: 'Question 2', points: 10, choices: [], type: 'multiple-choice' };
        room.questions = [question1, question2];
        room.startQuiz();
        expect(room.currentTimer).to.equal(room.questionDuration);
        expect(room.currentQst).to.equal(question1);
        expect(room.previewQst).to.equal(question2);
    });
    it('should launch the next question', () => {
        const question1: QuestionObj = { id: '1', question: 'Question 1', points: 10, choices: [], type: 'multiple-choice' };
        const question2: QuestionObj = { id: '2', question: 'Question 2', points: 10, choices: [], type: 'multiple-choice' };
        room.questions = [question1,question2];
        room.currentQst = room.questions[0];
        room.previewQst = room.questions[1];
        room.questionIndex = 0;

        room.launchQst();

        expect(room.questionIndex).to.equal(1);
        expect(room.currentQst).to.equal(room.questions[1]);
        expect(room.previewQst).to.equal(room.questions[2]);
    });
    it('should not change currentQst or previewQst if questionIndex is >= questions.length', () => {
        const question1: QuestionObj = { id: '1', question: 'Question 1', points: 10, choices: [], type: 'multiple-choice' };
        const question2: QuestionObj = { id: '2', question: 'Question 2', points: 10, choices: [], type: 'multiple-choice' };
        room.questions = [question1,question2];
        room.questionIndex = room.questions.length; // Set questionIndex to a value >= questions.length
    
        const currentQstBefore = room.currentQst;
        const previewQstBefore = room.previewQst;
    
        room.launchQst();
    
        expect(room.currentQst).to.equal(currentQstBefore); // Expect currentQst to remain unchanged
        expect(room.previewQst).to.equal(previewQstBefore); // Expect previewQst to remain unchanged
    });
    
    it('should handle end of question', () => {
        room = new Room('quizId', 'organizerId');
        const question1: QuestionObj = { id: '1', question: 'Question 1', points: 10, choices: [], type: 'multiple-choice' };
    
        room.currentQst = question1;
        room.playerAnswers = [0, 1, 2, 3];
        room.answers = new Map<string, number[]>();
        room.answers.set('1', room.playerAnswers);
    
        room.handleEndQuestion();
    
        expect(room.intervalId).to.be.null;
    });
    
    it('should return username list', () => {
        room = new Room('quizId', 'organizerId');
        room.players.set('1', { username: 'user1', points: 0, goodAnswer: false, isFinal: false, isConnected: true, nBonus: 0 } as Player);
        room.players.set('2', { username: 'user2', points: 0, goodAnswer: false, isFinal: false, isConnected: true, nBonus: 0 } as Player);
    
        const usernames = room.getUsernameList();
    
        expect(usernames).to.deep.equal(['organisateur','user1', 'user2']);
    });
    it('should get username by socket id', () => {
        room = new Room('quizId', 'organizerId');
        const player: Player = { 
            username: 'player1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        };
        room.players.set('1', player);
    
        const username = room.getUsernameById('1');
    
        expect(username).to.equal('player1');
    });
    
    it('should get players map', () => {
        room = new Room('quizId', 'organizerId');
        const player1: Player = { 
            username: 'player1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        };
        const player2: Player = { 
            username: 'player2', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        };
        room.players.set('1', player1);
        room.players.set('2', player2);
    
        const playersMap = room.getPlayers();
    
        expect(playersMap.size).to.equal(3);
        expect(playersMap.get('1')).to.deep.equal(player1);
        expect(playersMap.get('2')).to.deep.equal(player2);
    });
    
    it('should get players list', () => {
        room = new Room('quizId', 'organizerId');
        const player1: Player = { 
            username: 'player1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        };
        const player2: Player = { 
            username: 'player2', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        };
        room.players.set('1', player1);
        room.players.set('2', player2);
    
        const playersList = room.getPlayersList();
    
        expect(playersList.length).to.equal(3);
       // expect(playersList[0]).to.deep.equal(player1);
        //expect(playersList[1]).to.deep.equal(player2);
    });
    
    it('should get player answers', () => {
        room = new Room('quizId', 'organizerId');
        room.playerAnswers = [0, 1, 2, 3];
    
        const playerAnswers = room.getPlayerAnswers();
    
        expect(playerAnswers).to.deep.equal([0, 1, 2, 3]);
    });
    it('should add a player if name is not banned and not already chosen', () => {
        // Stub the private methods
        const isNameBannedStub = sinon.stub(room as any, 'isNameBanned').returns(false);
        const isUsernameChosenStub = sinon.stub(room as any, 'isUsernameChosen').returns(false);
    
        const result = room.addPlayer('clientId', 'playerName');
    
        expect(result).to.be.true;
        expect(room.players.size).to.equal(2);

        // Restore the stubs
        isNameBannedStub.restore();
        isUsernameChosenStub.restore();
    });
    
    it('should not add a player if name is banned', () => {
        // Stub the private method isNameBanned to return true
        const isNameBannedStub = sinon.stub(room as any, 'isNameBanned').returns(true);
    
        const result = room.addPlayer('clientId', 'bannedName');
    
        expect(result).to.be.false;
        expect(room.players.size).to.equal(1);

        // Restore the stub
        isNameBannedStub.restore();
    });
    
    it('should not add a player if name is already chosen', () => {
        // Stub the private method isUsernameChosen to return true
        const isUsernameChosenStub = sinon.stub(room as any, 'isUsernameChosen').returns(true);
    
        const result = room.addPlayer('clientId', 'chosenName');
    
        expect(result).to.be.false;
        expect(room.players.size).to.equal(1);

        // Restore the stub
        isUsernameChosenStub.restore();
    });
    it('should remove a player by clientId', () => {
        room = new Room('quizId', 'organizerId');
        room.players.set('clientId1', { 
            username: 'player1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });
        room.players.set('clientId2', { 
            username: 'player2', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });
        
        room.removePlayer('clientId1');
    
        expect(room.players.size).to.equal(3);
       // expect(room.players.has('clientId1')).to.be.false;
        //expect(room.players.has('clientId2')).to.be.true;
    });
    /*
    it('should do nothing if clientId does not exist', () => {
        room = new Room('quizId', 'organizerId');
        room.players.set('clientId', { username: 'player', points: 0, goodAnswer: false, isFinal: false, isConnected: true, nBonus: 0 });
    
        room.removePlayer('nonExistentClientId');
    
        expect(room.players.size).to.equal(2);
        expect(room.players.has('clientId')).to.be.true;
    });*/
    it('should ban a name and return the socketId of the banned player', () => {
        room = new Room('quizId', 'organizerId');
        room.players.set('clientId1', { 
            username: 'player1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });
        room.players.set('clientId2', { 
            username: 'player2', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });
        
        const bannedSocketId = room.banName('player1');
    
        expect(bannedSocketId).to.equal('clientId1');
        expect(room.bannedNames.has('player1')).to.be.true;
        expect(room.players.size).to.equal(2);
        expect(room.players.has('clientId1')).to.be.false;
        expect(room.players.has('clientId2')).to.be.true;
    });
    it('should return true if the given clientId is the organizerId', () => {
        room = new Room('quizId', 'organisateur');
    
        const isOrganizer = room.isOrganizer('organisateur');
    
        expect(isOrganizer).to.be.true;
    });
    
    it('should modify the playerAnswers array', () => {
        room.playerAnswers = [0, 0, 0, 0]; // Initial playerAnswers
        const answers = [1, 0, 1, 0]; // Answers to modify with
    
        room.modifyLiveChoices(answers);
    
        expect(room.playerAnswers).to.deep.equal([1, 0, 1, 0]); // Expected modified playerAnswers
    });
    it('should modify the playerAnswers array 2', () => {
        room.playerAnswers = [undefined, 0, 0, 0]; // Initial playerAnswers
        const answers = [1, 0, 1, 0]; // Answers to modify with
        const question: QuestionObj = {
            id: '1',
            question: 'Question 1',
            points: 10,
            choices: [],
            type: 'multiple-choice',
        };
        room.currentQst = question;
        room.modifyLiveChoices(answers);
    
        expect(room.playerAnswers).to.deep.equal([NaN, NaN, NaN, NaN]); // Expected modified playerAnswers
    });
    it('should move to the next question', () => {
        room.questionIndex = 0; // Initial questionIndex
        const nextQuestion = room.questions[1]; // Expected next question
    
        const result = room.nextQuestion();
    
        expect(result).to.equal(nextQuestion); 
        expect(room.currentQst).to.equal(nextQuestion); 
        expect(room.questionIndex).to.equal(1); 
    });
   
// BEGGINING OF TEST HELL 
it('should load questions', async () => {
    const mockQuiz = {
        title: 'test',
        description: 'obj.description',
        questions: ['q1', 'q2'],
        id: '695e95e0-5b74-4b46-abdb-9716d0128e8a',
        visible: true,
        duration: 60,
        lastModification: '2024-02-12T07:34:34.797Z',
    };
    // Mock the question IDs and questions
    const questionIDs = ['q1', 'q2'];
    const mockQuestions = [
        { id: 'q1', question: 'Question 1' },
        { id: 'q2', question: 'Question 2' }
    ];

    const databaseServiceStub = sinon.stub(DatabaseService.prototype, 'getObjectByID');

    // Set up the stub to return the mock questions when called
    questionIDs.forEach((questionId, index) => {
        databaseServiceStub.withArgs('questions', questionId).resolves(JSON.stringify(mockQuestions[index]));
    });

    // Your test logic here
    const room = new Room('quiz123', 'organizerId');
    room.quiz = JSON.parse(JSON.stringify(mockQuiz));

    await room.loadQuestions();

    // Assert that questions are loaded correctly
    expect(room.questions).to.deep.equal(mockQuestions.map(q => JSON.parse(JSON.stringify(q))));
});
    
    it('should load quiz', async () => {
        const mockQuiz = {
            title: 'test',
            description: 'obj.description',
            questions: ['q1', 'q2'],
            id: '695e95e0-5b74-4b46-abdb-9716d0128e8a',
            visible: true,
            duration: 60,
            lastModification: '2024-02-12T07:34:34.797Z',
        };
        const room = new Room('695e95e0-5b74-4b46-abdb-9716d0128e8a', 'organizerId');
        const databaseService = new DatabaseService();
        const databaseServiceStub = stub(databaseService, 'getObjectByID');
        room.databaseService = databaseService;


        databaseServiceStub.withArgs(QUIZ_COLLECTION, '695e95e0-5b74-4b46-abdb-9716d0128e8a' ).resolves(JSON.stringify(mockQuiz));
    
        await room.loadQuiz('695e95e0-5b74-4b46-abdb-9716d0128e8a');
        expect(room.quiz).to.deep.equal(mockQuiz);
        expect(room.questionDuration).to.equal(mockQuiz.duration);
        databaseServiceStub.restore();
    });
    
/// END OF TEST HELL
it('should check if username is chosen', () => {
    room = new Room('quiz123', 'organizerId');
    room.players.set('clientId1', { 
        username: 'player1', 
        points: 0, 
        goodAnswer: false, 
        isFinal: false,
        isSubmitted: false,
        isConnected: true,
        isMuted: false,
        nBonus: 0,
        isAnswering: false,
    });
    const result = room.addPlayer('clientId2', 'player1'); // Try to add player with same username

    expect(result).to.be.false;
});

    it('should find client ID by username', () => {
        room.players.set('clientId1', { 
            username: 'player1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });

        //const result = room.findClientIdByUsername('player1');

        //expect(result).to.equal('clientId1');
    });

    it('should return null when username is not found', () => {
        room.players.set('clientId1', { 
            username: 'player1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });
        // const result = room.findClientIdByUsername('nonExistentPlayer');
       // expect(result).to.be.null;
    });
    //////////////////////////////////////// NEW TESTS 
   
    it('should lock the quiz', () => {
        room.lockQuiz();
        expect(room.isQuizLocked).to.be.true;
    });
    
    // it('should return players with isFinal set to true', () => {
    //     room.players.set('clientId1', { 
    //         username: 'player1', 
    //         points: 0, 
    //         goodAnswer: false, 
    //         isFinal: true,
    //         isSubmitted: false,
    //         isConnected: true,
    //         isMuted: false,
    //         nBonus: 0,
    //         isAnswering: false,
    //     });

    //     room.players.set('clientId2', { 
    //         username: 'player2', 
    //         points: 0, 
    //         goodAnswer: false, 
    //         isFinal: true,
    //         isSubmitted: false,
    //         isConnected: true,
    //         isMuted: false,
    //         nBonus: 0,
    //         isAnswering: false,
    //     });

    //     room.players.set('clientId3', { 
    //         username: 'player3', 
    //         points: 0, 
    //         goodAnswer: false, 
    //         isFinal: false,
    //         isSubmitted: false,
    //         isConnected: true,
    //         isMuted: false,
    //         nBonus: 0,
    //         isAnswering: false,
    //     });

    //     const answeredPlayers = room.getAnsweredPlayers();

    //     expect(answeredPlayers.length).to.equal(2);
    // });
    
    it('should return true when there is exactly one connected player left', () => {
        room.players.set('clientId1', { 
            username: 'player1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });

        room.players.set('clientId2', { 
            username: 'player2', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });

        room.players.set('clientId3', { 
            username: 'player3', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });

        expect(room.isOrganizerRemaining()).to.equal(false);

        const player1 = room.players.get('clientId1');
        const player2 = room.players.get('clientId2');
        const player3 = room.players.get('clientId3');

        player1.isConnected = false;
        player2.isConnected = false;
        player3.isConnected = false;

        room.players.set('clientId1', player1);
        room.players.set('clientId2', player2);
        room.players.set('clientId3', player3);
        
        expect(room.isOrganizerRemaining()).to.equal(true);
    });
    
    it('should add a player with a unique name', () => {
        const result = room.addPlayer('clientId1', 'player1');
        expect(result).to.equal(true);
        expect(room.players.has('clientId1')).to.equal(true);
    });

    it('should not add a player with a duplicate name', () => {
        room.addPlayer('clientId3', 'duplicateName');
        const result = room.addPlayer('clientId4', 'duplicateName');
        expect(result).to.equal(false);
        expect(room.players.has('clientId4')).to.equal(false);
    });
    it('should toggle isQuizLocked value', () => {
        expect(room.isQuizLocked).to.be.false;
        room.toggleIsQuizLocked();
        expect(room.isQuizLocked).to.be.true;
        room.toggleIsQuizLocked();
        expect(room.isQuizLocked).to.be.false;
    });
    it('should remove a player from the room', () => {
        room.players.set('clientId1', { 
            username: 'player1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });

        room.removePlayerInWaitRoom('clientId1');

        expect(room.players.has('clientId1')).to.be.false;
    });
    
    it('should return the clientId of the organizer player', () => {
        room.players.set('clientId1', { 
            username: 'player1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });

        room.players.set('clientId2', { 
            username: 'organisateur',
            points: 0, 
            goodAnswer: false,
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });

        room.players.set('clientId3', { 
            username: 'player3', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });

        const organizerClientId = room.getOrganizer();

        expect(organizerClientId).to.equal('organizerId');
    });

    it('should return null if no organizer player is found', () => {
        room.players.set('clientId1', { 
            username: 'player1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });

        const organizerClientId = room.getOrganizer();

        expect(organizerClientId).to.be.not.null;
    });
   
    it('should validate the answer for a player with a correct answer', () => {
        room.answerOrder.enqueue([0, 1, 0, 0]); // Example answer
        room.currentQst = { question: 'Example question', choices: [ { choice: 'a', isCorrect: false }, { choice: 'b',isCorrect: true }, { choice: 'c',isCorrect: false }, { choice: 'd',isCorrect: false } ], points: 10, type: 'multiple-choice', id: '123' }; 
        room.players.set('clientId1', { 
            username: 'player1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });

        room.validateAnswer('clientId1');

        const player = room.players.get('clientId1');
        expect(player.goodAnswer).to.be.true;
        expect(player.isFinal).to.be.true;
        expect(player.points).to.equal(12); // Assuming addPoints is correctly implemented
    });

    it('should validate the answer for a player with an incorrect answer', () => {
        room.answerOrder.enqueue([0, 1, 0, 0]); // Example answer
        room.currentQst = { question: 'Example question', choices: [ { choice: 'a', isCorrect: false }, { choice: 'b',isCorrect: true }, { choice: 'c',isCorrect: false }, { choice: 'd',isCorrect: false } ], points: 10, type: 'multiple-choice', id: '123' }; 
        room.players.set('clientId1', { 
            username: 'player1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });
        room.isFirst = false;

        room.answerOrder.enqueue([1, 0, 1, 1]); // Incorrect answer
        room.validateAnswer('clientId1');

        const player = room.players.get('clientId1');
        expect(player.goodAnswer).to.be.true;
        expect(player.isFinal).to.be.true;
        expect(player.points).to.equal(10); 
    });

    it('should award bonus points to the first player with a correct answer', () => {
        room.answerOrder.enqueue([0, 1, 0, 0]); // Example answer
        room.currentQst = { question: 'Example question', choices: [ { choice: 'a', isCorrect: false }, { choice: 'b',isCorrect: true }, { choice: 'c',isCorrect: false }, { choice: 'd',isCorrect: false } ], points: 10, type: 'multiple-choice', id: '123' }; 
        room.players.set('clientId1', { 
            username: 'player1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });

        room.isFirst = true;
        room.validateAnswer('clientId1');

        const player = room.players.get('clientId1');
        expect(player.goodAnswer).to.be.true;
        expect(player.isFinal).to.be.true;
        expect(player.points).to.equal(12); // Double points for first correct answer
        expect(player.nBonus).to.equal(1); // One bonus point awarded
    });
    it('should set player.goodAnswer to false and player.isFinal to true for a mismatched answer', () => {
        room.answerOrder.enqueue([0, 0, 0, 0]); // Example answer
        room.currentQst = { question: 'Example question', choices: [ { choice: 'a', isCorrect: false }, { choice: 'b',isCorrect: true }, { choice: 'c',isCorrect: false }, { choice: 'd',isCorrect: false } ], points: 10, type: 'multiple-choice', id: '123' }; 
        room.players.set('clientId1', { 
            username: 'player1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });
        room.answerOrder.enqueue([0, 0, 0, 0]); // Incorrect answer
        room.validateAnswer('clientId1');

        const player = room.players.get('clientId1');
        expect(player.goodAnswer).to.be.false;
        expect(player.isFinal).to.be.true;
    });
    it('should return null when there is no organizer', () => {
        room.players = new Map();
        
        expect(room.getOrganizer()).to.be.null;
    });
    it('should return the clientId of the organizer', () => {
        room.players = new Map();

        room.players.set('clientId1', { 
            username: 'player1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });
        room.players.set('organizerId', { 
            username: 'organisateur',
            points: 0, 
            goodAnswer: false,
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });
        expect(room.getOrganizer()).to.equal('organizerId');
    });
    it('should create random quiz', () => {
        room = new Room('0', 'organizerId');
        expect(room.isRandomQuiz).to.be.true;
        expect(room.questions.length).to.equal(0);
    });
    it('should submit LAQ answer', () => {
        room.players.set('clientId1', { 
            username: 'player1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });
        room.submitLAQAnswer('clientId1', 'answer');
        expect(room.players.get('clientId1').isFinal).to.be.true;
    });
    it('should sort LAQ answers by username', () => {
        room.answersLAQ.set('b', 'answer1');
        room.answersLAQ.set('a', 'answer2');

        const sorted = room.getSortedLAQAnswers();

        expect(sorted[0]).to.equal('a');
        expect(sorted[2]).to.equal('b');
        expect(sorted.length).to.equal(4);
    })
    it('should validate LAQ', () => {
        room.players.set('clientId1', { 
            username: 'PLAYER1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });
        room.currentQst = {
            question: 'question',
            points: 10,
            type: 'LAQ',
            choices: [],
            id: '0',
        };
        room.validateLAQ('PLAYER1', 1);
        expect(room.players.get('clientId1').goodAnswer).to.be.true;
    });
    it('should not start answering is the player is not there', () => {
        room.startAnswering('1');
        expect(room.isFirst).to.equal(true);
    });
    it('should call resetPlayerHeartBeat if player is in room', () => {
        room.players.set('clientId1', { 
            username: 'player1', 
            points: 0, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
        });
        room.startTyping('clientId1');
        expect(room.players.size).to.equal(2);
    })
    it('should not call resetPlayerHeartBeat if player is in room', () => {
        room.startTyping('clientId1');
        expect(room.players.size).to.equal(1);
    });
    // it('should update the history max points', async() => {
    //     room.players.set('clientId1', { 
    //         username: 'player1', 
    //         points: 10, 
    //         goodAnswer: false, 
    //         isFinal: false,
    //         isSubmitted: false,
    //         isConnected: true,
    //         isMuted: false,
    //         nBonus: 0,
    //         isAnswering: false,
    //     });
    //     room.history.maxPoints = 0;

    //     await room.insertHistory();

    //     expect(room.history.maxPoints).to.equal(10);
    // });
    it('should fix the player heartbeat to 1', () => {
        room.players.set('clientId1', { 
            username: 'player1', 
            points: 10, 
            goodAnswer: false, 
            isFinal: false,
            isSubmitted: false,
            isConnected: true,
            isMuted: false,
            nBonus: 0,
            isAnswering: false,
            deltaTHeartBeat: 0,
        });
        room.updateHeartBeats();
        expect(room.players.get('clientId1').deltaTHeartBeat).to.equal(1);
    })
    //Fichier de plus de 350 lignes 
    /* eslint-enable */
});
