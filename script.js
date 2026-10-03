/* =========================================================
   DIGITAL FUNK ACADEMY
   FUNKALPHABET TRAINER V5.0
========================================================= */


/* =========================================================
   ALPHABET DATEN
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

const STORAGE_KEY = "funkalphabet-trainer-v50";


const DEFAULT_STATE = {

    stats: {
        natoAttempts: 0,
        natoCorrect: 0,

        deutschAttempts: 0,
        deutschCorrect: 0,

        exams: 0,

        history: []
    },


    training: {

        mode: "nato",

        source: "all",

        index: 0,

        score: 0,

        correct: 0,

        attempts: 0,

        answered: false,


        /*
            WICHTIG:

            Fehler werden nach Alphabet getrennt gespeichert.

            NATO:
            errors.nato

            Deutsch:
            errors.deutsch
        */

        errors: {

            nato: {},

            deutsch: {}
        },


        /*
            Für jeden Fehler wird die
            aktuelle 3er-Serie gespeichert.
        */

        progress: {

            nato: {},

            deutsch: {}
        }
    },


    exam: {

        mode: "nato",

        count: 10,

        index: 0,

        questions: [],

        correct: 0,

        wrong: 0,

        answers: [],

        answered: false,

        startTime: null
    }
};


/* =========================================================
   HILFSFUNKTIONEN
========================================================= */

function deepClone(object) {

    return JSON.parse(
        JSON.stringify(object)
    );
}


function loadState() {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            );


        if (!saved) {

            return deepClone(DEFAULT_STATE);
        }


        const state =
            deepClone(DEFAULT_STATE);


        Object.assign(
            state.stats,
            saved.stats || {}
        );


        Object.assign(
            state.training,
            saved.training || {}
        );


        state.training.errors =
            Object.assign(
                {
                    nato: {},
                    deutsch: {}
                },
                saved.training?.errors || {}
            );


        state.training.progress =
            Object.assign(
                {
                    nato: {},
                    deutsch: {}
                },
                saved.training?.progress || {}
            );


        return state;

    } catch (error) {

        console.error(
            "Speicher konnte nicht geladen werden:",
            error
        );

        return deepClone(DEFAULT_STATE);
    }
}


let state = loadState();


function saveState() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
    );
}


