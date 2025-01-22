import { FIFTY_PERCENT, HUNDRED_PERCENT, ZERO_PERCENT } from '@common/constant';
import { ChoicesObj } from '@common/message';
import { Player } from '@common/player';

export class AnswerService {
    getCorrectMCQAnswers(choices: ChoicesObj[]): number[] {
        const goodAnswer: number[] = [];
        choices.forEach((choice) => {
            if (choice.isCorrect) {
                goodAnswer.push(1);
            } else {
                goodAnswer.push(0);
            }
        });
        return goodAnswer;
    }
    validateMCQAnswer(correctAnswer: number[], playerAnswer: number[]): boolean {
        for (let i = 0; i < correctAnswer.length; i++) {
            if (correctAnswer[i] !== playerAnswer[i]) {
                return false;
            }
        }
        return true;
    }
    setLAQScores(percentage: number, laqScores: number[]): number[] {
        switch (percentage) {
            case ZERO_PERCENT: {
                laqScores[0]++;
                break;
            }
            case FIFTY_PERCENT: {
                laqScores[1]++;
                break;
            }
            case HUNDRED_PERCENT: {
                laqScores[2]++;
                break;
            }
        }
        return laqScores;
    }
    getSortedLAQAnswers(laqAnswers: Map<string, string>): string[] {
        const sortedUsernames = Array.from(laqAnswers.keys()).sort();
        const sortedLAQAnswers: string[] = [];
        sortedUsernames.forEach((username) => {
            const answer = laqAnswers.get(username);
            sortedLAQAnswers.push(username);
            sortedLAQAnswers.push(answer);
        });
        return sortedLAQAnswers;
    }
    addPoints(player: Player, points: number) {
        player.points += Math.round(points);
        return player;
    }
}
