const DATA = {
  nato: [
    ['A','Alpha'], ['B','Bravo'], ['C','Charlie'], ['D','Delta'],
    ['E','Echo'], ['F','Foxtrot'], ['G','Golf'], ['H','Hotel'],
    ['I','India'], ['J','Juliett'], ['K','Kilo'], ['L','Lima'],
    ['M','Mike'], ['N','November'], ['O','Oscar'], ['P','Papa'],
    ['Q','Quebec'], ['R','Romeo'], ['S','Sierra'], ['T','Tango'],
    ['U','Uniform'], ['V','Victor'], ['W','Whiskey'], ['X','X-ray'],
    ['Y','Yankee'], ['Z','Zulu']
  ],

  deutsch: [
    ['A','Aachen'], ['Ä','Umlaut Aachen'], ['B','Berlin'],
    ['C','Chemnitz'], ['D','Düsseldorf'], ['E','Essen'],
    ['F','Frankfurt'], ['G','Goslar'], ['H','Hamburg'],
    ['I','Ingelheim'], ['J','Jena'], ['K','Köln'],
    ['L','Leipzig'], ['M','München'], ['N','Nürnberg'],
    ['O','Offenbach'], ['Ö','Umlaut Offenbach'], ['P','Potsdam'],
    ['Q','Quickborn'], ['R','Rostock'], ['S','Salzwedel'],
    ['ß','Eszett'], ['T','Tübingen'], ['U','Unna'],
    ['Ü','Umlaut Unna'], ['V','Völklingen'], ['W','Wuppertal'],
    ['X','Xanten'], ['Y','Ypsilon'], ['Z','Zwickau']
  ]
};

const KEY = 'funkalphabet-trainer-v4';

let S = {
  training: {
    mode: 'nato',
    source: 'all',
    direction: 'letter',
    index: 0,
    score: 0,
    correct: 0,
    attempts: 0,
    solved: [],
    errors: {},
    streaks: {}
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

let learnMode = 'nato';
let learnIndex = 0;

let exam = {
  mode: 'nato',
  count: 20,
  order: 'random',
  direction: 'letter'
};

let questions = [];
let qi = 0;
let qcorrect = 0;
let qerrors = [];
let qstart = 0;
let timer = null;


// --------------------------------------------------
// HILFSFUNKTIONEN
// --------------------------------------------------

const $ = id => document.getElementById(id);

function norm(value) {
  return String(value || '')
    .normalize('NFC')
    .trim()
    .toLocaleLowerCase('de-DE')
    .replace(/\s+/g, ' ');
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(S));
}

function load() {
  try {
    const old = JSON.parse(localStorage.getItem(KEY));

    if (!old) return;

    S = {
      ...S,
      ...old,
      training: {
        ...S.training,
        ...old.training
      },
      stats: {
        ...S.stats,
        ...old.stats
      }
    };

  } catch (e) {
    console.warn('Daten konnten nicht geladen werden.', e);
  }
}

function speak(text) {
  if (!window.speechSynthesis) return;

  speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  u.rate = 0.82;

  speechSynthesis.speak(u);
}

function time(seconds) {
  return String(Math.floor(seconds / 60)).padStart(2, '0')
    + ':'
    + String(seconds % 60).padStart(2, '0');
}


// --------------------------------------------------
// SEITEN-NAVIGATION
// --------------------------------------------------

function page(name) {

  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });

  const pageId = name === 'stats' ? 'statsPage' : name;
  const target = $(pageId);

  if (!target) return;

  target.classList.add('active');

  document.querySelectorAll('.nav').forEach(button => {
    button.classList.toggle(
      'active',
      button.dataset.page === name
    );
  });

  if (name === 'learn') renderLearn();
  if (name === 'training') renderTrain();
  if (name === 'stats') renderStats();
  if (name === 'exam') summary();
}


// --------------------------------------------------
// LERNEN
// --------------------------------------------------

