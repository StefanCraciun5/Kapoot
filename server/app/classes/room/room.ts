/* eslint-disable max-lines */
import { HistoryObject } from '@app/classes/database-types/history-objects/history-object';
import { AnswerService } from '@app/services/answer-service/answer-service';
import { DatabaseService } from '@app/services/database-service/database.service';
import { BONUS } from '@common/constant';
import { HistoryObj, QuestionObj, QuizObj } from '@common/message';
import { Player } from '@common/player';
import { Queue } from '@common/queue/queue';

export class Room {
    history: HistoryObj;
    isRandomQuiz: boolean = false;
    isTimerPaused: boolean = false;
    isPanicMode: boolean = false;
    isQuizLocked: boolean = false;
    isFirst: boolean = true;
    answerOrder: Queue<number[]> = new Queue();
    databaseService: DatabaseService;
    quiz: QuizObj;
    questions: QuestionObj[] = [];
    currentQst: QuestionObj;
    previewQst: QuestionObj;
    bannedNames: Set<string> = new Set<string>();
    questionIndex: number = 0;
    players: Map<string, Player> = new Map();
    answers: Map<string, number[]> = new Map();
    answersLAQ: Map<string, string> = new Map();
    currentTimer: number = null;
    questionDuration: number = 0;
    organizerId: string;
    intervalId: NodeJS.Timeout | null = null;
    playerAnswers: number[] = [];

    laqScores: number[] = [0, 0, 0];

    timer: number;

    private answerService: AnswerService = new AnswerService();
    private offset: number;

