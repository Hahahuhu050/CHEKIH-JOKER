// App State Architecture
let state = {
    players: {
        A: { id: 'A', name: 'Pemain A', score: 0, highestScore: 0, stars: 0, burns: 0, burned: 0, tripleBurn: 0 },
        B: { id: 'B', name: 'Pemain B', score: 0, highestScore: 0, stars: 0, burns: 0, burned: 0, tripleBurn: 0 },
        C: { id: 'C', name: 'Pemain C', score: 0, highestScore: 0, stars: 0, burns: 0, burned: 0, tripleBurn: 0 },
        D: { id: 'D', name: 'Pemain D', score: 0, highestScore: 0, stars: 0, burns: 0, burned: 0, tripleBurn: 0 }
    },
    round: 1,
    targetScore: 1000,
    history: [],
    ranking: ['A', 'B', 'C', 'D']
};

// Architecture Undo System Backup Matrix
let undoStack = [];

// Speech Engine Queue Core Management
let speechQueue = [];
let isSpeaking = false;

// DOM Elements Object Cache
const DOM = {
    setupScreen: document.getElementById('setup-screen'),
    gameScreen: document.getElementById('game-screen'),
    playerInputs: {
        A: document.getElementById('playerA'),
        B: document.getElementById('playerB'),
        C: document.getElementById('playerC'),
        D: document.getElementById('playerD')
    },
    targetButtons: document.querySelectorAll('.btn-target'),
    customTarget: document.getElementById('customTarget'),
    btnStart: document.getElementById('btn-start'),
    displayRound: document.getElementById('display-round'),
    displayTargetInfo: document.getElementById('display-target-info'),
    themeBtn: document.getElementById('btn-theme'),
    fullscreenBtn: document.getElementById('btn-fullscreen'),
    screenshotBtn: document.getElementById('btn-screenshot'),
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    rankingContainer: document.getElementById('ranking-container'),
    historyContainer: document.getElementById('history-container'),
    achievementContainer: document.getElementById('achievement-container'),
    statistikTableBody: document.getElementById('statistik-table-body'),
    scoreInputs: {
        A: document.getElementById('input-scoreA'),
        B: document.getElementById('input-scoreB'),
        C: document.getElementById('input-scoreC'),
        D: document.getElementById('input-scoreD')
    },
    lblScores: {
        A: document.getElementById('lbl-scoreA'),
        B: document.getElementById('lbl-scoreB'),
        C: document.getElementById('lbl-scoreC'),
        D: document.getElementById('lbl-scoreD')
    },
    btnUndo: document.getElementById('btn-undo'),
    btnSaveRound: document.getElementById('btn-save-round'),
    btnNextRound: document.getElementById('btn-next-round'),
    captureArea: document.getElementById('game-capture-area')
};

// Initialization Setup Hooks
document.addEventListener('DOMContentLoaded', () => {
    initEventHandlers();
    loadGameState();
});

// Event Binding Layer
function initEventHandlers() {
    // Target Value Selectors Configuration
    DOM.targetButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            DOM.targetButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.targetScore = parseInt(e.target.dataset.value);
            DOM.customTarget.value = '';
        });
    });

    DOM.customTarget.addEventListener('input', (e) => {
        if(e.target.value) {
            DOM.targetButtons.forEach(b => b.classList.remove('active'));
            state.targetScore = parseInt(e.target.value) || 1000;
        }
    });

    // Workflow Navigation Triggers
    DOM.btnStart.addEventListener('click', startGame);
    DOM.btnSaveRound.addEventListener('click', processRoundScores);
    DOM.btnNextRound.addEventListener('click', advanceRoundStep);
    DOM.btnUndo.addEventListener('click', executeUndoState);

    // Dynamic Module Switches UI Tabs Toggle
    DOM.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            DOM.tabButtons.forEach(b => b.classList.remove('active'));
            DOM.tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // Device Utilities Binding Interface
    DOM.themeBtn.addEventListener('click', toggleColorTheme);
    DOM.fullscreenBtn.addEventListener('click', toggleSystemFullscreen);
    DOM.screenshotBtn.addEventListener('click', triggerAppScreenshot);
}