function renderLearn() {

  const list = DATA[learnMode];
  const current = list[learnIndex];

  if (!current) return;

  $('learnCount').textContent =
    `${learnIndex + 1} / ${list.length}`;

  $('learnLetter').textContent = current[0];
  $('learnWord').textContent = current[1];

  document.querySelectorAll('[data-learn]').forEach(button => {
    button.classList.toggle(
      'active',
      button.dataset.learn === learnMode
    );
  });

  $('learnGrid').innerHTML = list.map((item, index) => `
    <button
      class="${index === learnIndex ? 'current' : ''}"
      data-li="${index}">
      <b>${item[0]}</b>
      <small>${item[1]}</small>
    </button>
  `).join('');

  document.querySelectorAll('[data-li]').forEach(button => {

    button.onclick = () => {
      learnIndex = Number(button.dataset.li);
      renderLearn();
    };

  });
}


// --------------------------------------------------
// TRAINING
// --------------------------------------------------

function getTrainingPool() {

  const list = DATA[S.training.mode];

  if (S.training.source === 'errors') {

    const errors = list.filter(item => {
      return S.training.errors[item[0]];
    });

    return errors.length ? errors : list;
  }

  return list;
}

function renderTrain() {

  const pool = getTrainingPool();

  if (!pool.length) return;

  if (S.training.index >= pool.length) {
    S.training.index = 0;
  }

  const item = pool[S.training.index];

  const reverse = S.training.direction === 'word';

  $('prompt').textContent =
    reverse ? item[1] : item[0];

  $('trainLabel').textContent =
    reverse
      ? 'FUNKWORT EINGEGANGEN'
      : 'BUCHSTABE EINGEGANGEN';

  $('question').textContent =
    reverse
      ? 'Welcher Buchstabe gehört dazu?'
      : 'Wie lautet das Funkwort?';

  $('answer').placeholder =
    reverse
      ? 'Buchstabe eingeben …'
      : 'Funkwort eingeben …';

  $('answer').value = '';

  $('trainFeedback').className = 'feedback';

  $('trainButton').textContent =
    'PRÜFEN';

  S.training.answered = false;

  $('trainMode').textContent =
    S.training.mode === 'nato'
      ? 'NATO-ALPHABET'
      : 'DEUTSCHE BUCHSTABIERTAFEL';

  document.querySelectorAll('[data-train]').forEach(button => {
    button.classList.toggle(
      'active',
      button.dataset.train === S.training.mode
    );
  });

  document.querySelectorAll('[data-source]').forEach(button => {
    button.classList.toggle(
      'active',
      button.dataset.source === S.training.source
    );
  });

  $('direction').textContent =
    reverse
      ? 'Richtung: Funkwort → Buchstabe'
      : 'Richtung: Buchstabe → Funkwort';

  $('errorBadge').textContent =
    Object.keys(S.training.errors).length;

  renderTrainingStats();
  renderTrainingGrid();

  setTimeout(() => $('answer')?.focus(), 20);
}


// --------------------------------------------------
// TRAINING ANTWORT
// --------------------------------------------------

