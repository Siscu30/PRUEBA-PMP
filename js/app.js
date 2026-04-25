import { ExamEngine } from './exam-engine.js';
import { StorageAPI } from './storage.js';
import { SyllabusLoader } from './syllabus-loader.js';
import { Analytics } from './analytics.js';

class App {
    constructor() {
        this.container = document.getElementById('app-container');
        this.routes = ['home', 'syllabus', 'study', 'exams', 'results', 'exam-runner', 'break'];
        this.examEngine = new ExamEngine(this);
        this.storage = new StorageAPI();
        this.syllabus = new SyllabusLoader(this);
        this.analytics = new Analytics(this);
        
        this.init();
    }

    init() {
        // Setup navigation listeners
        document.querySelectorAll('[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(e.target.dataset.route);
            });
        });

        // Load config
        fetch('data/config.json')
            .then(res => res.json())
            .then(data => {
                this.config = data;
                this.navigate('home');
            });
    }

    navigate(route, params = {}) {
        if (!this.routes.includes(route)) route = 'home';
        
        // Update active nav
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        const activeLink = document.querySelector(`[data-route="${route}"]`);
        if(activeLink) activeLink.classList.add('active');

        // Render template
        const template = document.getElementById(`tpl-${route}`);
        if (template) {
            this.container.innerHTML = '';
            this.container.appendChild(template.content.cloneNode(true));
        }

        // Handle specific route logic
        if (route === 'exams') this.renderExamList();
        if (route === 'syllabus') this.syllabus.renderSyllabusView();
        if (route === 'results') this.analytics.renderResults(params.examId || 'mock-dummy');
        if (route === 'exam-runner') this.examEngine.startExam(params.examId);
    }

    async renderExamList() {
        const list = document.getElementById('exam-list');
        if(!list) return;

        // Dummy data for phase 2
        const mocks = [
            { id: 'mock-dummy', title: 'Simulacro Diagnóstico (Prueba)' }
        ];

        mocks.forEach(mock => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<h3>${mock.title}</h3><p>3 bloques x 60 preg. | 230 min.</p>`;
            card.onclick = () => this.navigate('exam-runner', { examId: mock.id });
            list.appendChild(card);
        });
    }
}

window.app = new App();
