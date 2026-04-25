export class SyllabusLoader {
    constructor(app) {
        this.app = app;
        this.syllabusData = null;
    }

    async loadSyllabus() {
        if (!this.syllabusData) {
            const res = await fetch('data/syllabus.json');
            this.syllabusData = await res.json();
        }
    }

    async renderSyllabusView() {
        await this.loadSyllabus();
        const container = document.getElementById('syllabus-container');
        if (!container) return;

        let html = '<div class="syllabus-nav">';
        // Sidebar domains
        html += '<ul class="domain-list">';
        this.syllabusData.domains.forEach(domain => {
            html += `<li onclick="window.app.syllabus.showDomain('${domain.id}')">${domain.name} (${domain.weight})</li>`;
        });
        html += '</ul></div>';

        html += '<div id="syllabus-content" class="syllabus-content">Selecciona un dominio para comenzar el estudio profundo.</div>';
        
        container.innerHTML = html;
    }

    showDomain(domainId) {
        const domain = this.syllabusData.domains.find(d => d.id === domainId);
        if(!domain) return;

        const content = document.getElementById('syllabus-content');
        let html = `<h2>${domain.name}</h2>`;

        domain.tasks.forEach(task => {
            html += `<div class="task-card">
                        <h3>Tarea: ${task.taskTitle}</h3>`;
            
            task.topics.forEach(topic => {
                html += `<div class="topic-box">
                            <h4>${topic.title}</h4>
                            <p><strong>Explicación:</strong> ${topic.explanation}</p>
                            
                            <div class="signals-traps">
                                <div class="signals">
                                    <strong>🟢 Pistas de Examen:</strong>
                                    <ul>${(topic.examSignals || []).map(s => `<li>${s}</li>`).join('')}</ul>
                                </div>
                                <div class="traps">
                                    <strong>🔴 Trampas Comunes:</strong>
                                    <ul>${(topic.commonTraps || []).map(s => `<li>${s}</li>`).join('')}</ul>
                                </div>
                            </div>`;

                if (topic.predictiveNotes || topic.agileNotes || topic.hybridNotes) {
                    html += `<div class="approach-notes">
                                <div><strong>Predictivo:</strong> ${(topic.predictiveNotes || []).join(' ')}</div>
                                <div><strong>Ágil:</strong> ${(topic.agileNotes || []).join(' ')}</div>
                                <div><strong>Híbrido:</strong> ${(topic.hybridNotes || []).join(' ')}</div>
                            </div>`;
                }

                html += `</div>`;
            });
            html += `</div>`;
        });

        content.innerHTML = html;
    }
}