function answerTrain(event) {

  event.preventDefault();

  /*
   * Wenn bereits geantwortet wurde,
   * geht es mit dem nächsten Buchstaben weiter.
   *
   * Dadurch kann man auch nach einer falschen
   * Antwort problemlos weitermachen.
   */

  if (S.training.answered) {

    const pool = getTrainingPool();

    S.training.index =
      (S.training.index + 1) % pool.length;

    renderTrain();

    return;
  }

  const pool = getTrainingPool();
  const item = pool[S.training.index];

  const reverse =
    S.training.direction === 'word';

  const answer = norm($('answer').value);

  const expected =
    reverse
      ? item[0]
      : item[1];

  if (!answer) {

    showFeedback(
      $('trainFeedback'),
      'Bitte gib eine Antwort ein.',
      false
    );

    return;
  }

  S.training.attempts++;

  S.stats[
    S.training.mode + 'Attempts'
  ]++;

  if (answer === norm(expected)) {

    S.training.correct++;

    S.training.score += 10;

    S.stats[
      S.training.mode + 'Correct'
    ]++;

    /*
     * 3x richtig hintereinander:
     * Nur bei Buchstabe → Funkwort
     * wird ein Fehler entfernt.
     */

    if (
      S.training.direction === 'letter'
      && S.training.errors[item[0]]
    ) {

      if (!S.training.streaks[item[0]]) {
        S.training.streaks[item[0]] = 0;
      }

      S.training.streaks[item[0]]++;

      if (S.training.streaks[item[0]] >= 3) {

        delete S.training.errors[item[0]];
        delete S.training.streaks[item[0]];

        showFeedback(
          $('trainFeedback'),
          `✓ Richtig! ${item[0]} ist jetzt sicher gelernt.`,
          true
        );

      } else {

        showFeedback(
          $('trainFeedback'),
          `✓ Richtig! Noch ${
            3 - S.training.streaks[item[0]]
          }× richtig für "gelernt".`,
          true
        );
      }

    } else {

      showFeedback(
        $('trainFeedback'),
        `✓ Richtig! ${item[0]} = ${item[1]}`,
        true
      );
    }

    if (!S.training.solved.includes(item[0])) {
      S.training.solved.push(item[0]);
    }

  } else {

    S.training.score =
      Math.max(0, S.training.score - 2);

    /*
     * Fehler zählen und Lernserie zurücksetzen.
     */

    if (S.training.direction === 'letter') {

      S.training.errors[item[0]] =
        (S.training.errors[item[0]] || 0) + 1;

      S.training.streaks[item[0]] = 0;
    }

    showFeedback(
      $('trainFeedback'),
      `✗ Falsch. Richtig wäre: ${expected}`,
      false
    );
  }

  S.training.answered = true;

  $('trainButton').textContent =
    'NÄCHSTER BUCHSTABE';

  save();

  renderTrainingStats();
  renderTrainingGrid();
}


// --------------------------------------------------
// FEEDBACK
// --------------------------------------------------

function showFeedback(element, message, correct) {

  element.textContent = message;

  element.className =
    'feedback ' +
    (correct ? 'correct' : 'wrong');
}


// --------------------------------------------------
// TRAINING STATISTIK
// --------------------------------------------------

function renderTrainingStats() {

  const attempts = S.training.attempts;
  const correct = S.training.correct;

  const total =
    DATA[S.training.mode].length;

  $('score').textContent =
    S.training.score;

  $('correct').textContent =
    correct;

  $('attempts').textContent =
    attempts;

  $('accuracy').textContent =
    attempts
      ? Math.round(correct / attempts * 100) + '%'
      : '0%';

  $('progressText').textContent =
    `${S.training.solved.length} / ${total}`;

  $('progress').style.width =
    Math.min(
      100,
      S.training.solved.length / total * 100
    ) + '%';
}


// --------------------------------------------------
// TRAINING TABELLE
// --------------------------------------------------

function renderTrainingGrid() {

  const list = DATA[S.training.mode];

  $('alphabetGrid').innerHTML =
    list.map((item, index) => {

      const learned =
        S.training.solved.includes(item[0]);

      const error =
        Boolean(S.training.errors[item[0]]);

      const streak =
        S.training.streaks[item[0]] || 0;

      return `
        <button
          class="
            ${learned ? 'done' : ''}
            ${error ? 'has-error' : ''}
          "
          data-ti="${index}">

          <b>${item[0]}</b>

          <small>${item[1]}</small>

          ${
            error
              ? `<em>${streak}/3</em>`
              : ''
          }

        </button>
      `;
    }).join('');

  document.querySelectorAll('[data-ti]').forEach(button => {

    button.onclick = () => {

      S.training.source = 'all';

      S.training.index =
        Number(button.dataset.ti);

      S.training.answered = false;

      renderTrain();
    };

  });
}


// --------------------------------------------------
// PRÜFUNG
// --------------------------------------------------

