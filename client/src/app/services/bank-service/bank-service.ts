import { CommunicationService } from '@app/services/communication-service/communication.service';
import { Message } from '@common/message';

const QUESTION_BANK_PATH = 'admin/question-bank';
const CLIENT_BANK_PATH = 'client/question-bank';

export class BankService {
    static async getBankQuestions(communicationService: CommunicationService) {
        return new Promise<string>((resolve) => {
            communicationService.basicGet(CLIENT_BANK_PATH).subscribe({
                next: (res) => {
                    resolve(res.body);
                },
            });
        });
    }
    static async addToQuestionBank(questionID: string, communicationService: CommunicationService) {
        const message: Message = {
            title: '',
            body: JSON.parse(JSON.stringify({ question: questionID })),
        };
        return new Promise<void>((resolve) => {
            communicationService.adminPost(message, QUESTION_BANK_PATH).subscribe({
                next: () => {
                    resolve();
                },
            });
        });
    }
}