// Persist / Storage Engine Drivers
function saveGameState() {
    localStorage.setItem('score_cekih_state', JSON.stringify(state));
    localStorage.setItem('score_cekih_undo', JSON.stringify(undoStack));
}

function loadGameState() {
    const localData = localStorage.getItem('score_cekih_state');
    const undoData = localStorage.getItem('score_cekih_undo');
    if (localData) {
        state = JSON.parse(localData);
        if (undoData) undoStack = JSON.parse(undoData);
        
        // Re-inject label data values
        for(let key in state.players) {
            DOM.lblScores[key].textContent = state.players[key].name;
        }
        
        updateDashboardView();
        DOM.setupScreen.classList.remove('active');
        DOM.gameScreen.classList.add('active');
    }
}

// State Machine Initialization Operations
function startGame() {
    // Map identities parameters
    state.players.A.name = DOM.playerInputs.A.value.trim() || 'Pemain A';
    state.players.B.name = DOM.playerInputs.B.value.trim() || 'Pemain B';
    state.players.C.name = DOM.playerInputs.C.value.trim() || 'Pemain C';
    state.players.D.name = DOM.playerInputs.D.value.trim() || 'Pemain D';

    if(DOM.customTarget.value) {
        state.targetScore = parseInt(DOM.customTarget.value) || 1000;
    }

    // Assign labels structures inside DOM Context
    for(let key in state.players) {
        DOM.lblScores[key].textContent = state.players[key].name;
    }

    state.round = 1;
    state.history = [];
    undoStack = [];
    
    // Clear dynamic states
    for (let key in state.players) {
        state.players[key].score = 0;
        state.players[key].highestScore = 0;
        state.players[key].stars = 0;
        state.players[key].burns = 0;
        state.players[key].burned = 0;
        state.players[key].tripleBurn = 0;
    }
    
    logActivity("Permainan Baru Dimulai. Target: " + state.targetScore);
    recalculateStandingsRanking();
    updateDashboardView();
    saveGameState();

    DOM.setupScreen.classList.remove('active');
    DOM.gameScreen.classList.add('active');
}