function readExam() {

  const mode =
    document.querySelector(
      '[name=examMode]:checked'
    );

  const order =
    document.querySelector(
      '[name=examOrder]:checked'
    );

  const direction =
    document.querySelector(
      '[name=examDir]:checked'
    );

  if (mode) {
    exam.mode = mode.value;
  }

  if (order) {
    exam.order = order.value;
  }

  if (direction) {
    exam.direction = direction.value;
  }

  const custom =
    parseInt($('customCount')?.value || 0);

  if (custom > 0) {

    exam.count =
      Math.min(30, custom);

  } else {

    const button =
      document.querySelector('.num.active');

    if (button) {

      exam.count =
        button.dataset.all
          ? 'all'
          : Number(button.textContent);
    }
  }

  summary();
}

function summary() {

  const count =
    exam.count === 'all'
      ? DATA[exam.mode].length
      : exam.count;

  $('examSummary').textContent =
    `${count} Fragen · ${
      exam.mode === 'nato'
        ? 'NATO'
        : 'Deutsch'
    } · ${
      exam.order === 'random'
        ? 'Zufällig'
        : 'Alphabetisch'
    }`;
}

function startExam() {

  readExam();

  let list = [
    ...DATA[exam.mode]
  ];

  /*
   * Prüfung kann weiterhin beide Richtungen nutzen.
   * Das 3x-Fehler-System gilt jedoch ausschließlich
   * für Buchstabe → Funkwort.
   */

  if (exam.order === 'random') {
    list.sort(() => Math.random() - 0.5);
  }

  questions =
    list.slice(
      0,
      exam.count === 'all'
        ? list.length
        : exam.count
    );

  qi = 0;
  qcorrect = 0;
  qerrors = [];
  qstart = Date.now();

  $('examSetup').classList.add('hidden');
  $('examResult').classList.add('hidden');
  $('examRun').classList.remove('hidden');

  clearInterval(timer);

  timer = setInterval(() => {

    $('timer').textContent =
      time(
        Math.floor(
          (Date.now() - qstart) / 1000
        )
      );

  }, 500);

  showQuestion();
}

function showQuestion() {

  const item = questions[qi];

  const reverse =
    exam.direction === 'word';

  $('examNum').textContent =
    `FRAGE ${
      String(qi + 1).padStart(2, '0')
    } / ${questions.length}`;

  $('examBar').style.width =
    qi / questions.length * 100 + '%';

  $('examDir').textContent =
    reverse
      ? 'FUNKWORT → BUCHSTABE'
      : 'BUCHSTABE → FUNKWORT';

  $('examPrompt').textContent =
    reverse
      ? item[1]
      : item[0];

  $('examQuestion').textContent =
    reverse
      ? 'Welcher Buchstabe gehört dazu?'
      : 'Wie lautet das passende Funkwort?';

  $('examAnswer').value = '';

  $('examFeedback').className =
    'feedback';

  setTimeout(() => {
    $('examAnswer')?.focus();
  }, 20);
}

function answerExam(event) {

  event.preventDefault();

  const item = questions[qi];

  const reverse =
    exam.direction === 'word';

  const answer =
    norm($('examAnswer').value);

  const expected =
    reverse
      ? item[0]
      : item[1];

  if (!answer) {

    showFeedback(
      $('examFeedback'),
      'Bitte gib eine Antwort ein.',
      false
    );

    return;
  }

  if (answer === norm(expected)) {

    qcorrect++;

    showFeedback(
      $('examFeedback'),
      '✓ Richtig!',
      true
    );

  } else {

    qerrors.push(item);

    showFeedback(
      $('examFeedback'),
      `✗ Falsch. Richtig: ${expected}`,
      false
    );
  }

  setTimeout(() => {

    qi++;

    if (qi >= questions.length) {
      finishExam();
    } else {
      showQuestion();
    }

  }, 300);
}

