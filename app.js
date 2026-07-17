// ---- Date utilities ----
function getTodayISO(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function dateToISO(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getWeekDays(offset){
  const today = new Date();
  const dow = today.getDay();
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// ---- localStorage ----
function saveTasks(){
  localStorage.setItem('trilha-tasks', JSON.stringify(state.tasks));
}

function loadTasks(){
  try {
    const saved = localStorage.getItem('trilha-tasks');
    if (saved) state.tasks = JSON.parse(saved);
  } catch(e){}
}

// ---- State ----
const state = {
  xp: 0,
  streak: 6,
  spent: 0,
  spentGoal: 700,
  saved: 240,
  savedGoal: 500,
  income: 0,
  budgetGoal: 700,
  trailDone: [true, true, true, true, true, true, false],
  expenses: [
    { desc: 'Mercado da semana', value: 210, owner: 'Ju', category: 'Comida' },
    { desc: 'Gasolina', value: 90, owner: 'Kayky', category: 'Transporte' }
  ],
  tasks: [
    { text: 'Registrar gasto do mercado', xp: 10, done: true,  owner: 'Ju',    date: getTodayISO(), time: '08:00' },
    { text: 'Separar orçamento Urutau',   xp: 10, done: false, owner: 'Kayky', date: getTodayISO(), time: '10:00' },
    { text: 'Treino Muay Thai',           xp: 10, done: false, owner: 'Kayky', date: getTodayISO(), time: '19:00' }
  ],
  badges: [
    { icon:'🎯', title:'No controle',     desc:'Gastar menos da metade da meta da semana.', key:'halfBudget' },
    { icon:'🏆', title:'Lista zerada',    desc:'Concluir todas as tarefas do dia.',          key:'allDone'    },
    { icon:'⚡', title:'Nível up',        desc:'Somar 30 xp na semana.',                    key:'xp30'       },
    { icon:'🔥', title:'Sequência forte', desc:'7 dias seguidos na trilha.',                 key:'streak7'    }
  ],
  unlocked: {}
};
state.spent = state.expenses.reduce((s, e) => s + e.value, 0);

loadTasks();

const dayLabels  = ['seg','ter','qua','qui','sex','sáb','dom'];
const dayFull    = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
const monthLabels = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

let taskFilter   = 'Todas';
let weekOffset   = 0;
let selectedDate = getTodayISO();

function formatBRL(n){ return 'R$ ' + n.toLocaleString('pt-BR', { maximumFractionDigits: 0 }); }

// ---- Navigation ----
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    document.getElementById('page-' + item.dataset.page).classList.add('active');
  });
});

document.querySelectorAll('.owner-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.owner-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    taskFilter = tab.dataset.owner;
    renderTasks();
  });
});

// ---- Week strip ----
function changeWeek(dir){
  weekOffset += dir;
  renderDayStrip();
  renderTasks();
}

function selectDay(iso){
  selectedDate = iso;
  renderDayStrip();
  renderTasks();
}

function renderDayStrip(){
  const days  = getWeekDays(weekOffset);
  const today = getTodayISO();

  const first = days[0], last = days[6];
  document.getElementById('week-range-label').textContent =
    `${first.getDate()} – ${last.getDate()} ${monthLabels[last.getMonth()]}`;

  const strip = document.getElementById('day-strip');
  strip.innerHTML = '';
  days.forEach((d, i) => {
    const iso        = dateToISO(d);
    const hasTasks   = state.tasks.some(t => t.date === iso);
    const isToday    = iso === today;
    const isSelected = iso === selectedDate;

    const btn = document.createElement('div');
    btn.className = 'day-btn' +
      (isSelected ? ' selected' : '') +
      (isToday    ? ' today'    : '');
    btn.onclick = () => selectDay(iso);
    btn.innerHTML = `
      <span class="day-name">${dayLabels[i]}</span>
      <span class="day-num">${d.getDate()}</span>
      <span class="day-dot${hasTasks ? '' : ' hidden'}"></span>
    `;
    strip.appendChild(btn);
  });
}

