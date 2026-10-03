/* =========================================================
   DIGITAL FUNK ACADEMY
   FUNKALPHABET TRAINER
   VERSION 4.1
   ========================================================= */

const DATA = {
    nato: [
        ["A", "Alpha"],
        ["B", "Bravo"],
        ["C", "Charlie"],
        ["D", "Delta"],
        ["E", "Echo"],
        ["F", "Foxtrot"],
        ["G", "Golf"],
        ["H", "Hotel"],
        ["I", "India"],
        ["J", "Juliett"],
        ["K", "Kilo"],
        ["L", "Lima"],
        ["M", "Mike"],
        ["N", "November"],
        ["O", "Oscar"],
        ["P", "Papa"],
        ["Q", "Quebec"],
        ["R", "Romeo"],
        ["S", "Sierra"],
        ["T", "Tango"],
        ["U", "Uniform"],
        ["V", "Victor"],
        ["W", "Whiskey"],
        ["X", "X-ray"],
        ["Y", "Yankee"],
        ["Z", "Zulu"]
    ],

    deutsch: [
        ["A", "Aachen"],
        ["Ä", "Umlaut Aachen"],
        ["B", "Berlin"],
        ["C", "Chemnitz"],
        ["D", "Düsseldorf"],
        ["E", "Essen"],
        ["F", "Frankfurt"],
        ["G", "Goslar"],
        ["H", "Hamburg"],
        ["I", "Ingelheim"],
        ["J", "Jena"],
        ["K", "Köln"],
        ["L", "Leipzig"],
        ["M", "München"],
        ["N", "Nürnberg"],
        ["O", "Offenbach"],
        ["Ö", "Umlaut Offenbach"],
        ["P", "Potsdam"],
        ["Q", "Quickborn"],
        ["R", "Rostock"],
        ["S", "Salzwedel"],
        ["ß", "Eszett"],
        ["T", "Tübingen"],
        ["U", "Unna"],
        ["Ü", "Umlaut Unna"],
        ["V", "Völklingen"],
        ["W", "Wuppertal"],
        ["X", "Xanten"],
        ["Y", "Ypsilon"],
        ["Z", "Zwickau"]
    ]
};


/* =========================================================
   SPEICHER
   ========================================================= */

const STORAGE_KEY = "funkalphabet-trainer-v41";

let state = {
    training: {
        mode: "nato",

        // WICHTIG:
        // Training IMMER Buchstabe -> Funkwort
        direction: "letter",

        source: "all",
        index: 0,

        score: 0,
        correct: 0,
        attempts: 0,

        solved: [],

        errors: {},
        streaks: {},

        answered: false
    },

    stats: {
        natoAttempts: 0,
        natoCorrect: 0,

        deutschAttempts: 0,
        deutschCorrect: 0,

        exams: 0,

        history: []
    }
};


function saveState() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
    );
}


function loadState() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (!saved) return;

        const parsed = JSON.parse(saved);

        if (parsed.training) {
            state.training = {
                ...state.training,
                ...parsed.training
            };
        }

        if (parsed.stats) {
            state.stats = {
                ...state.stats,
                ...parsed.stats
            };
        }

    } catch (error) {

        console.warn(
            "Speicher konnte nicht geladen werden.",
            error
        );

    }

    // Sicherheit:
    // Training niemals Funkwort -> Buchstabe
    state.training.direction = "letter";
}


/* =========================================================
   HILFSFUNKTIONEN
   ========================================================= */

function getData(mode) {
    return DATA[mode] || DATA.nato;
}


