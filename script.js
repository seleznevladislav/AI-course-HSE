// Глобальные переменные
let goals = [];
let chatMessages = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    initializeCharts();
    loadGoalsFromStorage();
});

// Инициализация приложения
function initializeApp() {
    // Плавная прокрутка для навигации
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Мобильное меню
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    hamburger.addEventListener('click', function() {
        navMenu.classList.toggle('active');
    });

    // Закрытие мобильного меню при клике на ссылку
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Загрузка файла
    const fileInput = document.getElementById('fileInput');
    const uploadBox = document.getElementById('uploadBox');

    fileInput.addEventListener('change', handleFileUpload);
    uploadBox.addEventListener('click', () => fileInput.click());

    // Drag and drop для загрузки файла
    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = '#764ba2';
        uploadBox.style.backgroundColor = '#f8fafc';
    });

    uploadBox.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = '#667eea';
        uploadBox.style.backgroundColor = 'white';
    });

    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = '#667eea';
        uploadBox.style.backgroundColor = 'white';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileUpload({ target: { files: files } });
        }
    });

    // Форма создания цели
    const goalForm = document.getElementById('goalForm');
    goalForm.addEventListener('submit', handleGoalSubmit);

    // Чат
    const chatInput = document.getElementById('chatInput');
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Закрытие модального окна при клике вне его
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('goalModal');
        if (e.target === modal) {
            closeGoalModal();
        }
    });
}