function finishExam() {

  clearInterval(timer);

  const seconds =
    Math.floor(
      (Date.now() - qstart) / 1000
    );

  const percentage =
    Math.round(
      qcorrect /
      questions.length *
      100
    );

  S.stats.exams++;

  S.stats.history.unshift({

    date:
      new Date()
        .toLocaleDateString('de-DE'),

    mode:
      exam.mode === 'nato'
        ? 'NATO'
        : 'Deutsch',

    score: qcorrect,

    total: questions.length,

    pct: percentage,

    time: time(seconds)
  });

  S.stats.history =
    S.stats.history.slice(0, 10);

  /*
   * Fehler aus der Prüfung werden nur
   * für Buchstabe → Funkwort in das
   * 3x-Lernsystem übernommen.
   */

  if (exam.direction === 'letter') {

    qerrors.forEach(item => {

      S.training.errors[item[0]] =
        (S.training.errors[item[0]] || 0) + 1;

      S.training.streaks[item[0]] = 0;

    });
  }

  save();

  $('examRun').classList.add('hidden');
  $('examResult').classList.remove('hidden');

  $('resultScore').textContent =
    `${qcorrect} / ${questions.length}`;

  $('resultPercent').textContent =
    percentage + '%';

  $('resultTime').textContent =
    'Zeit: ' + time(seconds);

  $('resultBar').style.width =
    percentage + '%';

  $('resultErrors').innerHTML =
    qerrors.length

      ? qerrors.map(item => `
          <span class="error-item">
            ${item[0]} = ${item[1]}
          </span>
        `).join('')

      : '<span style="color:var(--g)">✓ Keine Fehler</span>';

  $('resultMessage').textContent =
    percentage === 100
      ? 'Perfekt. Alle Fragen richtig!'
      : percentage >= 90
        ? 'Sehr starke Leistung.'
        : percentage >= 75
          ? 'Gute Leistung. Weiter üben bringt noch mehr Sicherheit.'
          : 'Weiter üben und erneut versuchen.';
}

function resetExam() {

  clearInterval(timer);

  $('examRun').classList.add('hidden');
  $('examResult').classList.add('hidden');
  $('examSetup').classList.remove('hidden');

  summary();
}


// --------------------------------------------------
// STATISTIK
// --------------------------------------------------

function renderStats() {

  const stats = S.stats;

  const attempts =
    stats.natoAttempts +
    stats.deutschAttempts;

  const correct =
    stats.natoCorrect +
    stats.deutschCorrect;

  $('stAttempts').textContent =
    attempts;

  $('stCorrect').textContent =
    correct;

  $('stAccuracy').textContent =
    attempts
      ? Math.round(correct / attempts * 100) + '%'
      : '0%';

  $('stExams').textContent =
    stats.exams;

  const nato =
    stats.natoAttempts
      ? Math.round(
          stats.natoCorrect /
          stats.natoAttempts *
          100
        )
      : 0;

  const deutsch =
    stats.deutschAttempts
      ? Math.round(
          stats.deutschCorrect /
          stats.deutschAttempts *
          100
        )
      : 0;

  $('natoPct').textContent =
    nato + '%';

  $('dePct').textContent =
    deutsch + '%';

  $('natoBar').style.width =
    nato + '%';

  $('deBar').style.width =
    deutsch + '%';

  $('history').innerHTML =
    stats.history.length

      ? stats.history.map(item => `
          <p>
            ${item.date}
            · ${item.mode}
            · ${item.time}

            <b style="float:right">
              ${item.score}/${item.total}
              (${item.pct}%)
            </b>
          </p>
        `).join('')

      : 'Noch keine Prüfungen absolviert.';

  const errors =
    Object.keys(S.training.errors);

  $('errors').innerHTML =
    errors.length

      ? errors.map(letter => {

          const item =
            [...DATA.nato, ...DATA.deutsch]
              .find(x => x[0] === letter);

          const streak =
            S.training.streaks[letter] || 0;

          return `
            <div class="error-item">

              <b>${letter}</b>

              <small>
                ${item ? item[1] : ''}
              </small>

              <small>
                ${streak}/3 richtig
              </small>

            </div>
          `;

        }).join('')

      : `
        <span style="color:var(--muted)">
          Keine offenen Fehler.
        </span>
      `;
}