// Logic Rule Processing Computation Matrix
function processRoundScores() {
    // Structural deep copy of context state for backtracks
    const deepStateBackup = JSON.parse(JSON.stringify(state));

    let addedScores = {
        A: parseInt(DOM.scoreInputs.A.value) || 0,
        B: parseInt(DOM.scoreInputs.B.value) || 0,
        C: parseInt(DOM.scoreInputs.C.value) || 0,
        D: parseInt(DOM.scoreInputs.D.value) || 0
    };

    // Validation boundary parameter checking
    for (let key in addedScores) {
        if(addedScores[key] > 1000) {
            alert(`Skor penambahan maksimal 1000 per input ronde! Periksa input Pemain ${state.players[key].name}.`);
            return;
        }
    }

    // Read state parameters prior computing operations
    let previousScores = {
        A: state.players.A.score,
        B: state.players.B.score,
        C: state.players.C.score,
        D: state.players.D.score
    };

    let calculatedNextScores = {};
    for(let key in state.players) {
        calculatedNextScores[key] = previousScores[key] + addedScores[key];
    }

    // Compile burn event indicators matrix parameters (Ronde 1 Skip)
    let burnTrackers = { A: false, B: false, C: false, D: false };
    let burnHistoryMessages = [];
    let playersBurnedCount = 0;
    let burnerIdentityKey = null;

    if (state.round > 1) {
        // Evaluate pairs combination to assess overlaps condition checks
        for (let structuralKey in state.players) {
            let currentDeltaAdded = addedScores[structuralKey];
            // Only examine players who achieved positive incremental changes
            if (currentDeltaAdded > 0) {
                let currentFinalCalc = calculatedNextScores[structuralKey];
                let currentStartingCalc = previousScores[structuralKey];
                let localBurnCounter = 0;

                for (let comparisonKey in state.players) {
                    if (structuralKey !== comparisonKey) {
                        let oppositionStartingCalc = previousScores[comparisonKey];
                        let oppositionFinalCalc = calculatedNextScores[comparisonKey];

                        // Condition checks logic validation: position setup was structurally lower down, but surpassed target outcome value limits
                        if (currentStartingCalc < oppositionStartingCalc && currentFinalCalc > oppositionFinalCalc) {
                            // Ensure target player is not already completely wiped by an earlier action step
                            if (!burnTrackers[comparisonKey] && calculatedNextScores[comparisonKey] !== 0) {
                                burnTrackers[comparisonKey] = true;
                                localBurnCounter++;
                                burnHistoryMessages.push(`${state.players[structuralKey].name} membakar ${state.players[comparisonKey].name}`);
                                enqueueSpeech(`${state.players[structuralKey].name} membakar ${state.players[comparisonKey].name}`);
                            }
                        }
                    }
                }

                if (localBurnCounter > 0) {
                    state.players[structuralKey].burns += localBurnCounter;
                    if (localBurnCounter > playersBurnedCount) {
                        playersBurnedCount = localBurnCounter;
                        burnerIdentityKey = structuralKey;
                    }
                }
            }
        }
    }

    // Apply Burn structural evaluations results configurations across records state
    for(let key in burnTrackers) {
        if(burnTrackers[key]) {
            calculatedNextScores[key] = 0;
            state.players[key].burned += 1;
        }
    }

    // Evaluate Triple Burn achievements qualifications parameters
    if (playersBurnedCount === 3 && burnerIdentityKey) {
        state.players[burnerIdentityKey].tripleBurn += 1;
        logActivity("TRIPLE BURN oleh " + state.players[burnerIdentityKey].name, "burn-event");
        enqueueSpeech("Triple Burn");
    }

    // Inject history modifications data metrics reports updates
    burnHistoryMessages.forEach(msg => {
        logActivity(msg, "burn-event");
    });

    // Write computed results elements mutations back directly inside structural objects elements
    for(let key in state.players) {
        state.players[key].score = calculatedNextScores[key];
        
        // Log increment/decrement updates logs
        if (addedScores[key] !== 0) {
            logActivity(`${state.players[key].name}: ${addedScores[key] >= 0 ? '+' : ''}${addedScores[key]} Poin`);
        }

        // Evaluate and adjust historic highest score metadata profiles records
        if(state.players[key].score > state.players[key].highestScore) {
            state.players[key].highestScore = state.players[key].score;
        }
    }

    // Evaluate Target Achievement Condition & Star Distribution Architecture
    let starWinnersArray = [];
    for(let key in state.players) {
        if (state.players[key].score >= state.targetScore) {
            starWinnersArray.push(key);
        }
    }

    // Apply state rollback parameters values metrics adjustments upon success matches limits updates
    if (starWinnersArray.length > 0) {
        // Sort winners descending to match voice sequences requirements properly
        starWinnersArray.sort((x, y) => state.players[y].score - state.players[x].score);
        
        starWinnersArray.forEach(key => {
            state.players[key].stars += 1;
            logActivity(`Selamat kepada ${state.players[key].name} mendapatkan bintang satu`, "star-event");
            enqueueSpeech(`Selamat kepada ${state.players[key].name} mendapatkan bintang satu`);
        });

        // Trigger complete score points metrics reset sweeps operations across configurations
        for(let key in state.players) {
            state.players[key].score = 0;
        }
        logActivity("Skor direset kembali ke 0 karena target kemenangan telah tercapai");
        
        // Push initial post-reset score notification prompts structures down the voice streams
        enqueueSpeech("Skor direset kembali ke nol. Pengumuman skor baru.");
        for(let key of ['A','B','C','D']) {
            enqueueSpeech(`${state.players[key].name} nol`);
        }
    } else {
        // Standard regular voice announcement matrix configurations setup routines
        for(let key of ['A','B','C','D']) {
            let readingScore = state.players[key].score;
            let speakText = `${state.players[key].name} total poin ${readingScore}`;
            enqueueSpeech(speakText);
        }
    }

    // Push states entries items snapshots down structural storage backup matrix queues
    undoStack.push(deepStateBackup);
    
    recalculateStandingsRanking();
    updateDashboardView();
    saveGameState();

    // Reset numeric inputs areas interface
    for(let key in DOM.scoreInputs) {
        DOM.scoreInputs[key].value = '';
    }
}