// Обработка загрузки файла
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Симуляция обработки файла
    const uploadBox = document.getElementById('uploadBox');
    uploadBox.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        <h3>Обрабатываем файл...</h3>
        <p>Пожалуйста, подождите</p>
    `;

    setTimeout(() => {
        showAnalysisResults();
    }, 2000);
}

// Показать результаты анализа
function showAnalysisResults() {
    const uploadBox = document.getElementById('uploadBox');
    const analysisResults = document.getElementById('analysisResults');

    uploadBox.innerHTML = `
        <i class="fas fa-check-circle" style="color: #10b981;"></i>
        <h3>Файл успешно обработан!</h3>
        <p>Анализ завершен</p>
        <button class="btn btn-outline" onclick="resetUpload()">
            Загрузить другой файл
        </button>
    `;

    analysisResults.style.display = 'block';
    analysisResults.scrollIntoView({ behavior: 'smooth' });
}

// Сброс загрузки
function resetUpload() {
    const uploadBox = document.getElementById('uploadBox');
    const analysisResults = document.getElementById('analysisResults');
    const fileInput = document.getElementById('fileInput');

    uploadBox.innerHTML = `
        <i class="fas fa-cloud-upload-alt"></i>
        <h3>Загрузите банковскую выписку</h3>
        <p>Поддерживаются форматы: CSV, Excel, PDF</p>
        <button class="btn btn-outline" onclick="document.getElementById('fileInput').click()">
            Выбрать файл
        </button>
    `;

    analysisResults.style.display = 'none';
    fileInput.value = '';
}

// Управление целями
function openGoalModal() {
    document.getElementById('goalModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeGoalModal() {
    document.getElementById('goalModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('goalForm').reset();
}

function handleGoalSubmit(event) {
    event.preventDefault();

    const goalData = {
        id: Date.now(),
        name: document.getElementById('goalName').value,
        amount: parseInt(document.getElementById('goalAmount').value),
        deadline: document.getElementById('goalDeadline').value,
        description: document.getElementById('goalDescription').value,
        currentAmount: 0,
        createdAt: new Date().toISOString()
    };

    goals.push(goalData);
    saveGoalsToStorage();
    renderGoals();
    closeGoalModal();

    // Показать уведомление
    showNotification('Цель успешно создана!', 'success');
}

function renderGoals() {
    const goalsList = document.getElementById('goalsList');
    
    if (goals.length === 0) {
        goalsList.innerHTML = `
            <div class="goal-card" style="text-align: center; color: #666;">
                <p>У вас пока нет финансовых целей</p>
                <p>Создайте первую цель, чтобы начать отслеживать прогресс!</p>
            </div>
        `;
        return;
    }

    goalsList.innerHTML = goals.map(goal => {
        const progress = (goal.currentAmount / goal.amount) * 100;
        const deadline = new Date(goal.deadline);
        const today = new Date();
        const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

        return `
            <div class="goal-card">
                <div class="goal-header">
                    <h3 class="goal-title">${goal.name}</h3>
                    <span class="goal-amount">₽ ${goal.amount.toLocaleString()}</span>
                </div>
                <div class="goal-progress">
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    <div class="goal-progress-text">
                        <span>₽ ${goal.currentAmount.toLocaleString()} из ₽ ${goal.amount.toLocaleString()}</span>
                        <span>${Math.round(progress)}%</span>
                    </div>
                </div>
                <div class="goal-deadline">
                    ${daysLeft > 0 ? `Осталось ${daysLeft} дней` : 'Срок истек'}
                </div>
                ${goal.description ? `<p style="margin-top: 1rem; color: #666;">${goal.description}</p>` : ''}
            </div>
        `;
    }).join('');
}

// Чат с AI
function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message) return;

    // Добавить сообщение пользователя
    addMessage(message, 'user');
    chatInput.value = '';

    // Симуляция ответа AI
    setTimeout(() => {
        const aiResponse = generateAIResponse(message);
        addMessage(aiResponse, 'ai');
    }, 1000);
}

function addMessage(content, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const avatar = sender === 'ai' ? 'fas fa-robot' : 'fas fa-user';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="${avatar}"></i>
        </div>
        <div class="message-content">
            <p>${content}</p>
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateAIResponse(userMessage) {
    const responses = {
        'привет': 'Привет! Я ваш персональный финансовый консультант. Как дела с финансами?',
        'помощь': 'Я могу помочь вам с анализом расходов, созданием финансовых целей, советами по инвестициям и экономии. Что вас интересует?',
        'экономия': 'Для экономии рекомендую: 1) Создать резервный фонд на 3-6 месяцев расходов, 2) Отслеживать все траты, 3) Автоматизировать сбережения, 4) Пересмотреть подписки и ненужные расходы.',
        'инвестиции': 'Для начинающих инвесторов рекомендую: 1) Начать с индексных фондов, 2) Диверсифицировать портфель, 3) Инвестировать регулярно небольшими суммами, 4) Не поддаваться эмоциям при колебаниях рынка.',
        'бюджет': 'Для составления бюджета: 1) Запишите все доходы, 2) Категоризируйте расходы, 3) Определите приоритеты, 4) Создайте план сбережений, 5) Регулярно пересматривайте бюджет.',
        'долги': 'Для работы с долгами: 1) Составьте список всех долгов, 2) Определите процентные ставки, 3) Используйте метод "снежного кома" или "лавины", 4) Рассмотрите рефинансирование, 5) Избегайте новых долгов.'
    };

    const lowerMessage = userMessage.toLowerCase();
    
    for (const [keyword, response] of Object.entries(responses)) {
        if (lowerMessage.includes(keyword)) {
            return response;
        }
    }

    // Общие ответы
    const generalResponses = [
        'Это интересный вопрос! Можете рассказать подробнее о вашей финансовой ситуации?',
        'Я понимаю вашу озабоченность. Давайте разберем это пошагово.',
        'Отличный вопрос! Для более точного совета мне нужно больше информации о ваших доходах и расходах.',
        'Это важная тема. Рекомендую начать с анализа ваших текущих финансовых привычек.',
        'Хорошо, что вы об этом думаете! Финансовая грамотность - это основа успеха.'
    ];

    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
}

// Инициализация графиков
function initializeCharts() {
    // График доходов и расходов
    const incomeExpenseCtx = document.getElementById('incomeExpenseChart');
    if (incomeExpenseCtx) {
        new Chart(incomeExpenseCtx, {
            type: 'bar',
            data: {
                labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
                datasets: [{
                    label: 'Доходы',
                    data: [120000, 135000, 125000, 140000, 130000, 145000],
                    backgroundColor: '#10b981',
                    borderRadius: 8
                }, {
                    label: 'Расходы',
                    data: [95000, 105000, 98000, 110000, 102000, 115000],
                    backgroundColor: '#ef4444',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₽' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // График сбережений
    const savingsCtx = document.getElementById('savingsChart');
    if (savingsCtx) {
        new Chart(savingsCtx, {
            type: 'line',
            data: {
                labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
                datasets: [{
                    label: 'Сбережения',
                    data: [25000, 30000, 27000, 30000, 28000, 30000],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
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
                        ticks: {
                            callback: function(value) {
                                return '₽' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // Круговая диаграмма расходов
    const expenseCtx = document.getElementById('expenseChart');
    if (expenseCtx) {
        new Chart(expenseCtx, {
            type: 'doughnut',
            data: {
                labels: ['Еда', 'Транспорт', 'Развлечения', 'Покупки', 'Прочее'],
                datasets: [{
                    data: [35, 21, 17, 28, 15],
                    backgroundColor: [
                        '#ff6b6b',
                        '#4ecdc4',
                        '#45b7d1',
                        '#96ceb4',
                        '#feca57'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }
}

// Утилиты
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    // Стили для уведомления
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#667eea'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Локальное хранилище
function saveGoalsToStorage() {
    localStorage.setItem('financeAI_goals', JSON.stringify(goals));
}

function loadGoalsFromStorage() {
    const savedGoals = localStorage.getItem('financeAI_goals');
    if (savedGoals) {
        goals = JSON.parse(savedGoals);
        renderGoals();
    }
}

// CSS анимации для уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Дополнительные функции для демонстрации
function simulateDataUpdate() {
    // Симуляция обновления данных каждые 30 секунд
    setInterval(() => {
        // Обновляем случайные значения в карточках
        const balanceElement = document.querySelector('.card-amount');
        if (balanceElement) {
            const currentBalance = parseInt(balanceElement.textContent.replace(/[^\d]/g, ''));
            const newBalance = currentBalance + Math.floor(Math.random() * 1000 - 500);
            balanceElement.textContent = `₽ ${newBalance.toLocaleString()}`;
        }
    }, 30000);
}

// Запуск симуляции обновления данных
simulateDataUpdate();