function normalize(text) {

    return String(text || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}


function getPageElement(name) {

    if (name === "stats") {
        return document.getElementById("statsPage");
    }

    return document.getElementById(name);
}


function showPage(name) {

    document
        .querySelectorAll(".page")
        .forEach(page => {
            page.classList.remove("active");
        });

    const target = getPageElement(name);

    if (target) {
        target.classList.add("active");
    }

    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page === name
            );

        });

    if (name === "learn") {
        renderLearn();
    }

    if (name === "training") {
        renderTraining();
    }

    if (name === "stats") {
        renderStats();
    }

    if (name === "exam") {
        renderExam();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   LERNEN
   ========================================================= */

let learnMode = "nato";


function renderLearn() {

    const grid =
        document.getElementById("learnGrid");

    if (!grid) return;

    const data = getData(learnMode);

    grid.innerHTML = "";

    data.forEach(item => {

        const card =
            document.createElement("div");

        card.className = "alphabet-card";

        card.innerHTML = `
            <div class="alphabet-letter">
                ${item[0]}
            </div>

            <div class="alphabet-word">
                ${item[1]}
            </div>
        `;

        grid.appendChild(card);
    });
}


/* =========================================================
   TRAINING
   ========================================================= */

/*
    WICHTIG:

    Training besitzt KEINE Richtungsauswahl.

    Es gibt ausschließlich:

    BUCHSTABE -> FUNKWORT
*/


function getTrainingPool() {

    const data =
        getData(state.training.mode);

    if (
        state.training.source === "errors"
    ) {

        const errors =
            Object.keys(state.training.errors);

        const pool =
            data.filter(item =>
                errors.includes(item[0])
            );

        // Falls keine Fehler vorhanden sind,
        // bleibt die Liste leer.
        return pool;
    }

    return data;
}


function getCurrentTrainingItem() {

    const pool =
        getTrainingPool();

    if (!pool.length) {
        return null;
    }

    if (
        state.training.index >= pool.length
    ) {
        state.training.index = 0;
    }

    return pool[state.training.index];
}


function renderTraining() {

    const pool =
        getTrainingPool();

    const prompt =
        document.getElementById("trainingPrompt");

    const input =
        document.getElementById("trainingInput");

    const button =
        document.getElementById("trainingAnswerBtn");

    const feedback =
        document.getElementById("trainingFeedback");

    const modeLabel =
        document.getElementById("trainingModeLabel");

    const directionLabel =
        document.getElementById("trainingDirectionLabel");

    const progress =
        document.getElementById("trainingProgress");

    const errorBadge =
        document.getElementById("trainingErrorBadge");

    const score =
        document.getElementById("trainingScore");

    const correct =
        document.getElementById("trainingCorrect");

    const attempts =
        document.getElementById("trainingAttempts");


    // Richtung immer fest setzen
    state.training.direction = "letter";


    if (modeLabel) {

        modeLabel.textContent =
            state.training.mode === "nato"
                ? "NATO"
                : "DEUTSCH";
    }


    if (directionLabel) {

        directionLabel.textContent =
            "BUCHSTABE → FUNKWORT";
    }


    if (score) {
        score.textContent =
            state.training.score;
    }


    if (correct) {
        correct.textContent =
            state.training.correct;
    }


    if (attempts) {
        attempts.textContent =
            state.training.attempts;
    }


    if (!pool.length) {

        if (prompt) {
            prompt.textContent =
                "KEINE FEHLER VORHANDEN";
        }

        if (input) {
            input.value = "";
            input.disabled = true;
        }

        if (button) {
            button.textContent = "TRAINING STARTEN";
            button.disabled = false;
        }

        if (feedback) {
            feedback.textContent =
                "Du hast aktuell keine gespeicherten Fehler.";
            feedback.className =
                "training-feedback success";
        }

        if (errorBadge) {
            errorBadge.textContent = "0 FEHLER";
        }

        if (progress) {
            progress.style.width = "0%";
        }

        return;
    }


    const item =
        getCurrentTrainingItem();

    if (!item) return;


    if (prompt) {

        prompt.textContent =
            item[0];
    }


    if (errorBadge) {

        const count =
            state.training.errors[item[0]] || 0;

        const streak =
            state.training.streaks[item[0]] || 0;

        if (count > 0) {

            errorBadge.textContent =
                `FEHLER · ${streak}/3 RICHTIG`;

            errorBadge.classList.add("visible");

        } else {

            errorBadge.textContent = "";
            errorBadge.classList.remove("visible");
        }
    }


    if (input) {

        input.disabled = false;

        if (!state.training.answered) {
            input.value = "";
        }

        setTimeout(() => {
            if (
                document.activeElement !== input &&
                !input.disabled
            ) {
                input.focus();
            }
        }, 50);
    }


    if (button) {

        button.disabled = false;

        button.textContent =
            state.training.answered
                ? "NÄCHSTER BUCHSTABE"
                : "ANTWORT PRÜFEN";
    }


    if (feedback) {

        if (!state.training.answered) {

            feedback.textContent = "";
            feedback.className =
                "training-feedback";

        }

    }


    if (progress) {

        const percent =
            ((state.training.index + 1) /
                pool.length) * 100;

        progress.style.width =
            `${percent}%`;
    }
}


function answerTraining() {

    const pool =
        getTrainingPool();

    if (!pool.length) {
        return;
    }


    // Wenn bereits beantwortet wurde:
    // zum nächsten Buchstaben.
    if (state.training.answered) {

        nextTrainingItem();

        return;
    }


    const item =
        getCurrentTrainingItem();

    if (!item) return;


    const input =
        document.getElementById("trainingInput");

    const feedback =
        document.getElementById("trainingFeedback");

    const answer =
        normalize(input ? input.value : "");

    const correctAnswer =
        normalize(item[1]);


    if (!answer) {

        if (feedback) {

            feedback.textContent =
                "Bitte gib zuerst eine Antwort ein.";

            feedback.className =
                "training-feedback error";
        }

        if (input) {
            input.focus();
        }

        return;
    }


    state.training.attempts++;


    const isCorrect =
        answer === correctAnswer;


    if (state.training.mode === "nato") {

        state.stats.natoAttempts++;

    } else {

        state.stats.deutschAttempts++;
    }


    if (isCorrect) {

        state.training.correct++;
        state.training.score += 10;


        if (state.training.mode === "nato") {
            state.stats.natoCorrect++;
        } else {
            state.stats.deutschCorrect++;
        }


        /*
            3-MAL-REGEL

            Nur Buchstabe -> Funkwort.

            Ein Fehler wird erst gelöscht,
            wenn derselbe Fehler 3x hintereinander
            richtig beantwortet wurde.
        */

        if (
            state.training.errors[item[0]]
        ) {

            let streak =
                state.training.streaks[item[0]] || 0;

            streak++;

            state.training.streaks[item[0]] =
                streak;


            if (streak >= 3) {

                delete state.training.errors[item[0]];
                delete state.training.streaks[item[0]];

                if (feedback) {

                    feedback.textContent =
                        `RICHTIG! ${item[1]} – Fehler gelernt und entfernt.`;

                    feedback.className =
                        "training-feedback success";
                }

            } else {

                if (feedback) {

                    feedback.textContent =
                        `RICHTIG! ${streak}/3 richtige Antworten zum Entfernen des Fehlers.`;

                    feedback.className =
                        "training-feedback success";
                }
            }

        } else {

            if (feedback) {

                feedback.textContent =
                    `RICHTIG! ${item[1]}`;

                feedback.className =
                    "training-feedback success";
            }
        }


        if (input) {
            input.classList.add("correct");
        }


    } else {

        /*
            FALSCH:

            Fehler speichern.
            Streak wieder auf 0.
        */

        state.training.errors[item[0]] =
            (state.training.errors[item[0]] || 0) + 1;

        state.training.streaks[item[0]] = 0;


        if (feedback) {

            feedback.textContent =
                `FALSCH! Richtig wäre: ${item[1]}`;

            feedback.className =
                "training-feedback error";
        }


        if (input) {
            input.classList.add("wrong");
        }
    }


    state.training.answered = true;

    saveState();


    const button =
        document.getElementById("trainingAnswerBtn");

    if (button) {

        button.textContent =
            "NÄCHSTER BUCHSTABE";
    }


    renderTrainingStatsOnly();
}


function nextTrainingItem() {

    const pool =
        getTrainingPool();

    if (!pool.length) {

        state.training.answered = false;

        renderTraining();

        return;
    }


    /*
        Bei Fehlertraining kann ein Buchstabe
        nach 3 richtigen Antworten aus der Liste
        verschwunden sein.

        Deshalb Index absichern.
    */

    if (
        state.training.index >= pool.length - 1
    ) {

        state.training.index = 0;

    } else {

        state.training.index++;
    }


    state.training.answered = false;


    const input =
        document.getElementById("trainingInput");

    if (input) {

        input.value = "";

        input.classList.remove(
            "correct",
            "wrong"
        );
    }


    renderTraining();

    saveState();
}


function renderTrainingStatsOnly() {

    const score =
        document.getElementById("trainingScore");

    const correct =
        document.getElementById("trainingCorrect");

    const attempts =
        document.getElementById("trainingAttempts");


    if (score) {
        score.textContent =
            state.training.score;
    }

    if (correct) {
        correct.textContent =
            state.training.correct;
    }

    if (attempts) {
        attempts.textContent =
            state.training.attempts;
    }
}


/* =========================================================
   PRÜFUNG
   ========================================================= */

/*
    DIE PRÜFUNG IST NUR:

    BUCHSTABE -> FUNKWORT

    Es gibt KEINE Möglichkeit mehr,
    Funkwort -> Buchstabe auszuwählen.
*/


let exam = {
    mode: "nato",

    count: 10,

    index: 0,

    questions: [],

    correct: 0,

    wrong: 0,

    started: false,

    finished: false,

    answered: false,

    startTime: null,

    answers: []
};


function renderExam() {

    const setup =
        document.getElementById("examSetup");

    const area =
        document.getElementById("examArea");

    const result =
        document.getElementById("examResult");


    if (result) {
        result.style.display = "none";
    }


    if (area) {
        area.style.display =
            exam.started && !exam.finished
                ? "block"
                : "none";
    }


    if (setup) {
        setup.style.display =
            exam.started
                ? "none"
                : "block";
    }


    if (
        exam.started &&
        !exam.finished
    ) {

        renderExamQuestion();
    }
}


function startExam() {

    const modeSelect =
        document.getElementById("examMode");

    const countSelect =
        document.getElementById("examCount");


    if (modeSelect) {
        exam.mode =
            modeSelect.value || "nato";
    }


    if (countSelect) {
        exam.count =
            parseInt(
                countSelect.value,
                10
            ) || 10;
    }


    const data =
        getData(exam.mode);


    exam.questions =
        [...data]
            .sort(() => Math.random() - 0.5)
            .slice(
                0,
                Math.min(
                    exam.count,
                    data.length
                )
            );


    exam.index = 0;
    exam.correct = 0;
    exam.wrong = 0;
    exam.answers = [];

    exam.started = true;
    exam.finished = false;
    exam.answered = false;

    exam.startTime =
        Date.now();


    renderExam();
}


function renderExamQuestion() {

    const question =
        document.getElementById("examQuestion");

    const input =
        document.getElementById("examInput");

    const feedback =
        document.getElementById("examFeedback");

    const button =
        document.getElementById("examAnswerBtn");

    const progress =
        document.getElementById("examProgress");

    const counter =
        document.getElementById("examCounter");


    const item =
        exam.questions[exam.index];


    if (!item) {
        finishExam();
        return;
    }


    if (question) {
        question.textContent =
            item[0];
    }


    if (input) {

        input.value = "";
        input.disabled = false;

        input.classList.remove(
            "correct",
            "wrong"
        );

        setTimeout(() => {
            input.focus();
        }, 50);
    }


    if (feedback) {

        feedback.textContent = "";
        feedback.className =
            "exam-feedback";
    }


    if (button) {

        button.textContent =
            "ANTWORT PRÜFEN";

        button.disabled = false;
    }


    if (counter) {

        counter.textContent =
            `${exam.index + 1} / ${exam.questions.length}`;
    }


    if (progress) {

        const percent =
            (exam.index /
                exam.questions.length) * 100;

        progress.style.width =
            `${percent}%`;
    }


    exam.answered = false;
}


function answerExam() {

    if (exam.answered) {

        exam.index++;

        if (
            exam.index >=
            exam.questions.length
        ) {

            finishExam();

        } else {

            renderExamQuestion();
        }

        return;
    }


    const item =
        exam.questions[exam.index];

    if (!item) return;


    const input =
        document.getElementById("examInput");

    const feedback =
        document.getElementById("examFeedback");

    const answer =
        normalize(
            input ? input.value : ""
        );

    const correctAnswer =
        normalize(item[1]);


    if (!answer) {

        if (feedback) {

            feedback.textContent =
                "Bitte gib zuerst eine Antwort ein.";

            feedback.className =
                "exam-feedback error";
        }

        return;
    }


    const correct =
        answer === correctAnswer;


    exam.answered = true;


    if (correct) {

        exam.correct++;

        if (input) {
            input.classList.add("correct");
        }

        if (feedback) {

            feedback.textContent =
                `RICHTIG! ${item[1]}`;

            feedback.className =
                "exam-feedback success";
        }

    } else {

        exam.wrong++;

        if (input) {
            input.classList.add("wrong");
        }

        if (feedback) {

            feedback.textContent =
                `FALSCH! Richtig wäre: ${item[1]}`;

            feedback.className =
                "exam-feedback error";
        }
    }


    exam.answers.push({
        letter: item[0],
        correctAnswer: item[1],
        userAnswer: answer,
        correct
    });


    if (input) {
        input.disabled = true;
    }


    const button =
        document.getElementById("examAnswerBtn");

    if (button) {

        button.textContent =
            exam.index + 1 >= exam.questions.length
                ? "ERGEBNIS ANZEIGEN"
                : "NÄCHSTE FRAGE";
    }
}


function finishExam() {

    exam.finished = true;
    exam.started = false;


    const duration =
        exam.startTime
            ? Math.round(
                (Date.now() - exam.startTime) / 1000
            )
            : 0;


    state.stats.exams++;


    /*
        Prüfungsfehler werden ins Training
        übernommen.

        Auch hier ausschließlich
        Buchstabe -> Funkwort.
    */

    exam.answers
        .filter(answer => !answer.correct)
        .forEach(answer => {

            state.training.errors[answer.letter] =
                (state.training.errors[answer.letter] || 0) + 1;

            state.training.streaks[answer.letter] = 0;
        });


    const percent =
        exam.questions.length
            ? Math.round(
                (exam.correct /
                    exam.questions.length) * 100
            )
            : 0;


    state.stats.history.push({
        date: new Date().toISOString(),
        mode: exam.mode,
        total: exam.questions.length,
        correct: exam.correct,
        wrong: exam.wrong,
        percent,
        duration
    });


    if (
        state.stats.history.length > 30
    ) {

        state.stats.history =
            state.stats.history.slice(-30);
    }


    saveState();


    const setup =
        document.getElementById("examSetup");

    const area =
        document.getElementById("examArea");

    const result =
        document.getElementById("examResult");


    if (setup) {
        setup.style.display = "none";
    }

    if (area) {
        area.style.display = "none";
    }


    if (result) {

        result.style.display =
            "block";


        const resultPercent =
            document.getElementById(
                "examResultPercent"
            );

        const resultCorrect =
            document.getElementById(
                "examResultCorrect"
            );

        const resultWrong =
            document.getElementById(
                "examResultWrong"
            );

        const resultTime =
            document.getElementById(
                "examResultTime"
            );


        if (resultPercent) {
            resultPercent.textContent =
                `${percent}%`;
        }

        if (resultCorrect) {
            resultCorrect.textContent =
                exam.correct;
        }

        if (resultWrong) {
            resultWrong.textContent =
                exam.wrong;
        }

        if (resultTime) {
            resultTime.textContent =
                `${duration}s`;
        }
    }
}


/* =========================================================
   FEHLER LERNEN
   ========================================================= */

function startErrorTraining() {

    const errors =
        Object.keys(
            state.training.errors
        );


    if (!errors.length) {

        alert(
            "Du hast aktuell keine Fehler zum Lernen."
        );

        return;
    }


    /*
        GANZ WICHTIG:

        Fehlertraining immer
        Buchstabe -> Funkwort.
    */

    state.training.direction =
        "letter";

    state.training.source =
        "errors";

    state.training.index =
        0;

    state.training.answered =
        false;


    showPage("training");

    renderTraining();
}


/* =========================================================
   NEUES TRAINING
   ========================================================= */

function startNormalTraining() {

    state.training.source =
        "all";

    state.training.index =
        0;

    state.training.direction =
        "letter";

    state.training.answered =
        false;


    const input =
        document.getElementById(
            "trainingInput"
        );

    if (input) {
        input.value = "";
    }


    renderTraining();
}


/* =========================================================
   MODUS WECHSEL
   ========================================================= */

function changeTrainingMode(mode) {

    state.training.mode =
        mode === "deutsch"
            ? "deutsch"
            : "nato";

    state.training.index = 0;

    state.training.answered = false;

    state.training.direction =
        "letter";

    renderTraining();

    saveState();
}


/* =========================================================
   STATISTIK
   ========================================================= */

function renderStats() {

    const page =
        document.getElementById("statsPage");

    if (!page) return;


    const natoAttempts =
        document.getElementById(
            "statsNatoAttempts"
        );

    const natoCorrect =
        document.getElementById(
            "statsNatoCorrect"
        );

    const deutschAttempts =
        document.getElementById(
            "statsDeutschAttempts"
        );

    const deutschCorrect =
        document.getElementById(
            "statsDeutschCorrect"
        );

    const exams =
        document.getElementById(
            "statsExams"
        );

    const errors =
        document.getElementById(
            "statsErrors"
        );


    if (natoAttempts) {
        natoAttempts.textContent =
            state.stats.natoAttempts;
    }

    if (natoCorrect) {
        natoCorrect.textContent =
            state.stats.natoCorrect;
    }

    if (deutschAttempts) {
        deutschAttempts.textContent =
            state.stats.deutschAttempts;
    }

    if (deutschCorrect) {
        deutschCorrect.textContent =
            state.stats.deutschCorrect;
    }

    if (exams) {
        exams.textContent =
            state.stats.exams;
    }

    if (errors) {
        errors.textContent =
            Object.keys(
                state.training.errors
            ).length;
    }


    renderErrorList();
}


function renderErrorList() {

    const container =
        document.getElementById(
            "statsErrorList"
        );

    if (!container) return;


    const errorKeys =
        Object.keys(
            state.training.errors
        );


    if (!errorKeys.length) {

        container.innerHTML = `
            <div class="empty-state">
                Keine Fehler gespeichert.
            </div>
        `;

        return;
    }


    const data =
        getData(state.training.mode);


    container.innerHTML = "";


    errorKeys.forEach(letter => {

        const item =
            data.find(
                entry =>
                    entry[0] === letter
            );


        if (!item) return;


        const errorCount =
            state.training.errors[letter] || 0;

        const streak =
            state.training.streaks[letter] || 0;


        const row =
            document.createElement("div");

        row.className =
            "error-row";


        row.innerHTML = `
            <div>
                <strong>${item[0]}</strong>
                <span>${item[1]}</span>
            </div>

            <div class="error-row-right">
                <span>${errorCount} Fehler</span>
                <span>${streak}/3</span>
            </div>
        `;


        container.appendChild(row);
    });
}


/* =========================================================
   EVENT LISTENER
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadState();


        /* Navigation */

        document
            .querySelectorAll(".nav-btn")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        showPage(
                            button.dataset.page
                        );
                    }
                );
            });


        /* Alle data-page Buttons */

        document
            .querySelectorAll(
                "[data-page]"
            )
            .forEach(button => {

                if (
                    button.classList.contains(
                        "nav-btn"
                    )
                ) {
                    return;
                }


                button.addEventListener(
                    "click",
                    () => {

                        showPage(
                            button.dataset.page
                        );
                    }
                );
            });


        /* Lernen */

        document
            .querySelectorAll(
                "[data-learn-mode]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                "[data-learn-mode]"
                            )
                            .forEach(btn =>
                                btn.classList.remove(
                                    "active"
                                )
                            );


                        button.classList.add(
                            "active"
                        );


                        learnMode =
                            button.dataset.learnMode;


                        renderLearn();
                    }
                );
            });


        /* Training Mode */

        document
            .querySelectorAll(
                "[data-training-mode]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                "[data-training-mode]"
                            )
                            .forEach(btn =>
                                btn.classList.remove(
                                    "active"
                                )
                            );


                        button.classList.add(
                            "active"
                        );


                        changeTrainingMode(
                            button.dataset.trainingMode
                        );
                    }
                );
            });


        /* Training */

        const trainingButton =
            document.getElementById(
                "trainingAnswerBtn"
            );


        if (trainingButton) {

            trainingButton.addEventListener(
                "click",
                answerTraining
            );
        }


        const trainingInput =
            document.getElementById(
                "trainingInput"
            );


        if (trainingInput) {

            trainingInput.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter"
                    ) {

                        event.preventDefault();

                        answerTraining();
                    }
                }
            );
        }


        /* Neues Training */

        const normalTrainingButton =
            document.getElementById(
                "normalTrainingBtn"
            );


        if (normalTrainingButton) {

            normalTrainingButton.addEventListener(
                "click",
                startNormalTraining
            );
        }


        /* Fehler lernen */

        const errorTrainingButton =
            document.getElementById(
                "errorTrainingBtn"
            );


        if (errorTrainingButton) {

            errorTrainingButton.addEventListener(
                "click",
                startErrorTraining
            );
        }


        /* Prüfung */

        const startExamButton =
            document.getElementById(
                "startExamBtn"
            );


        if (startExamButton) {

            startExamButton.addEventListener(
                "click",
                startExam
            );
        }


        const examButton =
            document.getElementById(
                "examAnswerBtn"
            );


        if (examButton) {

            examButton.addEventListener(
                "click",
                answerExam
            );
        }


        const examInput =
            document.getElementById(
                "examInput"
            );


        if (examInput) {

            examInput.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter"
                    ) {

                        event.preventDefault();

                        answerExam();
                    }
                }
            );
        }


        /* Prüfung wiederholen */

        const repeatExam =
            document.getElementById(
                "repeatExamBtn"
            );


        if (repeatExam) {

            repeatExam.addEventListener(
                "click",
                () => {

                    exam.started = false;
                    exam.finished = false;

                    renderExam();
                }
            );
        }


        /* Fehler aus Prüfung lernen */

        const examErrorTraining =
            document.getElementById(
                "examErrorTrainingBtn"
            );


        if (examErrorTraining) {

            examErrorTraining.addEventListener(
                "click",
                startErrorTraining
            );
        }


        /* Start */

        renderLearn();
        renderTraining();
        renderExam();
        renderStats();

    }
);
