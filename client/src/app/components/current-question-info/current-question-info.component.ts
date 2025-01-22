import { Component, DoCheck, Input, OnInit } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { ChoicesObj, QuestionObj } from '@common/message';
import { Plugin } from 'chart.js';
import { Chart } from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

const LAQ_ANSWER_DISTRIBUTION_LABELS = ['répondu', 'pas répondu'];
const LAQ_ANSWER_DISTRIBUTION_COLORS = ['rgba(54, 162, 54, 1)', 'rgba(255, 99, 132, 1)'];

const BACKGROUND_PLUGIN: Plugin = {
    id: 'customCanvasBackgroundColor',
    beforeDraw: (chart: Chart, args: { cancelable: true }, options: { color?: string }) => {
        const { ctx } = chart;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = options.color || 'black';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
    }
};

@Component({
    selector: 'app-current-question-info',
    templateUrl: './current-question-info.component.html',
    styleUrls: ['./current-question-info.component.scss'],

})
export class CurrentQuestionInfoComponent implements OnInit, DoCheck {
    @Input() playerAnswers: number[];
    @Input() choices: ChoicesObj[];
    @Input() questionName: string;

    answersArray: [string, number[]][] = [];
    currentAnswer: [string, number[]];
    histogramIndex: number = 1;
    chart: any = [];
    private lastChoices: ChoicesObj[];
    private lastQuestionName: string;
    private isInitialized: boolean;
    private currentQuestion: QuestionObj;

    constructor(private readonly socketService: SocketClientService) {
        this.lastChoices = [];
        this.lastQuestionName = '';
        this.isInitialized = false;
    }

    ngDoCheck(): void {
        if (!this.choices) {
            return;
        }
        if (this.questionName !== this.lastQuestionName || JSON.stringify(this.choices) !== JSON.stringify(this.lastChoices)) {
            const labels = this.choices.map((choice) => {
                return choice.choice;
            });
            const colors: string[] = this.choices.map((choice) => {
                return choice.isCorrect ? 'rgba(54, 162, 54, 1)' /* green */ : 'rgba(255, 99, 132, 1)' /* red */;
            });
            this.setMCQSchema(this.playerAnswers, labels, colors);
            this.lastChoices = this.choices;
            this.lastQuestionName = this.questionName;
        }
    }

    configureBaseSocketFeatures(): void {
        this.socketService.on('liveChoices', (playerAnswers: string) => {
            if (this.currentQuestion.type !== 'MCQ') {
                return;
            }
            this.playerAnswers = JSON.parse(playerAnswers).answers;
            const labels = this.lastChoices.map((choice) => { return choice.choice });
            const colors: string[] = this.lastChoices.map((choice) => {
                return choice.isCorrect ? 'rgba(54, 162, 54, 1)' /* green */ : 'rgba(255, 99, 132, 1)' /* red */;
            });
            this.setMCQSchema(this.playerAnswers, labels, colors);
        });
        this.socketService.on('LAQOptions', (options: string) => {
            if (this.currentQuestion.type !== 'LAQ') {
                return;
            }
            const response = JSON.parse(options);
            const numOfPlayers = response.numOfPlayers;
            this.setLAQSchema(Number(response.modifications), numOfPlayers);
        });
        this.socketService.on('newCurrentQst', (question: QuestionObj) => {
            this.currentQuestion = question;
            if (question.type === 'MCQ') {
                this.lastChoices = question.choices;
                const labels = this.lastChoices.map((choice) => { return choice.choice });
                const colors: string[] = this.lastChoices.map((choice) => {
                    return choice.isCorrect ? 'rgba(54, 162, 54, 1)' /* green */ : 'rgba(255, 99, 132, 1)' /* red */;
                });
                this.setMCQSchema(this.playerAnswers, labels, colors);
            } else {
                this.isInitialized = false;
                this.setLAQSchema(0, 0);
            }
        });
    }

    ngOnInit() {
        this.chart = new Chart('canvas', {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Options Séléctionnées',
                        data: this.playerAnswers,
                        borderColor: [],
                        borderWidth: 3,
                    },
                ]
            },
            options: {
                interaction: {
                    mode: 'index',
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        display: false,
                    },
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 1)',
                            maxRotation: 0,
                            minRotation: 0,
                        }
                    },
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    datalabels: {
                        color: 'rgba(255, 255, 255, 1)',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false,
                    },
                    title: {
                        display: true,
                        text: 'Options Séléctionnées',
                        font: {
                            size: 18,
                        },
                        color: 'rgba(255, 255, 255, 1)'
                    },
                },
            },
            plugins: [ChartDataLabels, BACKGROUND_PLUGIN],
        });
        this.configureBaseSocketFeatures();
    }

    private setMCQSchema(data: number[], labels: string[], colors: string[]) {
        this.chart.data.labels = labels;
        if (!this.choices) {
            this.chart.data.datasets = [
                {
                    label: 'Options Séléctionnées',
                    data: data,
                    borderColor: colors,
                    borderWidth: 3,
                },
            ];
            this.chart.options.plugins.title.text = 'Options Séléctionnées';
        } else {
            this.chart.data.datasets[0].data = data;
            this.chart.data.datasets[0].borderColor = colors;
        }
        this.chart.update();
    }

    private setLAQSchema(data: number, numOfPlayers: number) {
        const inverseData = numOfPlayers - data;
        this.chart.data.labels = LAQ_ANSWER_DISTRIBUTION_LABELS;
        this.chart.data.datasets[0].borderColor = LAQ_ANSWER_DISTRIBUTION_COLORS;
        if (!this.isInitialized) {
            this.isInitialized = true;
            this.chart.data.datasets = [
                {
                    label: 'réponses',
                    data: [data, inverseData],
                    borderColor: LAQ_ANSWER_DISTRIBUTION_COLORS,
                    borderWidth: 3,
                },
            ];
            this.chart.options.plugins.title.text = 'Activité durant les 5 dernières secondes';
        } else {
            this.chart.data.datasets[0].data = [data, inverseData];
        }

        this.chart.update();
    }
}