function advanceRoundStep() {
    const deepStateBackup = JSON.parse(JSON.stringify(state));
    undoStack.push(deepStateBackup);

    state.round += 1;
    logActivity("Mulai Ronde " + state.round);
    updateDashboardView();
    saveGameState();
}

function executeUndoState() {
    if (undoStack.length === 0) {
        alert("Tidak ada aksi ronde yang bisa di-undo.");
        return;
    }
    state = undoStack.pop();
    logActivity("Aksi terakhir telah di-Undo");
    updateDashboardView();
    saveGameState();
}

// Core Math Sorters Computations Layers
function recalculateStandingsRanking() {
    let playersArray = ['A', 'B', 'C', 'D'];
    playersArray.sort((x, y) => {
        return state.players[y].score - state.players[x].score;
    });
    state.ranking = playersArray;
}

function logActivity(text, className = '') {
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    state.history.unshift({ text: `[${timestamp}] ${text}`, className });
}

// UI Rendering Engine Modules Components Interfaces
function updateDashboardView() {
    DOM.displayRound.textContent = "Ronde " + state.round;
    DOM.displayTargetInfo.textContent = "Target: " + state.targetScore;

    renderRankingTab();
    renderHistoryTab();
    renderAchievementsTab();
    renderStatistikTab();
}

function renderRankingTab() {
    DOM.rankingContainer.innerHTML = '';
    state.ranking.forEach((pKey, index) => {
        const p = state.players[pKey];
        const rankIndex = index + 1;
        
        let starsString = '⭐'.repeat(p.stars);

        const card = document.createElement('div');
        card.className = `ranking-card rank-position-${rankIndex}`;
        card.innerHTML = `
            <div class="rank-badge rank-badge-${rankIndex}">${rankIndex}</div>
            <div class="rank-details">
                <div class="rank-name-container">
                    <span class="rank-pname">${p.name}</span>
                    <span class="rank-stars">${starsString ? starsString : '-'}</span>
                </div>
                <span class="rank-score-display">${p.score}</span>
            </div>
        `;
        DOM.rankingContainer.appendChild(card);
    });
}

function renderHistoryTab() {
    DOM.historyContainer.innerHTML = '';
    state.history.forEach(item => {
        const row = document.createElement('div');
        row.className = `history-item ${item.className || ''}`;
        row.textContent = item.text;
        DOM.historyContainer.appendChild(row);
    });
}

function renderAchievementsTab() {
    DOM.achievementContainer.innerHTML = '';
    
    const rulesList = [
        { id: 'tukang_ngocok', title: 'Tukang Ngocok Kartu', desc: 'Skor di bawah 0', icon: '🃏', check: (p) => p.score < 0 },
        { id: 'tukang_bakar', title: 'Tukang Bakar', desc: 'Membakar >= 3 kali', icon: '🔥', check: (p) => p.burns >= 3 },
        { id: 'hari_apes', title: 'Hari Apes Gak Ada Yang Tau', desc: 'Terbakar >= 5 kali', icon: '😭', check: (p) => p.burned >= 5 },
        { id: 'dewa_kartu', title: 'Dewa Kartu', desc: 'Skor tertinggi >= 500', icon: '👑', check: (p) => p.highestScore >= 500 },
        { id: 'dewa_dari_segala_dewa', title: 'Dewa Dari Segala Dewa', desc: 'Memiliki Bintang > 1', icon: '⚡', check: (p) => p.stars > 1 },
        { id: 'triple_burn', title: 'Triple Burn', desc: 'Membakar 3 pemain sekaligus', icon: '💥', check: (p) => p.tripleBurn > 0 }
    ];

    for(let key of ['A','B','C','D']) {
        const p = state.players[key];
        
        rulesList.forEach(ach => {
            const isUnlocked = ach.check(p);
            const achCard = document.createElement('div');
            achCard.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;
            achCard.innerHTML = `
                <div class="achievement-icon">${ach.icon}</div>
                <div class="achievement-title">${ach.title}</div>
                <div class="achievement-desc">${p.name} (${ach.desc})</div>
            `;
            DOM.achievementContainer.appendChild(achCard);
        });
    }
}