    constructor(quizId: string, organizerId: string) {
        this.databaseService = new DatabaseService();
        if (quizId !== '0') {
            this.databaseService.connectToDatabase().then(() => {
                this.loadQuiz(quizId).then(() => {
                    this.loadQuestions();
                });
            });
        } else {
            this.isRandomQuiz = true;
            this.createRandomQuiz();
            this.databaseService.connectToDatabase().then(() => {
                this.loadRandomQuestions().then(() => {
                    this.loadQuestions();
                });
            });
        }
        const organizer: Player = {
            username: 'organisateur',
            points: -1,
            goodAnswer: false,
            isFinal: false,
            isConnected: true,
            nBonus: -1,
            isAnswering: false,
            isSubmitted: false,
            isMuted: false,
        };
        this.organizerId = organizerId;
        this.players.set(organizerId, organizer);
        const history: HistoryObj = {
            title: 'Default Title',
            date: new Date(), // Defaults to the current date and time
            players: 0, // Default number of players
            maxPoints: 0, // Default maximum points
        };
        this.history = history;
    }
    isOrganizerRemaining(): boolean {
        let nConnected = 0;
        for (const player of this.players.values()) {
            if (player.isConnected) {
                nConnected++;
            }
        }
        return nConnected === 1;
    }
    isRoomEmpty(): boolean {
        return this.players.size === 1;
    }
    startQuiz() {
        this.currentTimer = this.questionDuration;
        this.currentQst = this.questions[this.questionIndex];
        this.previewQst = this.questions[this.questionIndex + 1];
        if (this.currentQst.type === 'MCQ') {
            this.playerAnswers = Array(this.currentQst.choices.length).fill(0);
        }
    }
    getOrganizer(): string | null {
        for (const [clientId, player] of this.players) {
            if (player.username === 'organisateur') {
                return clientId;
            }
        }
        return null;
    }
    setOrganizerFinal(): void {
        const orgPlayer = this.players.get(this.getOrganizer());
        orgPlayer.isFinal = !orgPlayer.isFinal;
        this.players.set(this.getOrganizer(), orgPlayer);
    }
    launchQst() {
        this.isPanicMode = false;
        this.isTimerPaused = false;
        this.currentTimer = this.questionDuration;
        this.nextQuestion();
    }
    handleEndQuestion() {
        if (this.currentQst.type === 'MCQ') {
            this.answers.set(this.currentQst.question, [...this.playerAnswers]);
            this.playerAnswers = Array(this.currentQst.choices.length).fill(0);
            this.isFirst = true;
        } else {
            this.answers.set(this.currentQst.question, [...this.laqScores]);
            this.laqScores = [0, 0, 0];
            this.answers.set(this.currentQst.question, [...this.laqScores]);
            this.laqScores = [0, 0, 0];
        }
        this.setOrganizerFinal();
        for (const [id, player] of this.players.entries()) {
            player.isFinal = false;
            player.isSubmitted = false;
            player.isAnswering = false;
            this.players.set(id, player);
        }
        clearInterval(this.intervalId);
    }
    getUsernameList(): string[] {
        const usernames: string[] = [];
        this.players.forEach((player) => {
            usernames.push(player.username);
        });
        return usernames;
    }
    getUsernameById(socketId: string): string {
        const player = this.players.get(socketId);
        return player.username;
    }
    getPlayers(): Map<string, Player> {
        return this.players;
    }
    getPlayersList(): Player[] {
        const playerList: Player[] = [...this.players.values()];
        return playerList;
    }
    getPlayerAnswers(): number[] {
        return this.playerAnswers;
    }
    toggleIsQuizLocked(): void {
        this.isQuizLocked = !this.isQuizLocked;
    }
    addPlayer(clientId: string, playerName: string): boolean {
        if (!this.isNameBanned(playerName) && !this.isUsernameChosen(playerName)) {
            const player: Player = {
                username: playerName,
                points: 0,
                goodAnswer: false,
                isFinal: false,
                isSubmitted: false,
                isConnected: true,
                isMuted: false,
                nBonus: 0,
                isAnswering: false,
            };
            this.players.set(clientId, player);
            return true;
        }
        return false;
    }
    removePlayer(clientId: string): void {
        const player = this.players.get(clientId);
        player.isConnected = false;
        this.players.set(clientId, player);
    }
    removePlayerInWaitRoom(clientId: string): void {
        this.players.delete(clientId);
    }
    banName(name: string): string {
        let socketIdBan;
        for (const [socketId, player] of this.players.entries()) {
            if (player.username === name) {
                this.bannedNames.add(name.toLowerCase());
                socketIdBan = socketId;
            }
        }
        this.players.delete(socketIdBan);
        return socketIdBan;
    }
    isOrganizer(clientId: string): boolean {
        return this.organizerId === clientId;
    }
    validateAnswer(clientId: string): void {
        const answers = this.answerOrder.dequeue();
        const goodAnswer: number[] = this.answerService.getCorrectMCQAnswers(this.currentQst.choices);
        const player = this.players.get(clientId);
        player.isFinal = true;
        player.goodAnswer = this.answerService.validateMCQAnswer(goodAnswer, answers);
        if (!player.goodAnswer) {
            this.players.set(clientId, player);
            return;
        }
        let newPlayer = this.answerService.addPoints(player, this.currentQst.points);
        if (this.isFirst) {
            this.isFirst = false;
            newPlayer = this.answerService.addPoints(newPlayer, this.currentQst.points * BONUS);
            newPlayer.nBonus++;
        }
        newPlayer.goodAnswer = true;
        newPlayer.isFinal = true;
        this.players.set(clientId, newPlayer);
    }
    submitLAQAnswer(socketId: string, answer: string): void {
        const player = this.players.get(socketId);
        player.isFinal = true;
        this.players.set(socketId, player);
        this.answersLAQ.set(player.username, answer);
    }
    getSortedLAQAnswers(): string[] {
        return this.answerService.getSortedLAQAnswers(this.answersLAQ);
    }
    validateLAQ(username: string, percentage: number): void {
        this.laqScores = [...this.answerService.setLAQScores(percentage, this.laqScores)];
        let evaluatedPlayer;
        let socketId;
        for (const [id, player] of this.players.entries()) {
            if (player.username === username) {
                socketId = id;
                evaluatedPlayer = player;
            }
        }
        evaluatedPlayer.currentLAQPoints = percentage;
        evaluatedPlayer.points += Math.round(this.currentQst.points * percentage);
        if (percentage !== 0) {
            evaluatedPlayer.goodAnswer = true;
        }
        evaluatedPlayer.isFinal = false;
        this.players.set(socketId, evaluatedPlayer);
    }

    resetAllPlayersLAQPoints(): void {
        for (const playerID of this.players.keys()) {
            const player = { ...this.players.get(playerID), currentLAQPoints: 0 };
            this.players.set(playerID, player);
        }
    }

    getPlayerLAQCurrentPoints(socketID: string): number {
        const player = this.players.get(socketID);
        return player.currentLAQPoints ?? 0;
    }