// ---- Render ----
function render(){
  document.getElementById('streak-count-1').textContent = state.streak;

  [1, 2].forEach(n => {
    document.getElementById('spent-value-'+n).textContent = formatBRL(state.spent);
    document.getElementById('spent-sub-'+n).textContent   = 'meta: ' + formatBRL(state.spentGoal);
    document.getElementById('spent-bar-'+n).style.width   = Math.min(100, Math.round((state.spent/state.spentGoal)*100)) + '%';
    document.getElementById('saved-value-'+n).textContent = formatBRL(state.saved);
    document.getElementById('saved-sub-'+n).textContent   = 'meta: ' + formatBRL(state.savedGoal);
    document.getElementById('saved-bar-'+n).style.width   = Math.min(100, Math.round((state.saved/state.savedGoal)*100)) + '%';
  });

  const trail = document.getElementById('trail');
  trail.innerHTML = '';
  let doneCount = 0;
  state.trailDone.forEach((done, i) => {
    if (done) doneCount++;
    const day = document.createElement('div');
    day.className = 'trail-day';
    day.innerHTML = `
      <div class="trail-dot ${done ? 'done' : ''} ${i===todayIndex && !done ? 'today' : ''}">${done ? '✓' : (i+1)}</div>
      <div class="trail-label">${dayLabels[i]}</div>
    `;
    trail.appendChild(day);
  });
  document.getElementById('trail-count').textContent = doneCount + '/7 dias em dia';

  const expList = document.getElementById('expense-list');
  expList.innerHTML = '';
  [...state.expenses].reverse().forEach(e => {
    const row = document.createElement('div');
    row.className = 'task';
    row.style.cursor = 'default';
    row.innerHTML = `
      <span class="task-owner">${e.owner}</span>
      <div class="task-text">${e.desc}</div>
      <div class="task-xp" style="color:var(--coral)">${formatBRL(e.value)}</div>
    `;
    expList.appendChild(row);
  });

  renderDayStrip();
  renderTasks();
  renderBadges();
  renderCategoryChart();
  document.getElementById('xp-total').textContent = state.xp;

  const remaining = state.budgetGoal - state.spent;
  const remainEl  = document.getElementById('remaining-value');
  remainEl.textContent = formatBRL(Math.abs(remaining));
  remainEl.className   = 'value ' + (remaining < 0 ? 'over' : 'ok');
  const remainSub = document.getElementById('remaining-sub');
  const remainBar = document.getElementById('remaining-bar');
  if (state.budgetGoal <= 0){
    remainSub.textContent    = 'Defina uma meta de gasto pra acompanhar.';
    remainBar.style.width    = '0%';
  } else if (remaining < 0){
    remainSub.textContent    = 'Meta estourada em ' + formatBRL(Math.abs(remaining));
    remainBar.style.width    = '100%';
    remainBar.style.background = 'var(--coral)';
  } else {
    remainSub.textContent    = 'dentro da meta de ' + formatBRL(state.budgetGoal);
    remainBar.style.width    = Math.min(100, Math.round((state.spent/state.budgetGoal)*100)) + '%';
    remainBar.style.background = 'var(--green)';
  }
}

function renderTasks(){
  const today    = getTodayISO();
  const dayTasks = state.tasks.filter(t => t.date === selectedDate);
  const filtered = taskFilter === 'Todas' ? dayTasks : dayTasks.filter(t => t.owner === taskFilter);
  filtered.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

  // Dynamic section title
  const selD   = new Date(selectedDate + 'T12:00:00');
  const label  = selectedDate === today
    ? 'Hoje'
    : dayFull[selD.getDay()].charAt(0).toUpperCase() + dayFull[selD.getDay()].slice(1);
  document.getElementById('task-day-title').innerHTML =
    `${label}, ${selD.getDate()} ${monthLabels[selD.getMonth()]} <span class="count" id="task-count"></span>`;

  const list = document.getElementById('task-list');
  list.innerHTML = '';
  filtered.forEach(task => {
    const i   = state.tasks.indexOf(task);
    const row = document.createElement('div');
    row.className = 'task' + (task.done ? ' done' : '');
    row.onclick   = () => toggleTask(i);
    row.innerHTML = `
      <div class="check">${task.done ? '✓' : ''}</div>
      ${task.time ? `<span class="task-time">${task.time}</span>` : ''}
      <span class="task-owner">${task.owner}</span>
      <div class="task-text">${task.text}</div>
      <div class="task-xp">+${task.xp} xp</div>
    `;
    list.appendChild(row);
  });
  document.getElementById('task-count').textContent =
    filtered.filter(t => !t.done).length + ' pendentes';

  // Overview: tarefas de hoje pendentes
  const overviewList = document.getElementById('overview-task-list');
  overviewList.innerHTML = '';
  const pending = state.tasks.filter(t => t.date === today && !t.done).slice(0, 3);
  pending.forEach(task => {
    const i   = state.tasks.indexOf(task);
    const row = document.createElement('div');
    row.className = 'task';
    row.onclick   = () => toggleTask(i);
    row.innerHTML = `
      <div class="check"></div>
      ${task.time ? `<span class="task-time">${task.time}</span>` : ''}
      <span class="task-owner">${task.owner}</span>
      <div class="task-text">${task.text}</div>
      <div class="task-xp">+${task.xp} xp</div>
    `;
    overviewList.appendChild(row);
  });
  const allPending = state.tasks.filter(t => t.date === today && !t.done);
  document.getElementById('overview-pending').textContent =
    pending.length + ' de ' + allPending.length;
}

