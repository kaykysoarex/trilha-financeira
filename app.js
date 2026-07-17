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
    { desc: 'Mercado da semana', value: 210, owner: 'Ju', category: 'Fixo' },
    { desc: 'Gasolina', value: 90, owner: 'Kayky', category: 'Variável' }
  ],
  tasks: [
    { text: 'Registrar gasto do mercado', xp: 10, done: true, owner: 'Ju' },
    { text: 'Separar orçamento das ferramentas Urutau', xp: 10, done: false, owner: 'Kayky' },
    { text: 'Treino Muay Thai 19h', xp: 10, done: false, owner: 'Kayky' }
  ],
  badges: [
    { icon:'🎯', title:'No controle', desc:'Gastar menos da metade da meta da semana.', key:'halfBudget' },
    { icon:'🏆', title:'Lista zerada', desc:'Concluir todas as tarefas do dia.', key:'allDone' },
    { icon:'⚡', title:'Nível up', desc:'Somar 30 xp na semana.', key:'xp30' },
    { icon:'🔥', title:'Sequência forte', desc:'7 dias seguidos na trilha.', key:'streak7' }
  ],
  unlocked: {}
};
state.spent = state.expenses.reduce((s, e) => s + e.value, 0);

const dayLabels = ['seg','ter','qua','qui','sex','sáb','dom'];
const todayIndex = 4;
let taskFilter = 'Todas';

function formatBRL(n){ return 'R$ ' + n.toLocaleString('pt-BR', { maximumFractionDigits: 0 }); }

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

function render(){
  document.getElementById('streak-count-1').textContent = state.streak;

  [1, 2].forEach(n => {
    document.getElementById('spent-value-'+n).textContent = formatBRL(state.spent);
    document.getElementById('spent-sub-'+n).textContent = 'meta: ' + formatBRL(state.spentGoal);
    document.getElementById('spent-bar-'+n).style.width = Math.min(100, Math.round((state.spent/state.spentGoal)*100)) + '%';
    document.getElementById('saved-value-'+n).textContent = formatBRL(state.saved);
    document.getElementById('saved-sub-'+n).textContent = 'meta: ' + formatBRL(state.savedGoal);
    document.getElementById('saved-bar-'+n).style.width = Math.min(100, Math.round((state.saved/state.savedGoal)*100)) + '%';
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

  renderTasks();
  renderBadges();
  renderCategoryChart();
  document.getElementById('xp-total').textContent = state.xp;

  const remaining = state.budgetGoal - state.spent;
  const remainEl = document.getElementById('remaining-value');
  remainEl.textContent = formatBRL(Math.abs(remaining));
  remainEl.className = 'value ' + (remaining < 0 ? 'over' : 'ok');
  const remainSub = document.getElementById('remaining-sub');
  const remainBar = document.getElementById('remaining-bar');
  if (state.budgetGoal <= 0){
    remainSub.textContent = 'Defina uma meta de gasto pra acompanhar.';
    remainBar.style.width = '0%';
  } else if (remaining < 0){
    remainSub.textContent = 'Meta estourada em ' + formatBRL(Math.abs(remaining));
    remainBar.style.width = '100%';
    remainBar.style.background = 'var(--coral)';
  } else {
    remainSub.textContent = 'dentro da meta de ' + formatBRL(state.budgetGoal);
    remainBar.style.width = Math.min(100, Math.round((state.spent/state.budgetGoal)*100)) + '%';
    remainBar.style.background = 'var(--green)';
  }
}

function renderTasks(){
  const filtered = taskFilter === 'Todas' ? state.tasks : state.tasks.filter(t => t.owner === taskFilter);

  const list = document.getElementById('task-list');
  list.innerHTML = '';
  filtered.forEach((task) => {
    const i = state.tasks.indexOf(task);
    const row = document.createElement('div');
    row.className = 'task' + (task.done ? ' done' : '');
    row.onclick = () => toggleTask(i);
    row.innerHTML = `
      <div class="check">${task.done ? '✓' : ''}</div>
      <span class="task-owner">${task.owner}</span>
      <div class="task-text">${task.text}</div>
      <div class="task-xp">+${task.xp} xp</div>
    `;
    list.appendChild(row);
  });
  document.getElementById('task-count').textContent = filtered.filter(t=>!t.done).length + ' pendentes';

  const overviewList = document.getElementById('overview-task-list');
  overviewList.innerHTML = '';
  const pending = state.tasks.filter(t => !t.done).slice(0, 3);
  pending.forEach(task => {
    const i = state.tasks.indexOf(task);
    const row = document.createElement('div');
    row.className = 'task';
    row.onclick = () => toggleTask(i);
    row.innerHTML = `
      <div class="check"></div>
      <span class="task-owner">${task.owner}</span>
      <div class="task-text">${task.text}</div>
      <div class="task-xp">+${task.xp} xp</div>
    `;
    overviewList.appendChild(row);
  });
  document.getElementById('overview-pending').textContent = pending.length + ' de ' + state.tasks.filter(t=>!t.done).length;
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
  task.done = !task.done;
  state.xp += task.done ? task.xp : -task.xp;
  checkAchievements();
  render();
}

function addTask(){
  const input = document.getElementById('new-task');
  const owner = document.getElementById('new-task-owner').value;
  const text = input.value.trim();
  if (!text) return;
  state.tasks.push({ text, xp: 10, done: false, owner });
  input.value = '';
  render();
}

function addExpense(){
  const descInput = document.getElementById('expense-desc');
  const valueInput = document.getElementById('expense-value');
  const owner = document.getElementById('expense-owner').value;
  const category = document.getElementById('expense-category').value;
  const value = parseFloat(valueInput.value);
  const desc = descInput.value.trim() || 'Gasto sem descrição';
  if (!value || value <= 0) return;
  state.expenses.push({ desc, value, owner, category });
  state.spent += value;
  descInput.value = '';
  valueInput.value = '';
  render();
  checkAchievements();
}

function updateIncome(){
  const v = parseFloat(document.getElementById('income-value').value);
  state.income = isNaN(v) ? 0 : v;
  render();
}

function updateBudgetGoal(){
  const v = parseFloat(document.getElementById('budget-goal').value);
  state.budgetGoal = isNaN(v) ? 0 : v;
  state.spentGoal = state.budgetGoal;
  render();
}

const categoryColors = {
  'Fixo': '#2E5CE6',
  'Variável': '#B8842A',
  'Lazer': '#C4522E',
  'Investimento': '#1F8A5B',
  'Outros': '#74766C'
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
  const allDone = state.tasks.length > 0 && state.tasks.every(t => t.done);
  if (allDone && !state.unlocked.allDone){
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
  const wrap = document.getElementById('toast-wrap');
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

document.getElementById('budget-goal').value = state.budgetGoal;
document.getElementById('income-value').value = state.income || '';
render();
