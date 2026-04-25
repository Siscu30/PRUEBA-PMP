export class ExamEngine {
    constructor(app) {
        this.app = app;
        this.state = {
            examId: null,
            manifest: null,
            questions: [],
            currentBlockIndex: 0,
            currentQuestionIndex: 0, // absolute index 0-179
            answers: {},
            marked: {},
            timeRemainingSeconds: 230 * 60,
            timerInterval: null
        };
    }

    async startExam(examId) {
        this.state.examId = examId;
        
        // Restore from storage or load fresh
        const savedState = this.app.storage.getState(`exam_${examId}`);
        if (savedState) {
            // Restore logic here (simplified for phase 2)
        } else {
            await this.loadManifest(examId);
            this.state.timeRemainingSeconds = this.state.manifest.timeLimitMinutes * 60;
        }

        this.startGlobalTimer();
        this.renderQuestion();
    }

    async loadManifest(examId) {
        // Load manifest
        const manifestRes = await fetch(`data/mock-exams/${examId}.json`);
        this.state.manifest = await manifestRes.json();
        
        // Load all required question lots (dummy implementation for now loads 1 lot)
        const dummyLotRes = await fetch(`data/question-bank/lot-dummy.json`);
        const dummyLot = await dummyLotRes.json();
        
        // Assign questions (in real life, map from questionIds in manifest)
        this.state.questions = dummyLot.questions; // for testing, we just use the lot
    }

    startGlobalTimer() {
        clearInterval(this.state.timerInterval);
        this.state.timerInterval = setInterval(() => {
            this.state.timeRemainingSeconds--;
            this.updateTimerUI();
            
            // Save state every minute
            if (this.state.timeRemainingSeconds % 60 === 0) {
                this.app.storage.saveState(`exam_${this.state.examId}`, this.state);
            }

            if (this.state.timeRemainingSeconds <= 0) {
                this.finishExam();
            }
        }, 1000);
    }

    updateTimerUI() {
        const timerEl = document.getElementById('global-timer');
        if (!timerEl) return;
        const m = Math.floor(this.state.timeRemainingSeconds / 60);
        const s = this.state.timeRemainingSeconds % 60;
        timerEl.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    renderQuestion() {
        const q = this.state.questions[this.state.currentQuestionIndex];
        const container = document.getElementById('question-container');
        if(!container) return; // Not on exam route

        const domainClass = q.domain ? `meta-domain-${q.domain.toLowerCase()}` : '';

        let html = `
            <div class="question-meta">
                <span class="meta-badge ${domainClass}">${q.domain || 'Dominio'}</span>
                <span class="meta-badge" style="background:var(--g2); color:var(--ink2)">${q.approach || 'Enfoque'}</span>
            </div>
            <div class="question-text">${this.state.currentQuestionIndex + 1}. ${q.question}</div>
        `;
        html += `<div class="options">`;
        
        q.options.forEach(opt => {
            const isSelected = this.state.answers[q.id] === opt.id ? 'selected' : '';
            html += `<div class="option ${isSelected}" data-id="${opt.id}">
                        ${opt.id}. ${opt.text}
                     </div>`;
        });
        html += `</div>`;
        container.innerHTML = html;

        // Bind options
        document.querySelectorAll('.option').forEach(el => {
            el.addEventListener('click', (e) => {
                this.state.answers[q.id] = e.currentTarget.dataset.id;
                this.app.storage.saveState(`exam_${this.state.examId}`, this.state);
                this.renderQuestion(); // Re-render to show selection
            });
        });

        // Update Header Info
        document.getElementById('exam-progress').innerText = `Pregunta ${this.state.currentQuestionIndex + 1} de ${this.state.questions.length}`;
        
        // Controls logic
        this.bindControls();
    }

    bindControls() {
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');
        const btnFinishBlock = document.getElementById('btn-finish-block');

        // Reset listeners
        const newPrev = btnPrev.cloneNode(true);
        const newNext = btnNext.cloneNode(true);
        const newFinish = btnFinishBlock.cloneNode(true);
        btnPrev.parentNode.replaceChild(newPrev, btnPrev);
        btnNext.parentNode.replaceChild(newNext, btnNext);
        btnFinishBlock.parentNode.replaceChild(newFinish, btnFinishBlock);

        // Previous
        if (this.state.currentQuestionIndex > 0) {
            newPrev.disabled = false;
            newPrev.addEventListener('click', () => {
                this.state.currentQuestionIndex--;
                this.renderQuestion();
            });
        } else {
            newPrev.disabled = true;
        }

        // Next / Finish Block
        const currentBlock = this.state.manifest.blocks[this.state.currentBlockIndex];
        // Calculate relative index within block
        let questionsInPreviousBlocks = 0;
        for(let i=0; i<this.state.currentBlockIndex; i++) {
            questionsInPreviousBlocks += this.state.manifest.blocks[i].questionIds.length;
        }
        
        const relativeIndex = this.state.currentQuestionIndex - questionsInPreviousBlocks;
        const isLastInBlock = relativeIndex === currentBlock.questionIds.length - 1;

        if (isLastInBlock) {
            newNext.classList.add('hidden');
            newFinish.classList.remove('hidden');
            newFinish.addEventListener('click', () => this.handleBlockFinish());
        } else {
            newNext.classList.remove('hidden');
            newFinish.classList.add('hidden');
            newNext.addEventListener('click', () => {
                this.state.currentQuestionIndex++;
                this.renderQuestion();
            });
        }
    }

    handleBlockFinish() {
        // If last block, finish exam
        if (this.state.currentBlockIndex === this.state.manifest.blocks.length - 1) {
            this.finishExam();
        } else {
            this.showBreakScreen();
        }
    }

    showBreakScreen() {
        this.app.navigate('break');
        // Pause global timer
        clearInterval(this.state.timerInterval);
        
        let breakSeconds = 10 * 60;
        const breakInterval = setInterval(() => {
            breakSeconds--;
            const timerEl = document.getElementById('break-timer');
            if(timerEl) {
                const m = Math.floor(breakSeconds / 60);
                const s = breakSeconds % 60;
                timerEl.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
            if (breakSeconds <= 0) {
                clearInterval(breakInterval);
                this.resumeExamAfterBreak();
            }
        }, 1000);

        const btnResume = document.getElementById('btn-resume');
        if(btnResume) {
            btnResume.addEventListener('click', () => {
                clearInterval(breakInterval);
                this.resumeExamAfterBreak();
            });
        }
    }

    resumeExamAfterBreak() {
        this.state.currentBlockIndex++;
        this.state.currentQuestionIndex++; // Move to next question (first of next block)
        this.app.navigate('exam-runner', { examId: this.state.examId });
        this.startGlobalTimer();
        this.renderQuestion();
    }

    finishExam() {
        clearInterval(this.state.timerInterval);
        alert('Examen Finalizado. Lógica de resultados en FASE 6.');
        this.app.navigate('results');
    }
}
