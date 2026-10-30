"use strict";
const $ = (selector) => document.querySelector(selector);
const homeView = $("#home-view");
const quizView = $("#quiz-view");
const resultsView = $("#results-view");
let lessons = [];
let activeLesson = null;
let currentIndex = 0;
let score = 0;
let answered = false;

const bear = $("#bear-face");
const bearStage = $("#bear-stage");
const views = [homeView, quizView, resultsView];
function showView(view) {
  views.forEach(section => section.hidden = section !== view);
  window.scrollTo({top:0,behavior:"instant"});
}
function setBear(picture, mood = "") {
  bearStage.classList.remove("happy", "oops");
  // Перезапуск анимации при следующих ответах.
  void bearStage.offsetWidth;
  bear.src = `./${picture}.webp`;
  if(mood) bearStage.classList.add(mood);
}
function safeBestScore(id) {
  try {return Number(localStorage.getItem(`english-trainer:${id}`)) || 0;} catch {return 0;}
}
function saveBestScore(id, result) {
  try {localStorage.setItem(`english-trainer:${id}`,String(Math.max(result,safeBestScore(id))));} catch {}
}
async function loadLessons() {
  try {
    const response = await fetch("./lessons.json", {cache: "no-cache"});
    if(!response.ok) throw new Error("Не удалось получить lessons.json");
    const data = await response.json();
    if(!Array.isArray(data.lessons) || data.lessons.length === 0) throw new Error("Нет уроков в JSON");
    for (const lesson of data.lessons) {
      if (!Array.isArray(lesson.questions) || lesson.questions.length === 0) throw new Error("Пустой урок в JSON");
      for (const q of lesson.questions) {
        if (!Array.isArray(q.options) || !q.options.includes(q.correct)) throw new Error("Вопрос «" + q.word + "» содержит неправильное поле correct");
      }
    }
    lessons = data.lessons;
    if (data.source_note) {$("#demo-note").textContent = "📖 " + data.source_note; $("#demo-note").hidden = false;}
    renderHome();
  } catch(error) {
    const node = document.createElement("p");
    node.textContent = `Ошибка загрузки: ${error.message}. Обнови страницу.`;
    $("#lesson-grid").replaceChildren(node);
  }
}
function renderHome() {
  $("#lesson-grid").replaceChildren();
  $("#lesson-count").textContent = `${lessons.length} урока · 10 слов`;
  lessons.forEach((lesson, index) => {
    const button = document.createElement("button");
    button.className = "lesson-tile";
    button.type = "button";
    const picture = document.createElement("img");
    picture.className = "lesson-picture";
    picture.src = `./${lesson.image === "bear-stars" ? "bear-stars" : "bear-reading"}.webp`;
    picture.alt = "Белый мишка с книжкой";
    const text = document.createElement("div");
    text.className = "lesson-tile-text";
    const number = document.createElement("div"); number.className="lesson-number"; number.textContent=`УРОК 0${index+1}`;
    const title = document.createElement("h3"); title.textContent=lesson.title;
    const desc = document.createElement("p"); desc.textContent=lesson.description;
    const bottom = document.createElement("div"); bottom.className="lesson-bottom";
    const best = safeBestScore(lesson.id);
    bottom.textContent = best ? `★ Рекорд: ${best}/${lesson.questions.length} · Начать →` : `${lesson.questions.length} вопросов · Начать →`;
    text.append(number,title,desc,bottom); button.append(picture,text);
    button.addEventListener("click", () => startLesson(lesson));
    $("#lesson-grid").append(button);
  });
}
function startLesson(lesson) {
  activeLesson = lesson;
  currentIndex = 0; score = 0; answered = false;
  $("#quiz-title").textContent = lesson.title;
  $("#quiz-category").textContent = lesson.subtitle.toUpperCase();
  showView(quizView);
  renderQuestion();
}
function renderQuestion() {
  answered = false;
  const q = activeLesson.questions[currentIndex];
  $("#scene-image").src = "./" + q.image;
  $("#scene-image").alt = q.imageAlt || "Иллюстрация слова";
  $("#quiz-counter").textContent = `${currentIndex + 1} / ${activeLesson.questions.length}`;
  $("#progress-fill").style.width = `${100 * currentIndex/activeLesson.questions.length}%`;
  $("#word").textContent = q.word;
  $("#pronunciation").textContent = q.pronunciation || "";
  $("#answers").replaceChildren();
  $("#feedback").hidden = true;
  $("#next-button").hidden = true;
  setBear("bear-reading");
  // Случайный порядок ответов, без изменения JSON.
  const options = [...q.options];
  for (let i=options.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [options[i],options[j]]=[options[j],options[i]];
  }
  options.forEach(option => {
    const button=document.createElement("button");
    button.className="answer";
    button.type="button";
    button.textContent=option;
    button.addEventListener("click",()=>checkAnswer(option));
    $("#answers").append(button);
  });
}
function checkAnswer(selected) {
  if(answered) return;
  answered=true;
  const q=activeLesson.questions[currentIndex];
  const correct=selected===q.correct;
  if(correct) score++;
  for(const button of $("#answers").children) {
    button.disabled=true;
    if(button.textContent===q.correct) button.classList.add("correct");
    else if(button.textContent===selected) button.classList.add("wrong");
    else button.classList.add("faded");
  }
  setBear(correct?"bear-hurray":"bear-oops",correct?"happy":"oops");
  $("#feedback").hidden=false;
  $("#feedback").className=`feedback ${correct?"":"incorrect"}`;
  $("#feedback-head").textContent=correct?"Ура! Правильно! 🌟":"Ничего страшного! 🐾";
  $("#feedback-text").textContent=correct?"Мишка тобой гордится!":"Правильный перевод: "+q.correct;
  $("#example-en").textContent=q.example || "";
  $("#example-ru").textContent=q.translation || "";
  $("#note").textContent=q.note || "";
  $("#progress-fill").style.width=`${100*(currentIndex+1)/activeLesson.questions.length}%`;
  $("#next-button").textContent=currentIndex===activeLesson.questions.length-1?"Посмотреть результат →":"Следующий вопрос →";
  $("#next-button").hidden=false;
}
function showResults() {
  const total=activeLesson.questions.length;
  saveBestScore(activeLesson.id,score);
  $("#result-score").textContent=`${score} из ${total}`;
  const perfect=score===total;
  const high=score>=Math.ceil(total*.7);
  $("#results-head").textContent=perfect?"Идеально! Ты звезда!":high?"Отличная работа!":"Мишка верит в тебя!";
  $("#results-subtitle").textContent=perfect?"Все ответы правильные. Так держать!":high?"Ещё немного практики — и будет 100%!":"Ошибки помогают учиться. Попробуем ещё раз?";
  $("#result-bear").src=high?"./bear-hurray.webp":"./bear-oops.webp";
  showView(resultsView);
  renderHome();
}
$("#next-button").addEventListener("click",()=>{currentIndex++; if(currentIndex<activeLesson.questions.length)renderQuestion();else showResults();});
$("#back-to-home").addEventListener("click",()=>{renderHome();showView(homeView);});
$("#to-lessons-button").addEventListener("click",()=>{renderHome();showView(homeView);});
$("#retry-button").addEventListener("click",()=>startLesson(activeLesson));
loadLessons();
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));
