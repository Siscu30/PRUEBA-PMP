export class Analytics {
    constructor(app) {
        this.app = app;
    }

    renderResults(examId) {
        const container = document.getElementById('results-container');
        if (!container) return;

        const state = this.app.storage.getState(`exam_${examId}`);
        if (!state) {
            container.innerHTML = '<p>No hay datos de examen finalizado para mostrar.</p>';
            return;
        }

        // Calculation logic (simplified for Phase 6 proof)
        let correct = 0;
        const total = state.questions.length;
        
        state.questions.forEach(q => {
            if (state.answers[q.id] === q.correctAnswer) correct++;
        });

        const score = Math.round((correct / total) * 100);
        let passFail = score >= 65 ? '<span class="text-success">APROBADO (Target)</span>' : '<span class="text-danger">SUSPENSO (Needs Improvement)</span>';

        let html = `
            <div class="results-dashboard">
                <div class="score-card">
                    <h2>Puntuación Global</h2>
                    <div class="score-huge">${score}%</div>
                    <h3>${passFail}</h3>
                    <p>${correct} correctas de ${total}</p>
                </div>
            </div>
            
            <div class="review-section">
                <h3>Revisión de Preguntas</h3>
                <div class="review-list">
        `;

        state.questions.forEach((q, i) => {
            const userAns = state.answers[q.id] || 'No respondida';
            const isCorrect = userAns === q.correctAnswer;
            
            html += `
                <div class="review-item ${isCorrect ? 'correct' : 'incorrect'}">
                    <h4>${i + 1}. ${q.question}</h4>
                    <p><strong>Tu respuesta:</strong> ${userAns} - <strong>Correcta:</strong> ${q.correctAnswer}</p>
                    <div class="explanation">
                        <strong>Explicación:</strong> ${q.explanation}
                    </div>
                </div>
            `;
        });

        html += '</div></div>';
        container.innerHTML = html;
        
        // Clear state so it doesn't resume
        this.app.storage.clearState(`exam_${examId}`);
    }
}
