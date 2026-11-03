// Planning allowances in RUB, not live fares or booking offers.
let savedBudgets={};try{savedBudgets=JSON.parse(localStorage.getItem('unitramp-budgets-v1')||'{}')||{}}catch{}
const rub=n=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(n);
function budgetDefaults(e){
  const presets=[['США',160000,16000,5500,35000],['Великобритания',110000,15000,5000,25000],['ОАЭ',65000,11000,4000,3000],['Турция',60000,9000,3500,3000],['Индия',80000,6500,3000,12000],['Китай',55000,4500,3000,3000],['Малайзия',85000,7000,3000,3000],['Саудовская Аравия',95000,11000,4500,4000],['Япония',100000,12000,4500,10000],['Австрия',110000,14000,5000,25000]];
  const p=presets.find(p=>e.city.includes(p[0]))||['Россия',e.city.includes('Сочи')?35000:25000,e.city.includes('Москва')?5000:6500,3000,0];
  const duration=e.start?Math.round((new Date(e.end)-new Date(e.start))/86400000)+1:2;
  let ticket=5000,note='Вход: плановый резерв 5 000 ₽, тариф организатора не подтверждён.';
  if(e.name==='MALLPIC SOCHI'){ticket=25000;note='Вход: 25 000 ₽ на человека — по вашим данным от 03.11.2026.'}
  if(e.name==='РАППА ЭКСПО'||e.name==='NATMALL'){ticket=0;note='Базовый билет посетителя бесплатный по сайту организатора. Платные пакеты и дополнительные мероприятия не включены.'}
  if(e.name==='IAAPA Expo'){ticket=40000;note='План на вход: 40 000 ₽. Официальный тариф IAAPA Expo 2026 для нечленов: от 379 USD заранее, только экспозиция; итог зависит от курса, налогов и срока покупки.'}
  return {ticket,fare:p[1],hotel:p[2],nights:duration+1,days:duration+2,daily:p[3],docs:p[4],other:0,note};
}
function budget(e){
  const saved=savedBudgets[e.id];
  if(saved&&!saved._revision2){
    delete saved.reserve;
    if(e.city.includes('Китай')&&saved.hotel!==undefined)saved.hotel=Math.min(saved.hotel,4500);
    if(e.city.includes('Москва')&&saved.hotel!==undefined)saved.hotel=5000;
    saved._revision2=true;
    try{localStorage.setItem('unitramp-budgets-v1',JSON.stringify(savedBudgets))}catch{}
  }
  const b={...budgetDefaults(e),...(saved||{})};
  const base=b.ticket+b.fare+b.hotel*b.nights+b.daily*b.days+b.docs+b.other;
  return {...b,base,total:Math.round(base)}
}
function budgetBadge(e){return `<span class="budget-badge" data-budget-total="${e.id}">≈ ${rub(budget(e).total)} / чел.</span>`}
function budgetDetails(e){const b=budget(e);const fields=[['ticket','Участие / вход, ₽'],['fare','Дорога туда-обратно, ₽'],['hotel','Отдельный номер / ночь, ₽'],['nights','Ночей в отеле'],['daily','Питание и транспорт / день, ₽'],['days','Дней в поездке'],['docs','Виза, сборы и страховка, ₽'],['other','Другие расходы, ₽']];return `<section class="budget-info" data-budget-panel="${e.id}"><p class="eyebrow">ПЛАН ПОЕЗДКИ · НА ОДНОГО ЧЕЛОВЕКА</p><h3>Бюджет из Новосибирска</h3><p class="budget-assumption">Сценарная оценка для посетителя, без стенда. Перелёт и отель — плановые допущения, не проверенные предложения. По умолчанию: все дни выставки, приезд накануне и выезд на следующий день, отдельный номер.</p><div class="budget-fields">${fields.map(([key,label])=>`<label>${label}<input type="number" min="0" ${['days','nights'].includes(key)?'step="1"':'step="any"'} data-budget-id="${e.id}" data-budget-key="${key}" value="${b[key]}"></label>`).join('')}</div><p class="budget-source">${b.note} ${e.name==='IAAPA Expo'?'<a href="https://iaapa.org/expos-and-events/iaapa-expo/pricing" target="_blank" rel="noopener noreferrer">Тарифы IAAPA ↗</a>':''} ${!e.start?'Даты неизвестны: условно заложены 2 дня мероприятия.':''}</p><div class="budget-breakdown" data-budget-breakdown="${e.id}">${budgetBreakdown(b)}</div><div class="budget-total"><span>Итого / человек</span><strong data-budget-total="${e.id}">≈ ${rub(b.total)} / чел.</strong></div><p class="budget-assumption">Суммы в рублях. Виза — резерв на оформление, а не гарантия выдачи. Для США/Великобритании поездка в другую страну для подачи не заложена. Стенд, доставка оборудования и работа команды не включены. Ваши изменения сохраняются только в этом браузере.</p><button class="budget-reset" data-budget-reset="${e.id}">Вернуть исходную оценку</button></section>`}
function budgetBreakdown(b){return `<span>Участие: ${rub(b.ticket)}</span><span>Дорога: ${rub(b.fare)}</span><span>Отель: ${b.nights} × ${rub(b.hotel)} = ${rub(b.nights*b.hotel)}</span><span>Питание и транспорт: ${b.days} × ${rub(b.daily)} = ${rub(b.days*b.daily)}</span><span>Документы и страховка: ${rub(b.docs)}</span><span>Прочее: ${rub(b.other)}</span>`}
function refreshBudget(id){const e=events[id],b=budget(e);document.querySelectorAll(`[data-budget-total="${id}"]`).forEach(el=>el.textContent=`≈ ${rub(b.total)} / чел.`);document.querySelectorAll(`[data-budget-breakdown="${id}"]`).forEach(el=>el.innerHTML=budgetBreakdown(b));try{localStorage.setItem('unitramp-budgets-v1',JSON.stringify(savedBudgets))}catch{}}
document.addEventListener('input',ev=>{const el=ev.target;if(!el.matches('[data-budget-key]'))return;const id=Number(el.dataset.budgetId),key=el.dataset.budgetKey;let n=Number(el.value);if(!Number.isFinite(n)||n<0)n=0;if(key==='days'||key==='nights')n=Math.floor(n);savedBudgets[id]={...(savedBudgets[id]||{}),[key]:n};refreshBudget(id)});
document.addEventListener('click',ev=>{const el=ev.target.closest('[data-budget-reset]');if(!el)return;const id=Number(el.dataset.budgetReset);delete savedBudgets[id];const b=budget(events[id]);document.querySelectorAll(`[data-budget-id="${id}"]`).forEach(input=>input.value=b[input.dataset.budgetKey]);refreshBudget(id)});