function renderStatistikTab() {
    DOM.statistikTableBody.innerHTML = '';
    for(let key of ['A','B','C','D']) {
        const p = state.players[key];
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.name}</strong></td>
            <td>${p.score}</td>
            <td>${p.highestScore}</td>
            <td>${p.stars}</td>
            <td>${p.burns}</td>
            <td>${p.burned}</td>
            <td>${p.tripleBurn}</td>
        `;
        DOM.statistikTableBody.appendChild(tr);
    }
}

// Speech Synthesizer Module Logic Orchestrations
function enqueueSpeech(text) {
    // Basic text processing optimizations for standard numeric readouts transformations
    let formattedText = text
        .replace(/-/g, ' minus ')
        .replace(/0/g, ' nol ');

    speechQueue.push(formattedText);
    processSpeechQueue();
}

function processSpeechQueue() {
    if (isSpeaking || speechQueue.length === 0) return;
    
    isSpeaking = true;
    let textToSpeak = speechQueue.shift();
    
    // Explicit SpeechSynthesis Instantiation routines
    let utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95; 

    utterance.onend = () => {
        isSpeaking = false;
        processSpeechQueue();
    };

    utterance.onerror = () => {
        isSpeaking = false;
        processSpeechQueue();
    };

    window.speechSynthesis.speak(utterance);
}

// Native Hardware Integration Controls Modules
function toggleColorTheme() {
    if (document.body.classList.contains('dark-theme')) {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
    }
}

function toggleSystemFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
            .catch(err => alert(`Gagal mengaktifkan Fullscreen: ${err.message}`));
    } else {
        document.exitFullscreen();
    }
}

function triggerAppScreenshot() {
    // Emulated HTML Canvas Capture Engine for Independent Local Deployment
    DOM.screenshotBtn.disabled = true;
    DOM.screenshotBtn.textContent = "⏳";

    // Dynamic compilation of statistical parameters into printable tables layouts configurations
    let printWindow = window.open('', '_blank');
    if(!printWindow) {
        alert("Harap izinkan pop-up untuk mendownload tampilan hasil screenshot.");
        DOM.screenshotBtn.textContent = "📸";
        DOM.screenshotBtn.disabled = false;
        return;
    }

    let inlineCapturedStyle = `
        body { background: #121212; color: #fff; font-family: sans-serif; padding: 20px; text-align: center; }
        .box { border: 2px solid #bb86fc; padding: 20px; border-radius: 12px; background: #1e1e1e; max-width: 500px; margin: 0 auto; }
        table { width:100%; border-collapse:collapse; margin-top:20px; }
        th, td { border: 1px solid #333; padding: 10px; text-align: center; }
        th { background: #bb86fc; color: #000; }
        h1 { color: #bb86fc; margin-bottom: 2px; }
    `;

    let htmlLayoutContent = `
        <html>
        <head>
            <title>Score Snapshot - Sadewa Corp</title>
            <style>${inlineCapturedStyle}</style>
        </head>
        <body>
            <div class="box">
                <h1>Score Cekih by Sadewa Corp</h1>
                <p>Ronde: ${state.round} | Target: ${state.targetScore}</p>
                <hr style="border-color:#333;">
                <h3>Peringkat Klasemen Saat Ini</h3>
                <table>
                    <thead>
                        <tr><th>Pos</th><th>Pemain</th><th>Skor</th><th>Bintang</th></tr>
                    </thead>
                    <tbody>
                        ${state.ranking.map((k, i) => `<tr><td>${i+1}</td><td>${state.players[k].name}</td><td>${state.players[k].score}</td><td>${state.players[k].stars}</td></tr>`).join('')}
                    </tbody>
                </table>
                <p style="margin-top:20px; font-size:12px; color:#666;">File snapshot data generated successfully offline.</p>
            </div>
            <script>
                window.onload = function() { window.print(); }
            <\/script>
        </body>
        </html>
    `;
    
    printWindow.document.write(htmlLayoutContent);
    printWindow.document.close();

    setTimeout(() => {
        DOM.screenshotBtn.textContent = "📸";
        DOM.screenshotBtn.disabled = false;
    }, 1000);
}