function renderBadges(){
  const grid = document.getElementById('badge-grid');
  grid.innerHTML = '';
  state.badges.forEach(b => {
    const on = !!state.unlocked[b.key];
    const el = document.createElement('div');
    el.className = 'badge' + (on ? '' : ' locked');
    el.innerHTML = `
      <div class="badge-icon">${b.icon}</div>
      <div>
        <div class="badge-title">${b.title}</div>
        <div class="badge-desc">${b.desc}</div>
      </div>
    `;
    grid.appendChild(el);
  });
}

function toggleTask(i){
  const task = state.tasks[i];
  task.done  = !task.done;
  state.xp  += task.done ? task.xp : -task.xp;
  saveTasks();
  checkAchievements();
  render();
}

function addTask(){
  const input = document.getElementById('new-task');
  const owner = document.getElementById('new-task-owner').value;
  const time  = document.getElementById('new-task-time').value;
  const text  = input.value.trim();
  if (!text) return;
  state.tasks.push({ text, xp: 10, done: false, owner, date: selectedDate, time });
  input.value = '';
  saveTasks();
  renderDayStrip();
  renderTasks();
}

function addExpense(){
  const descInput  = document.getElementById('expense-desc');
  const valueInput = document.getElementById('expense-value');
  const owner      = document.getElementById('expense-owner').value;
  const category   = document.getElementById('expense-category').value;
  const value      = parseFloat(valueInput.value);
  const desc       = descInput.value.trim() || 'Gasto sem descrição';
  if (!value || value <= 0) return;
  state.expenses.push({ desc, value, owner, category });
  state.spent     += value;
  descInput.value  = '';
  valueInput.value = '';
  render();
  checkAchievements();
}

function updateIncome(){
  const v      = parseFloat(document.getElementById('income-value').value);
  state.income = isNaN(v) ? 0 : v;
  render();
}

function updateBudgetGoal(){
  const v         = parseFloat(document.getElementById('budget-goal').value);
  state.budgetGoal = isNaN(v) ? 0 : v;
  state.spentGoal  = state.budgetGoal;
  render();
}

const categoryKeywords = {
  'Comida':       ['mercado', 'supermercado', 'restaurante', 'lanche', 'almoço', 'jantar', 'café', 'pizza', 'hamburguer', 'hambúrguer', 'comida', 'padaria', 'açougue', 'feira', 'delivery', 'ifood', 'refeição', 'churrasco', 'sushi', 'lanchonete', 'sorveteria', 'hortifruti', 'marmita', 'burguer'],
  'Transporte':   ['gasolina', 'combustível', 'combustivel', 'uber', 'ônibus', 'onibus', 'metrô', 'metro', 'táxi', 'taxi', '99', 'estacionamento', 'pedágio', 'pedagio', 'passagem', 'bicicleta', 'moto', 'carro', 'abastecimento'],
  'Lazer':        ['cinema', 'show', 'teatro', 'viagem', 'hotel', 'passeio', 'netflix', 'spotify', 'jogo', 'game', 'parque', 'bar', 'balada', 'festa', 'streaming', 'disney', 'youtube', 'prime', 'ingresso', 'diversão', 'diversao'],
  'Saúde':        ['farmácia', 'farmacia', 'remédio', 'remedio', 'médico', 'medico', 'consulta', 'exame', 'hospital', 'academia', 'dentista', 'plano', 'vitamina', 'suplemento', 'fisioterapia', 'psicólogo', 'psicologo'],
  'Comércio':     ['loja', 'roupa', 'sapato', 'tênis', 'tenis', 'shopping', 'magazine', 'americanas', 'amazon', 'shopee', 'aliexpress', 'eletrônico', 'eletronico', 'celular', 'notebook', 'compras', 'mercadinha'],
  'Fixo':         ['aluguel', 'internet', 'água', 'agua', 'luz', 'energia', 'gás', 'gas', 'condomínio', 'condominio', 'mensalidade', 'conta', 'boleto', 'seguro', 'iptu', 'ipva'],
  'Investimento': ['investimento', 'poupança', 'poupanca', 'ações', 'acoes', 'fundo', 'tesouro', 'cripto', 'bitcoin', 'corretora', 'aporte'],
};