// --------------------------------------------------
// EVENTS
// --------------------------------------------------

function bind() {

  document.querySelectorAll('.nav').forEach(button => {

    button.onclick = () => {
      page(button.dataset.page);
    };

  });

  document.querySelectorAll('[data-go]').forEach(button => {

    button.onclick = () => {
      page(button.dataset.go);
    };

  });

  document.querySelectorAll('[data-learn]').forEach(button => {

    button.onclick = () => {

      learnMode =
        button.dataset.learn;

      learnIndex = 0;

      renderLearn();
    };

  });

  $('learnPrev').onclick = () => {

    learnIndex =
      (
        learnIndex -
        1 +
        DATA[learnMode].length
      ) %
      DATA[learnMode].length;

    renderLearn();
  };

  $('learnNext').onclick = () => {

    learnIndex =
      (
        learnIndex +
        1
      ) %
      DATA[learnMode].length;

    renderLearn();
  };

  $('learnSpeak').onclick = () => {

    speak(
      DATA[learnMode][learnIndex][1]
    );
  };


  // Training

  document.querySelectorAll('[data-train]').forEach(button => {

    button.onclick = () => {

      S.training.mode =
        button.dataset.train;

      S.training.index = 0;
      S.training.source = 'all';
      S.training.answered = false;

      save();

      renderTrain();
    };

  });

  document.querySelectorAll('[data-source]').forEach(button => {

    button.onclick = () => {

      S.training.source =
        button.dataset.source;

      S.training.index = 0;
      S.training.answered = false;

      renderTrain();
    };

  });

  $('direction').onclick = () => {

    S.training.direction =
      S.training.direction === 'letter'
        ? 'word'
        : 'letter';

    S.training.index = 0;
    S.training.answered = false;

    save();

    renderTrain();
  };

  $('trainForm').onsubmit =
    answerTrain;

  $('resetTraining').onclick = () => {

    S.training.score = 0;
    S.training.correct = 0;
    S.training.attempts = 0;
    S.training.solved = [];
    S.training.errors = {};
    S.training.streaks = {};
    S.training.index = 0;

    save();

    renderTrain();
  };


  // Prüfung

  document
    .querySelectorAll(
      '[name=examMode],[name=examOrder],[name=examDir]'
    )
    .forEach(input => {

      input.onchange =
        readExam;

    });

  document.querySelectorAll('.num').forEach(button => {

    button.onclick = () => {

      document
        .querySelectorAll('.num')
        .forEach(x => {
          x.classList.remove('active');
        });

      button.classList.add('active');

      if ($('customCount')) {
        $('customCount').value = '';
      }

      summary();
    };

  });

  if ($('customCount')) {

    $('customCount').oninput = () => {

      document
        .querySelectorAll('.num')
        .forEach(x => {
          x.classList.remove('active');
        });

      summary();
    };
  }

  $('startExam').onclick =
    startExam;

  $('examForm').onsubmit =
    answerExam;

  $('retry').onclick =
    resetExam;

  $('errorTraining').onclick = () => {

    S.training.mode =
      exam.mode;

    /*
     * Fehlertraining immer:
     * Buchstabe → Funkwort
     */

    S.training.direction =
      'letter';

    S.training.source =
      'errors';

    S.training.index = 0;

    save();

    page('training');
  };


  // Statistik löschen

  $('clearStats').onclick = () => {

    if (!confirm(
      'Alle Statistiken und Fehler löschen?'
    )) {
      return;
    }

    S.stats = {

      natoAttempts: 0,
      natoCorrect: 0,

      deutschAttempts: 0,
      deutschCorrect: 0,

      exams: 0,

      history: []
    };

    S.training.score = 0;
    S.training.correct = 0;
    S.training.attempts = 0;
    S.training.solved = [];
    S.training.errors = {};
    S.training.streaks = {};

    save();

    renderStats();
    renderTrain();
  };
}


// --------------------------------------------------
// START
// --------------------------------------------------

load();

bind();

renderLearn();

renderTrain();

renderStats();

summary();