    modifyLiveChoices(answers: number[]): void {
        if (!this.playerAnswers[0] && this.playerAnswers[0] !== 0) {
            this.playerAnswers = Array(this.currentQst.choices.length).fill(0);
        }
        for (let i = 0; i < answers.length; i++) {
            this.playerAnswers[i] += answers[i];
        }
    }
    startAnswering(socketID: string) {
        if (!this.players.has(socketID)) {
            return;
        }
        const player = this.players.get(socketID);
        const answeringPlayer: Player = { ...player, isAnswering: true };
        this.players.set(socketID, answeringPlayer);
    }
    startTyping(socketID: string) {
        if (!this.players.has(socketID)) {
            return;
        }
        this.resetPlayerHeartBeat(socketID);
        const player = { ...this.players.get(socketID) };
        player.hasTyped = true;
        this.players.set(socketID, player);
    }
    stopAnsweringAll() {
        this.clearAnswering();
        for (const socket of this.players.keys()) {
            const player = this.players.get(socket);
            const answeringPlayer: Player = { ...player, isDone: true };
            this.players.set(socket, answeringPlayer);
        }
    }
    clearAnswering() {
        for (const socket of this.players.keys()) {
            const player = this.players.get(socket);
            const answeringPlayer: Player = { ...player, isAnswering: false };
            this.players.set(socket, answeringPlayer);
        }
    }
    nextQuestion(): QuestionObj {
        this.questionIndex++;
        this.questionIndex += this.offset ? this.offset : 0;
        this.currentQst = this.questions[this.questionIndex];
        this.previewQst = this.questions[this.questionIndex + 1];
        this.offset = 0;
        return this.currentQst;
    }
    skipQuestion(offset: number): void {
        this.offset = offset > 1 ? 1 : offset;
        this.offset = offset < 0 ? 0 : offset;
        this.previewQst = this.questions[this.questionIndex + 1 + this.offset];
    }
    lockQuiz(): void {
        this.isQuizLocked = true;
    }
    clearAfterInterval() {
        for (const id of this.players.keys()) {
            const player = { ...this.players.get(id), hasTyped: false };
            this.players.set(id, player);
        }
    }
    async loadQuestions(): Promise<void> {
        const questionIDs = this.quiz.questions;
        questionIDs.forEach(async (questionId) => {
            await this.databaseService.getObjectByID('questions', questionId).then((question) => {
                this.questions.push(JSON.parse(question));
            });
        });
        this.currentQst = this.questions[0];
        this.previewQst = this.questions[1];
        this.history.date = new Date();
        this.history.title = this.quiz.title;
        this.history.players = this.players.size;
        this.history.maxPoints = 1;
    }
    async loadQuiz(quizId: string): Promise<void> {
        await this.databaseService.getObjectByID('quizzes', quizId).then((quiz) => {
            this.quiz = JSON.parse(quiz);
            this.questionDuration = this.quiz.duration;
        });
    }
    async insertHistory(): Promise<void> {
        for (const player of this.players.values()) {
            if (player.points > this.history.maxPoints) {
                this.history.maxPoints = player.points;
            }
        }
        const historyObj: HistoryObj = {
            date: this.history.date,
            title: this.history.title,
            maxPoints: this.history.maxPoints,
            players: this.history.players,
        };
        const hisObj = new HistoryObject(historyObj);
        await this.databaseService.insertOneObject('history', hisObj);
    }

    resetAllPlayerHeartBeat() {
        for (const player of this.players.values()) {
            player.deltaTHeartBeat = 0;
        }
    }

    resetPlayerHeartBeat(playerID: string) {
        const player = this.players.get(playerID);
        player.deltaTHeartBeat = 0;
    }

    initializeAllPlayersHeatBeat(initialValue: number) {
        for (const player of this.players.values()) {
            player.deltaTHeartBeat = initialValue;
        }
    }

    updateHeartBeats(): void {
        for (const player of this.players.values()) {
            if (player.deltaTHeartBeat) {
                player.deltaTHeartBeat++;
            } else {
                player.deltaTHeartBeat = 1;
            }
        }
    }

    getTotalPlayersAlive(frequency: number): number {
        let totalPlayersAlive = 0;
        for (const player of this.players.values()) {
            if (Number(player.deltaTHeartBeat) >= 0 && player.deltaTHeartBeat < frequency) {
                totalPlayersAlive++;
            }
        }
        return totalPlayersAlive;
    }

    private isNameBanned(name: string): boolean {
        return this.bannedNames.has(name.toLowerCase());
    }
    private isUsernameChosen(name: string): boolean {
        return Array.from(this.players.values()).some((player) => player.username === name);
    }
    private createRandomQuiz() {
        const quiz: QuizObj = {
            title: 'Random quiz',
            description: 'This is a Random Quiz',
            questions: [],
            id: '0',
            visible: true,
            duration: 20,
            lastModification: new Date(),
        };
        this.quiz = quiz;
        this.questionDuration = this.quiz.duration;
    }
    private async loadRandomQuestions() {
        const filter = {};
        const nQuestion = 5;
        await this.databaseService.getCollection('question-bank', filter).then((questions) => {
            this.questions = questions.map((question) => JSON.parse(JSON.stringify(question)));
            this.questions = this.shuffle(this.questions);
            this.questions = this.questions.slice(0, nQuestion);
            this.quiz.questions = this.questions.map((question) => question.question);
            this.questions = [];
        });
    }
    private shuffle(array: QuestionObj[]): QuestionObj[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
