// Analytics Manager - Performance tracking and charts
import db from './db.js';
import SRSAlgorithm from './srs-algorithm.js';
import { getThemePreference, setThemePreference, toggleTheme, formatDate, formatTime, getUrlParameter } from './utils.js';

class AnalyticsManager {
    constructor() {
        this.setId = null;
        this.set = null;
        this.cards = [];
        this.sessions = [];
        this.charts = {};
    }

    async init() {
        await db.init();
        setThemePreference(getThemePreference());

        this.setId = parseInt(getUrlParameter('setId'));
        if (!this.setId) {
            window.location.href = 'index.html';
            return;
        }

        await this.loadData();
        this.setupEventListeners();
        this.renderOverview();
        this.renderCharts();
        this.renderSessions();
        this.renderCardPerformance();
        this.renderHeatmap();
        this.renderCardMasteryHeatmap();
    }

    async loadData() {
        this.set = await db.getSet(this.setId);
        if (!this.set) {
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('setTitle').textContent = `${this.set.name} - Analytics`;

        this.cards = await db.getCardsBySetId(this.setId);
        this.sessions = await db.getSessionsBySetId(this.setId);

        // Load all card performances
        this.cardPerformances = {};
        for (const card of this.cards) {
            this.cardPerformances[card.id] = await db.getPerformanceByCardId(card.id);
        }
    }

    setupEventListeners() {
        document.getElementById('themeToggle').addEventListener('click', () => {
            toggleTheme();
            this.updateChartsTheme();
        });

        document.getElementById('timeRangeSelect').addEventListener('change', () => {
            this.renderCharts();
        });

        document.getElementById('performanceFilter').addEventListener('change', () => {
            this.renderCardPerformance();
        });

        document.getElementById('sortBy').addEventListener('change', () => {
            this.renderCardPerformance();
        });

        // Card detail modal
        document.getElementById('closeCardDetail').addEventListener('click', () => {
            this.hideCardDetailModal();
        });
    }

    async renderOverview() {
        const stats = await db.getSetStatistics(this.setId);

        document.getElementById('totalCards').textContent = stats.totalCards;
        document.getElementById('totalSessions').textContent = stats.totalSessions;
        document.getElementById('totalTime').textContent = formatTime(stats.totalTime);
        document.getElementById('overallAccuracy').textContent = `${Math.round(stats.accuracy)}%`;
        document.getElementById('masteryLevel').textContent = `${Math.round(stats.masteryLevel)}%`;

        const avgScore = stats.accuracy;
        document.getElementById('avgScore').textContent = `${Math.round(avgScore)}%`;
    }

    renderCharts() {
        const timeRange = parseInt(document.getElementById('timeRangeSelect').value);
        const filteredSessions = this.filterSessionsByTimeRange(this.sessions, timeRange);

        this.renderPerformanceChart(filteredSessions);
        this.renderAccuracyByModeChart();
    }

    filterSessionsByTimeRange(sessions, days) {
        if (days === 'all') return sessions;

        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        return sessions.filter(s => s.startTime >= cutoff);
    }

    renderPerformanceChart(sessions) {
        const ctx = document.getElementById('performanceChart').getContext('2d');

        // Group sessions by date
        const dataByDate = {};
        sessions.forEach(session => {
            if (!session.endTime) return;

            const date = new Date(session.startTime).toLocaleDateString();
            if (!dataByDate[date]) {
                dataByDate[date] = {
                    correct: 0,
                    incorrect: 0,
                    total: 0
                };
            }

            dataByDate[date].correct += session.correctCount || 0;
            dataByDate[date].incorrect += session.incorrectCount || 0;
            dataByDate[date].total += (session.correctCount || 0) + (session.incorrectCount || 0);
        });

        // Prepare data
        const dates = Object.keys(dataByDate).sort((a, b) => new Date(a) - new Date(b));
        const accuracyData = dates.map(date => {
            const day = dataByDate[date];
            return day.total > 0 ? (day.correct / day.total) * 100 : 0;
        });

        // Destroy existing chart
        if (this.charts.performance) {
            this.charts.performance.destroy();
        }

        // Create chart
        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Accuracy (%)',
                    data: accuracyData,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: value => value + '%'
                        }
                    }
                }
            }
        });
    }

    renderAccuracyByModeChart() {
        const ctx = document.getElementById('accuracyByModeChart').getContext('2d');

        // Calculate accuracy by mode
        const modes = ['flashcards', 'learn', 'test', 'match'];
        const accuracyByMode = {};

        modes.forEach(mode => {
            const modeSessions = this.sessions.filter(s => s.mode === mode && s.endTime);
            const totalCorrect = modeSessions.reduce((sum, s) => sum + (s.correctCount || 0), 0);
            const totalIncorrect = modeSessions.reduce((sum, s) => sum + (s.incorrectCount || 0), 0);
            const total = totalCorrect + totalIncorrect;

            accuracyByMode[mode] = total > 0 ? (totalCorrect / total) * 100 : 0;
        });

        // Destroy existing chart
        if (this.charts.accuracyByMode) {
            this.charts.accuracyByMode.destroy();
        }

        // Create chart
        this.charts.accuracyByMode = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Flashcards', 'Learn', 'Test', 'Match'],
                datasets: [{
                    label: 'Accuracy (%)',
                    data: modes.map(mode => accuracyByMode[mode]),
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: value => value + '%'
                        }
                    }
                }
            }
        });
    }

    renderSessions() {
        const container = document.getElementById('sessionsContainer');
        container.innerHTML = '';

        // Show last 10 sessions
        const recentSessions = this.sessions
            .filter(s => s.endTime)
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, 10);

        if (recentSessions.length === 0) {
            container.innerHTML = '<p class="empty-analytics">No study sessions yet</p>';
            return;
        }

        recentSessions.forEach(session => {
            const item = this.createSessionItem(session);
            container.appendChild(item);
        });
    }

    createSessionItem(session) {
        const template = document.getElementById('sessionTemplate');
        const clone = template.content.cloneNode(true);

        const modeNames = {
            'flashcards': '📇 Flashcards',
            'learn': '📖 Learn',
            'test': '📝 Test',
            'match': '🎯 Match'
        };

        clone.querySelector('.session-mode').textContent = modeNames[session.mode] || session.mode;
        clone.querySelector('.session-date').textContent = formatDate(session.startTime);
        clone.querySelector('.session-cards').textContent = session.cardsStudied || 0;

        const total = (session.correctCount || 0) + (session.incorrectCount || 0);
        const accuracy = total > 0 ? Math.round((session.correctCount / total) * 100) : 0;
        clone.querySelector('.session-accuracy').textContent = `${accuracy}%`;

        const duration = session.endTime - session.startTime;
        clone.querySelector('.session-duration').textContent = formatTime(duration);

        return clone;
    }

    renderCardPerformance() {
        const container = document.getElementById('cardPerformanceContainer');
        container.innerHTML = '';

        const filter = document.getElementById('performanceFilter').value;
        const sortBy = document.getElementById('sortBy').value;

        // Calculate stats for each card
        let cardStats = this.cards.map(card => {
            const performances = this.cardPerformances[card.id] || [];
            const total = performances.length;
            const correct = performances.filter(p => p.correct).length;
            const accuracy = total > 0 ? (correct / total) * 100 : 0;

            const status = SRSAlgorithm.getCardStudyStatus(card);

            return {
                card,
                total,
                correct,
                accuracy,
                status,
                lastStudied: performances.length > 0 ? performances[performances.length - 1].timestamp : 0
            };
        });

        // Filter
        if (filter === 'struggling') {
            cardStats = cardStats.filter(s => s.status.difficulty === 'hard');
        } else if (filter === 'mastered') {
            cardStats = cardStats.filter(s => s.status.mastery === 100);
        } else if (filter === 'learning') {
            cardStats = cardStats.filter(s => s.status.mastery > 0 && s.status.mastery < 100);
        }

        // Sort
        if (sortBy === 'accuracy') {
            cardStats.sort((a, b) => a.accuracy - b.accuracy);
        } else if (sortBy === 'attempts') {
            cardStats.sort((a, b) => b.total - a.total);
        } else if (sortBy === 'lastStudied') {
            cardStats.sort((a, b) => b.lastStudied - a.lastStudied);
        }

        if (cardStats.length === 0) {
            container.innerHTML = '<p class="empty-analytics">No cards match the selected filter</p>';
            return;
        }

        cardStats.forEach(stats => {
            const item = this.createCardPerformanceItem(stats);
            container.appendChild(item);
        });
    }

    createCardPerformanceItem(stats) {
        const template = document.getElementById('cardPerformanceTemplate');
        const clone = template.content.cloneNode(true);

        clone.querySelector('.card-term').textContent = stats.card.front;

        // Status badge
        const badge = clone.querySelector('.card-status-badge');
        if (stats.status.mastery === 100) {
            badge.textContent = 'Mastered';
            badge.className = 'card-status-badge mastered';
        } else if (stats.status.difficulty === 'hard') {
            badge.textContent = 'Struggling';
            badge.className = 'card-status-badge struggling';
        } else {
            badge.textContent = 'Learning';
            badge.className = 'card-status-badge learning';
        }

        // Progress bar
        const progressFill = clone.querySelector('.progress-fill');
        progressFill.style.width = `${stats.accuracy}%`;

        clone.querySelector('.stat-value').textContent = `${Math.round(stats.accuracy)}%`;
        clone.querySelector('.attempts-count').textContent = stats.total;
        clone.querySelector('.correct-count').textContent = stats.correct;
        clone.querySelector('.last-studied').textContent = formatDate(stats.lastStudied);
        clone.querySelector('.next-review').textContent = formatDate(stats.card.nextReview);

        return clone;
    }

    renderHeatmap() {
        const container = document.getElementById('heatmapContainer');
        container.innerHTML = '';

        // Get last 49 days (7x7 grid)
        const days = 49;
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;

        // Count sessions per day
        const sessionsByDay = {};
        this.sessions.forEach(session => {
            const date = new Date(session.startTime).toDateString();
            sessionsByDay[date] = (sessionsByDay[date] || 0) + 1;
        });

        // Create heatmap
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now - (i * dayMs));
            const dateStr = date.toDateString();
            const count = sessionsByDay[dateStr] || 0;

            const day = document.createElement('div');
            day.className = `heatmap-day activity-${Math.min(count, 5)}`;

            const dayNumber = date.getDate();
            day.textContent = dayNumber;

            const tooltip = document.createElement('div');
            tooltip.className = 'heatmap-tooltip';
            tooltip.textContent = `${date.toLocaleDateString()}: ${count} session${count !== 1 ? 's' : ''}`;
            day.appendChild(tooltip);

            container.appendChild(day);
        }
    }

    renderCardMasteryHeatmap() {
        const container = document.getElementById('cardMasteryHeatmap');
        container.innerHTML = '';

        if (this.cards.length === 0) {
            container.innerHTML = '<p class="empty-analytics">No cards in this set</p>';
            return;
        }

        // Calculate mastery for each card
        const cardMasteryData = this.cards.map((card, index) => {
            const performances = this.cardPerformances[card.id] || [];
            const total = performances.length;
            const correct = performances.filter(p => p.correct).length;
            const accuracy = total > 0 ? (correct / total) * 100 : 0;

            // Calculate mastery level based on SRS algorithm
            const status = SRSAlgorithm.getCardStudyStatus(card);
            const mastery = status.mastery;

            return {
                card,
                cardNumber: index + 1,
                accuracy,
                mastery,
                total,
                correct,
                incorrect: total - correct
            };
        });

        // Render each card as a cell
        cardMasteryData.forEach(data => {
            const cell = document.createElement('div');
            cell.className = 'card-mastery-cell';

            // Round mastery to nearest 10 for color class
            const masteryClass = Math.floor(data.mastery / 10) * 10;
            cell.classList.add(`mastery-${masteryClass}`);

            cell.textContent = data.cardNumber;

            // Tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'card-mastery-tooltip';
            const truncatedFront = data.card.front.length > 30
                ? data.card.front.substring(0, 30) + '...'
                : data.card.front;
            tooltip.innerHTML = `
                <strong>${truncatedFront}</strong><br>
                Mastery: ${Math.round(data.mastery)}%<br>
                Accuracy: ${Math.round(data.accuracy)}%
            `;
            cell.appendChild(tooltip);

            // Click to view details
            cell.addEventListener('click', () => {
                this.showCardDetail(data);
            });

            container.appendChild(cell);
        });
    }

    showCardDetail(data) {
        // Populate modal with card data
        document.getElementById('modalCardFront').textContent = data.card.front;
        document.getElementById('modalCardBack').textContent = data.card.back;

        // Handle images
        const frontImage = document.getElementById('modalCardFrontImage');
        if (data.card.frontImage) {
            frontImage.src = data.card.frontImage;
            frontImage.style.display = 'block';
        } else {
            frontImage.style.display = 'none';
        }

        const backImage = document.getElementById('modalCardBackImage');
        if (data.card.backImage) {
            backImage.src = data.card.backImage;
            backImage.style.display = 'block';
        } else {
            backImage.style.display = 'none';
        }

        // Stats
        document.getElementById('modalCardMastery').textContent = `${Math.round(data.mastery)}%`;
        document.getElementById('modalCardAccuracy').textContent = `${Math.round(data.accuracy)}%`;
        document.getElementById('modalCardAttempts').textContent = data.total;
        document.getElementById('modalCardCorrect').textContent = data.correct;
        document.getElementById('modalCardIncorrect').textContent = data.incorrect;
        document.getElementById('modalCardNextReview').textContent = formatDate(data.card.nextReview);

        // Show modal
        document.getElementById('cardDetailModal').style.display = 'flex';
    }

    hideCardDetailModal() {
        document.getElementById('cardDetailModal').style.display = 'none';
    }

    updateChartsTheme() {
        // Re-render charts with new theme
        this.renderCharts();
    }
}

// Initialize
const manager = new AnalyticsManager();
document.addEventListener('DOMContentLoaded', () => {
    manager.init();
});