function autoDetectCategory(){
  const desc   = document.getElementById('expense-desc').value.toLowerCase();
  const select = document.getElementById('expense-category');
  for (const [cat, keywords] of Object.entries(categoryKeywords)){
    if (keywords.some(k => desc.includes(k))){
      select.value = cat;
      select.style.borderColor = 'var(--blue)';
      setTimeout(() => { select.style.borderColor = ''; }, 800);
      return;
    }
  }
  select.value = 'Outros';
}

const categoryColors = {
  'Comida':       '#E8854A',
  'Transporte':   '#2E5CE6',
  'Lazer':        '#C4522E',
  'Saúde':        '#1F8A5B',
  'Comércio':     '#7C3AED',
  'Fixo':         '#4A7FA5',
  'Investimento': '#B8842A',
  'Outros':       '#74766C'
};
let categoryChart = null;

function renderCategoryChart(){
  const totals = {};
  state.expenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.value; });
  const labels = Object.keys(totals);
  const values = Object.values(totals);
  const colors = labels.map(l => categoryColors[l] || '#999');

  const legend = document.getElementById('category-legend');
  legend.innerHTML = '';
  if (labels.length === 0){
    legend.innerHTML = '<div class="sub">Nenhum gasto registrado ainda.</div>';
  } else {
    const total = values.reduce((a, b) => a + b, 0);
    labels.forEach((l, i) => {
      const pct = Math.round((values[i]/total)*100);
      const row = document.createElement('div');
      row.className = 'legend-row';
      row.innerHTML = `
        <span class="legend-dot" style="background:${colors[i]}"></span>
        <span class="legend-cat">${l}</span>
        <span class="legend-value">${formatBRL(values[i])} · ${pct}%</span>
      `;
      legend.appendChild(row);
    });
  }

  const ctx = document.getElementById('category-chart');
  if (categoryChart) categoryChart.destroy();
  if (labels.length === 0) return;
  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#FFFFFF' }]
    },
    options: {
      plugins: { legend: { display: false } },
      cutout: '62%'
    }
  });
}

function checkAchievements(){
  const spentPct = state.spent / state.spentGoal;
  if (spentPct < 0.5 && state.spent > 0 && !state.unlocked.halfBudget){
    unlock('halfBudget', '🎯', 'No controle', 'Gastou menos da metade da meta da semana.');
  }
  const today    = getTodayISO();
  const todayAll = state.tasks.filter(t => t.date === today);
  if (todayAll.length > 0 && todayAll.every(t => t.done) && !state.unlocked.allDone){
    unlock('allDone', '🏆', 'Lista zerada', 'Todas as tarefas de hoje concluídas.');
  }
  if (state.xp >= 30 && !state.unlocked.xp30){
    unlock('xp30', '⚡', 'Nível up', 'Vocês já somam 30 xp na semana.');
  }
}

function unlock(key, icon, title, body){
  state.unlocked[key] = true;
  showToast(icon, title, body);
}

function showToast(icon, title, body){
  const wrap  = document.getElementById('toast-wrap');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-head"><span>${icon}</span><span class="toast-title">${title}</span></div>
    <div class="toast-body">${body}</div>
  `;
  wrap.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 300);
  }, 3800);
}

document.getElementById('budget-goal').value  = state.budgetGoal;
document.getElementById('income-value').value = state.income || '';
render();