function normalize(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


function getCurrentData() {

    return DATA[state.training.mode];
}


function getErrorMap(mode) {

    return state.training.errors[mode];
}


function getProgressMap(mode) {

    return state.training.progress[mode];
}


function calculateAccuracy(
    attempts,
    correct
) {

    if (!attempts) {

        return 0;
    }

    return Math.round(
        correct / attempts * 100
    );
}


function getOpenErrorCount() {

    return (
        Object.keys(
            state.training.errors.nato
        ).length

        +

        Object.keys(
            state.training.errors.deutsch
        ).length
    );
}


function escapeHTML(value) {

    return String(value)
        .replace(
            /[&<>"']/g,
            character => {

                const replacements = {

                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;"
                };

                return replacements[
                    character
                ];
            }
        );
}


/* =========================================================
   SEITENNAVIGATION
========================================================= */

function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(section => {

            section.classList.remove(
                "active"
            );
        });


    const pageID =
        page === "stats"
            ? "statsPage"
            : page;


    const target =
        document.getElementById(
            pageID
        );


    if (target) {

        target.classList.add(
            "active"
        );
    }


    document
        .querySelectorAll(
            "nav button"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page === page
            );
        });


    document
        .getElementById("mainNav")
        ?.classList.remove("open");


    if (page === "home") {

        renderHome();
    }


    if (page === "learn") {

        renderLearn();
    }


    if (page === "training") {

        renderTraining();
    }


    if (page === "stats") {

        renderStats();
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   STARTSEITE
========================================================= */

function renderHome() {

    const natoAccuracy =
        calculateAccuracy(
            state.stats.natoAttempts,
            state.stats.natoCorrect
        );


    const germanAccuracy =
        calculateAccuracy(
            state.stats.deutschAttempts,
            state.stats.deutschCorrect
        );


    document.getElementById(
        "homeNatoAccuracy"
    ).textContent =
        natoAccuracy + "%";


    document.getElementById(
        "homeGermanAccuracy"
    ).textContent =
        germanAccuracy + "%";


    document.getElementById(
        "homeErrorCount"
    ).textContent =
        getOpenErrorCount();


    document.getElementById(
        "homeExamCount"
    ).textContent =
        state.stats.exams;
}


/* =========================================================
   LERNEN
========================================================= */

let learnMode = "nato";


function renderLearn() {

    const grid =
        document.getElementById(
            "learnGrid"
        );


    if (!grid) {

        return;
    }


    document
        .querySelectorAll(
            "[data-learn-mode]"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.learnMode ===
                learnMode
            );
        });


    grid.innerHTML =
        DATA[learnMode]
            .map(
                (item, index) => {

                    return `
                        <div class="alphabet-item">

                            <div class="letter">
                                ${escapeHTML(item[0])}
                            </div>

                            <div class="word">
                                ${escapeHTML(item[1])}
                            </div>

                            <div class="number">
                                ${String(index + 1).padStart(2, "0")}
                                /
                                ${DATA[learnMode].length}
                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   TRAINING
========================================================= */

function getTrainingPool() {

    const data =
        getCurrentData();


    /*
        Normales Training:

        komplettes aktuell ausgewähltes
        Alphabet.
    */

    if (
        state.training.source ===
        "all"
    ) {

        return data;
    }


    /*
        Fehlertraining:

        NUR Fehler aus dem aktuell
        ausgewählten Alphabet.

        Dadurch kann ein NATO-Fehler
        niemals als deutscher Fehler
        erscheinen.
    */

    const errors =
        getErrorMap(
            state.training.mode
        );


    return data.filter(
        item =>
            Object.prototype.hasOwnProperty.call(
                errors,
                item[0]
            )
    );
}


function renderTraining() {

    const pool =
        getTrainingPool();


    document.getElementById(
        "trainingModeLabel"
    ).textContent =
        state.training.mode === "nato"
            ? "NATO"
            : "DEUTSCH";


    document.getElementById(
        "trainingSourceLabel"
    ).textContent =
        state.training.source === "errors"
            ? "FEHLER LERNEN"
            : "ALLE BUCHSTABEN";


    document
        .querySelectorAll(
            "[data-training-mode]"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.trainingMode ===
                state.training.mode
            );
        });


    document
        .getElementById(
            "normalTrainingBtn"
        )
        .classList.toggle(
            "active",
            state.training.source === "all"
        );


    document
        .getElementById(
            "errorTrainingBtn"
        )
        .classList.toggle(
            "active",
            state.training.source === "errors"
        );


    const badge =
        document.getElementById(
            "trainingErrorBadge"
        );


    badge.classList.toggle(
        "hidden",
        state.training.source !== "errors"
    );


    /*
        Keine Fehler vorhanden.
    */

    if (!pool.length) {

        document.getElementById(
            "trainingPrompt"
        ).textContent = "✓";


        document.getElementById(
            "trainingProgress"
        ).textContent = "0 / 0";


        const feedback =
            document.getElementById(
                "trainingFeedback"
            );


        feedback.textContent =
            "Keine offenen Fehler vorhanden.";


        feedback.className =
            "feedback good";


        document.getElementById(
            "trainingInput"
        ).value = "";


        document.getElementById(
            "trainingInput"
        ).disabled = true;


        const button =
            document.getElementById(
                "trainingAnswerBtn"
            );


        button.disabled = true;

        button.textContent =
            "KEINE FEHLER";


        return;
    }


    document.getElementById(
        "trainingInput"
    ).disabled = false;


    document.getElementById(
        "trainingAnswerBtn"
    ).disabled = false;


    if (
        state.training.index >=
        pool.length
    ) {

        state.training.index = 0;
    }


    const item =
        pool[
            state.training.index
        ];


    document.getElementById(
        "trainingPrompt"
    ).textContent =
        item[0];


    document.getElementById(
        "trainingProgress"
    ).textContent =
        `${state.training.index + 1} / ${pool.length}`;


    document.getElementById(
        "trainingScore"
    ).textContent =
        state.training.score;


    document.getElementById(
        "trainingCorrect"
    ).textContent =
        state.training.correct;


    document.getElementById(
        "trainingAttempts"
    ).textContent =
        state.training.attempts;


    document.getElementById(
        "trainingInput"
    ).value = "";


    const feedback =
        document.getElementById(
            "trainingFeedback"
        );


    feedback.textContent = "";

    feedback.className =
        "feedback";


    document.getElementById(
        "trainingAnswerBtn"
    ).textContent =
        state.training.answered
            ? "NÄCHSTER BUCHSTABE"
            : "ANTWORT SENDEN";


    setTimeout(() => {

        document
            .getElementById(
                "trainingInput"
            )
            ?.focus();

    }, 30);
}


/* =========================================================
   TRAINING ANTWORT
========================================================= */

function answerTraining() {

    const pool =
        getTrainingPool();


    if (!pool.length) {

        return;
    }


    /*
        Wenn bereits beantwortet:

        nächster Buchstabe.
    */

    if (
        state.training.answered
    ) {

        nextTraining();

        return;
    }


    const input =
        document.getElementById(
            "trainingInput"
        );


    const value =
        input.value.trim();


    if (!value) {

        return;
    }


    const item =
        pool[
            state.training.index
        ];


    const mode =
        state.training.mode;


    const errors =
        getErrorMap(mode);


    const progress =
        getProgressMap(mode);


    const correct =
        normalize(value) ===
        normalize(item[1]);


    state.training.attempts++;


    /*
        Statistik nur für das
        aktuelle Alphabet.
    */

    if (mode === "nato") {

        state.stats.natoAttempts++;

    } else {

        state.stats.deutschAttempts++;
    }


    /* ==========================================
       RICHTIG
    ========================================== */

    if (correct) {

        state.training.correct++;

        state.training.score += 10;


        if (mode === "nato") {

            state.stats.natoCorrect++;

        } else {

            state.stats.deutschCorrect++;
        }


        /*
            Ist dieser Buchstabe bereits
            ein Fehler?

            Dann gilt die 3× Regel.
        */

        if (
            Object.prototype.hasOwnProperty.call(
                errors,
                item[0]
            )
        ) {

            progress[item[0]] =
                (progress[item[0]] || 0) + 1;


            /*
                Nach 3 richtigen Antworten
                wird der Fehler entfernt.
            */

            if (
                progress[item[0]] >= 3
            ) {

                delete errors[item[0]];

                delete progress[item[0]];


                document.getElementById(
                    "trainingFeedback"
                ).textContent =
                    "✓ RICHTIG – FEHLER BEHOBEN (3/3)";

            } else {

                document.getElementById(
                    "trainingFeedback"
                ).textContent =
                    `✓ RICHTIG – FEHLERFORTSCHRITT ${progress[item[0]]}/3`;
            }

        } else {

            document.getElementById(
                "trainingFeedback"
            ).textContent =
                "✓ RICHTIG";
        }


        document.getElementById(
            "trainingFeedback"
        ).className =
            "feedback good";
    }


    /* ==========================================
       FALSCH
    ========================================== */

    else {

        /*
            Falls der Fehler noch nicht existiert,
            wird er angelegt.
        */

        if (
            !Object.prototype.hasOwnProperty.call(
                errors,
                item[0]
            )
        ) {

            errors[item[0]] = {

                wrong: 0,

                streak: 0
            };
        }


        /*
            Fehlerzahl erhöhen.
        */

        errors[item[0]].wrong =
            (errors[item[0]].wrong || 0) + 1;


        /*
            Ganz wichtig:

            Eine falsche Antwort setzt
            die 3er-Serie zurück.
        */

        errors[item[0]].streak = 0;

        progress[item[0]] = 0;


        document.getElementById(
            "trainingFeedback"
        ).textContent =
            `✕ FALSCH – richtig wäre: ${item[1]}`;


        document.getElementById(
            "trainingFeedback"
        ).className =
            "feedback bad";
    }


    state.training.answered = true;


    saveState();

    renderHome();

    renderTraining();

    renderStats();
}


/* =========================================================
   NÄCHSTER TRAININGSBUCHSTABE
========================================================= */

function nextTraining() {

    state.training.answered = false;


    const pool =
        getTrainingPool();


    if (pool.length) {

        state.training.index =
            (
                state.training.index + 1
            ) % pool.length;
    }


    saveState();

    renderTraining();
}


/* =========================================================
   TRAINING ALPHABET WECHSELN
========================================================= */

function changeTrainingMode(mode) {

    state.training.mode =
        mode;


    /*
        Beim Wechsel des Alphabets
        wird automatisch auf normales
        Training zurückgesetzt.

        Dadurch kann nicht versehentlich
        das falsche Fehleralphabet
        angezeigt werden.
    */

    state.training.source =
        "all";


    state.training.index = 0;

    state.training.answered = false;


    saveState();

    renderTraining();
}


/* =========================================================
   NORMALES TRAINING
========================================================= */

function startNormalTraining() {

    state.training.source =
        "all";


    state.training.index = 0;

    state.training.answered = false;


    saveState();

    renderTraining();
}


/* =========================================================
   FEHLERTRAINING
========================================================= */

function startErrorTraining(
    mode = state.training.mode
) {

    /*
        Das Alphabet wird ausdrücklich
        übernommen.

        Wenn die Prüfung NATO war,
        wird NATO-Fehlertraining gestartet.

        Wenn die Prüfung Deutsch war,
        wird Deutsch-Fehlertraining gestartet.
    */

    state.training.mode =
        mode;


    state.training.source =
        "errors";


    state.training.index = 0;

    state.training.answered = false;


    saveState();

    showPage("training");
}


/* =========================================================
   PRÜFUNG STARTEN
========================================================= */

function startExam() {

    const mode =
        document.getElementById(
            "examMode"
        ).value;


    const selected =
        document.getElementById(
            "examCount"
        ).value;


    let data =
        [...DATA[mode]];


    /*
        Fragen zufällig mischen.
    */

    data.sort(
        () => Math.random() - 0.5
    );


    const count =
        selected === "all"
            ? data.length
            : Math.min(
                Number(selected),
                data.length
            );


    state.exam = {

        mode: mode,

        count: count,

        index: 0,

        questions:
            data.slice(0, count),

        correct: 0,

        wrong: 0,

        answers: [],

        answered: false,

        startTime: Date.now()
    };


    document
        .getElementById(
            "examSetup"
        )
        .classList.add("hidden");


    document
        .getElementById(
            "examResult"
        )
        .classList.add("hidden");


    document
        .getElementById(
            "examArea"
        )
        .classList.remove("hidden");


    renderExamQuestion();
}


/* =========================================================
   PRÜFUNGSFRAGE
========================================================= */

function renderExamQuestion() {

    const exam =
        state.exam;


    const item =
        exam.questions[
            exam.index
        ];


    if (!item) {

        finishExam();

        return;
    }


    document.getElementById(
        "examCounter"
    ).textContent =
        `${exam.index + 1} / ${exam.count}`;


    document.getElementById(
        "examProgress"
    ).style.width =
        `${exam.index / exam.count * 100}%`;


    document.getElementById(
        "examQuestion"
    ).textContent =
        item[0];


    document.getElementById(
        "examInput"
    ).value = "";


    const feedback =
        document.getElementById(
            "examFeedback"
        );


    feedback.textContent = "";

    feedback.className =
        "feedback";


    document.getElementById(
        "examAnswerBtn"
    ).textContent =
        "ANTWORT SENDEN";


    /*
        Eventhandler wieder auf
        normale Antwort setzen.
    */

    document.getElementById(
        "examAnswerBtn"
    ).onclick =
        answerExam;


    setTimeout(() => {

        document
            .getElementById(
                "examInput"
            )
            ?.focus();

    }, 30);
}


/* =========================================================
   PRÜFUNGSANTWORT
========================================================= */

function answerExam() {

    const input =
        document.getElementById(
            "examInput"
        );


    const value =
        input.value.trim();


    if (!value) {

        return;
    }


    const exam =
        state.exam;


    const item =
        exam.questions[
            exam.index
        ];


    const correct =
        normalize(value) ===
        normalize(item[1]);


    exam.answers.push({

        letter: item[0],

        word: item[1],

        given: value,

        correct: correct
    });


    if (correct) {

        exam.correct++;


        document.getElementById(
            "examFeedback"
        ).textContent =
            "✓ RICHTIG";


        document.getElementById(
            "examFeedback"
        ).className =
            "feedback good";

    } else {

        exam.wrong++;


        document.getElementById(
            "examFeedback"
        ).textContent =
            `✕ FALSCH – richtig: ${item[1]}`;


        document.getElementById(
            "examFeedback"
        ).className =
            "feedback bad";
    }


    exam.answered = true;


    const button =
        document.getElementById(
            "examAnswerBtn"
        );


    button.textContent =
        "NÄCHSTE FRAGE";


    button.onclick =
        nextExamQuestion;


    saveState();
}


/* =========================================================
   NÄCHSTE PRÜFUNGSFRAGE
========================================================= */

function nextExamQuestion() {

    const exam =
        state.exam;


    exam.index++;

    exam.answered = false;


    if (
        exam.index >=
        exam.count
    ) {

        finishExam();

        return;
    }


    renderExamQuestion();
}


/* =========================================================
   PRÜFUNG ABSCHLIESSEN
========================================================= */

function finishExam() {

    const exam =
        state.exam;


    state.stats.exams++;


    const elapsed =
        Math.max(
            0,
            Math.floor(
                (
                    Date.now() -
                    exam.startTime
                ) / 1000
            )
        );


    /*
        Nur Fehler des geprüften
        Alphabets werden gespeichert.
    */

    const errors =
        state.training.errors[
            exam.mode
        ];


    const progress =
        state.training.progress[
            exam.mode
        ];


    exam.answers
        .filter(
            answer =>
                !answer.correct
        )
        .forEach(answer => {

            if (
                !errors[answer.letter]
            ) {

                errors[answer.letter] = {

                    wrong: 0,

                    streak: 0
                };
            }


            errors[answer.letter].wrong =
                (
                    errors[
                        answer.letter
                    ].wrong || 0
                ) + 1;


            /*
                Prüfungsfehler beginnen
                immer wieder bei 0/3.
            */

            errors[answer.letter].streak = 0;

            progress[answer.letter] = 0;
        });


    state.stats.history.push({

        date:
            new Date().toISOString(),

        mode:
            exam.mode,

        count:
            exam.count,

        correct:
            exam.correct,

        wrong:
            exam.wrong,

        time:
            elapsed
    });


    /*
        Maximal 50 Prüfungen speichern.
    */

    state.stats.history =
        state.stats.history.slice(-50);


    saveState();


    document
        .getElementById(
            "examArea"
        )
        .classList.add("hidden");


    document
        .getElementById(
            "examResult"
        )
        .classList.remove("hidden");


    document.getElementById(
        "examPercent"
    ).textContent =
        calculateAccuracy(
            exam.count,
            exam.correct
        ) + "%";


    document.getElementById(
        "examCorrect"
    ).textContent =
        exam.correct;


    document.getElementById(
        "examWrong"
    ).textContent =
        exam.wrong;


    document.getElementById(
        "examTime"
    ).textContent =
        formatTime(elapsed);


    document.getElementById(
        "examErrorTrainingBtn"
    ).disabled =
        exam.wrong === 0;


    renderHome();

    renderStats();
}


/* =========================================================
   PRÜFUNG WIEDERHOLEN
========================================================= */

function repeatExam() {

    document
        .getElementById(
            "examResult"
        )
        .classList.add("hidden");


    document
        .getElementById(
            "examSetup"
        )
        .classList.remove("hidden");
}


/* =========================================================
   ZEIT FORMATIEREN
========================================================= */

function formatTime(seconds) {

    const minutes =
        Math.floor(
            seconds / 60
        );


    const remainingSeconds =
        seconds % 60;


    return `${minutes}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}


/* =========================================================
   STATISTIK
========================================================= */

function renderProgressList(
    mode,
    targetID
) {

    const target =
        document.getElementById(
            targetID
        );


    if (!target) {

        return;
    }


    const data =
        DATA[mode];


    const attempts =
        mode === "nato"
            ? state.stats.natoAttempts
            : state.stats.deutschAttempts;


    const correct =
        mode === "nato"
            ? state.stats.natoCorrect
            : state.stats.deutschCorrect;


    const overall =
        calculateAccuracy(
            attempts,
            correct
        );


    target.innerHTML =
        data
            .map(item => {

                const error =
                    state.training.errors[
                        mode
                    ][item[0]];


                let value =
                    overall;


                let display =
                    overall + "%";


                if (error) {

                    value =
                        Math.min(
                            100,
                            (error.streak || 0)
                            * 33
                        );


                    display =
                        `${error.streak || 0}/3`;
                }


                return `
                    <div class="progress-row">

                        <span>
                            ${escapeHTML(item[0])}
                        </span>

                        <div class="progress-bar">
                            <div
                                style="width:${value}%"
                            ></div>
                        </div>

                        <span class="progress-value">
                            ${display}
                        </span>

                    </div>
                `;
            })
            .join("");
}


function renderStats() {

    document.getElementById(
        "statsNatoAttempts"
    ).textContent =
        state.stats.natoAttempts;


    document.getElementById(
        "statsNatoCorrect"
    ).textContent =
        state.stats.natoCorrect;


    document.getElementById(
        "statsDeutschAttempts"
    ).textContent =
        state.stats.deutschAttempts;


    document.getElementById(
        "statsDeutschCorrect"
    ).textContent =
        state.stats.deutschCorrect;


    document.getElementById(
        "statsExams"
    ).textContent =
        state.stats.exams;


    document.getElementById(
        "statsErrors"
    ).textContent =
        getOpenErrorCount();


    renderProgressList(
        "nato",
        "natoProgressList"
    );


    renderProgressList(
        "deutsch",
        "germanProgressList"
    );


    const list =
        document.getElementById(
            "statsErrorList"
        );


    const rows = [];


    /*
        NATO Fehler
    */

    for (
        const [
            letter,
            info
        ]
        of Object.entries(
            state.training.errors.nato
        )
    ) {

        const item =
            DATA.nato.find(
                x =>
                    x[0] === letter
            );


        rows.push(`

            <div class="error-row">

                <span class="error-letter">
                    ${escapeHTML(letter)}
                </span>

                <span>
                    ${escapeHTML(
                        item
                            ? item[1]
                            : ""
                    )}
                </span>

                <span class="error-count">
                    NATO · ${info.wrong || 0} Fehler
                </span>

                <span class="error-status">
                    ${info.streak || 0}/3
                </span>

            </div>
        `);
    }


    /*
        Deutsch Fehler
    */

    for (
        const [
            letter,
            info
        ]
        of Object.entries(
            state.training.errors.deutsch
        )
    ) {

        const item =
            DATA.deutsch.find(
                x =>
                    x[0] === letter
            );


        rows.push(`

            <div class="error-row">

                <span class="error-letter">
                    ${escapeHTML(letter)}
                </span>

                <span>
                    ${escapeHTML(
                        item
                            ? item[1]
                            : ""
                    )}
                </span>

                <span class="error-count">
                    DEUTSCH · ${info.wrong || 0} Fehler
                </span>

                <span class="error-status">
                    ${info.streak || 0}/3
                </span>

            </div>
        `);
    }


    if (!rows.length) {

        list.innerHTML =
            `
            <div class="error-empty">
                ✓ Keine offenen Fehler vorhanden.
            </div>
            `;

    } else {

        list.innerHTML =
            rows.join("");
    }
}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

    /*
        Navigation
    */

    document
        .querySelectorAll(
            "[data-page]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    showPage(
                        button.dataset.page
                    )
            );
        });


    /*
        Lernen
    */

    document
        .querySelectorAll(
            "[data-learn-mode]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    learnMode =
                        button.dataset.learnMode;

                    renderLearn();
                }
            );
        });


    /*
        Training Alphabet
    */

    document
        .querySelectorAll(
            "[data-training-mode]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    changeTrainingMode(
                        button.dataset.trainingMode
                    )
            );
        });


    /*
        Normales Training
    */

    document
        .getElementById(
            "normalTrainingBtn"
        )
        .addEventListener(
            "click",
            startNormalTraining
        );


    /*
        Fehlertraining
    */

    document
        .getElementById(
            "errorTrainingBtn"
        )
        .addEventListener(
            "click",
            () =>
                startErrorTraining()
        );


    /*
        Training Antwort
    */

    document
        .getElementById(
            "trainingAnswerBtn"
        )
        .addEventListener(
            "click",
            answerTraining
        );


    /*
        Enter im Training
    */

    document
        .getElementById(
            "trainingInput"
        )
        .addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    answerTraining();
                }
            }
        );


    /*
        Prüfung starten
    */

    document
        .getElementById(
            "startExamBtn"
        )
        .addEventListener(
            "click",
            startExam
        );


    /*
        Prüfung Antwort
    */

    document
        .getElementById(
            "examAnswerBtn"
        )
        .addEventListener(
            "click",
            answerExam
        );


    /*
        Enter in Prüfung
    */

    document
        .getElementById(
            "examInput"
        )
        .addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    if (
                        state.exam.answered
                    ) {

                        nextExamQuestion();

                    } else {

                        answerExam();
                    }
                }
            }
        );


    /*
        Prüfung wiederholen
    */

    document
        .getElementById(
            "repeatExamBtn"
        )
        .addEventListener(
            "click",
            repeatExam
        );


    /*
        Fehler aus Prüfung lernen

        WICHTIG:

        Das Alphabet der Prüfung
        wird übernommen.
    */

    document
        .getElementById(
            "examErrorTrainingBtn"
        )
        .addEventListener(
            "click",
            () => {

                if (
                    state.exam.wrong > 0
                ) {

                    startErrorTraining(
                        state.exam.mode
                    );
                }
            }
        );


    /*
        Mobile Menü
    */

    document
        .getElementById(
            "mobileMenuBtn"
        )
        .addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "mainNav"
                    )
                    .classList.toggle(
                        "open"
                    );
            }
        );
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        bindEvents();

        renderHome();

        renderLearn();

        renderTraining();

        renderStats();
    }
);
