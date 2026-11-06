import { RooftopScene, NPCS } from './src/scene.js';
import { STORY, PULSE_COPY } from './src/story.js';
import { AudioEngine } from './src/audio.js';

const $ = (selector) => document.querySelector(selector);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pad2 = (value) => String(value).padStart(2, '0');
const TAU = Math.PI * 2;

const dom = {
  title: $('#titleScreen'),
  start: $('#startBtn'),
  hud: $('#hud'),
  audio: $('#audioBtn'),
  clock: $('#clock'),
  clockPeriod: $('#clockPeriod'),
  objective: $('#objectiveText'),
  tags: $('#npcTags'),
  hint: $('#hintText'),
  joystick: $('#joystick'),
  knob: $('#joystickKnob'),
  action: $('#actionBtn'),
  actionLabel: $('#actionLabel'),
  context: $('#contextPrompt'),
  contextName: $('#contextName'),
  contextSub: $('#contextSub'),
  toast: $('#toast'),
  waypoint: $('#waypoint'),
  waypointName: $('#waypointName'),
  waypointDist: $('#waypointDist'),
  waypointArrow: $('.waypoint-arrow'),
  dialogue: $('#dialogue'),
  dialogueNumber: $('#dialogueNumber'),
  dialogueRole: $('#dialogueRole'),
  dialogueName: $('#dialogueName'),
  dialogueVibe: $('#dialogueVibe'),
  dialogueHeat: $('#dialogueHeat'),
  dialogueHeatBar: $('#dialogueHeatBar'),
  dialogueText: $('#dialogueText'),
  dialogueChoices: $('#dialogueChoices'),
  dialogueReaction: $('#dialogueReaction'),
  speakerName: $('#speakerName'),
  roundTag: $('#roundTag'),
  closeDialogue: $('#closeDialogue'),
  pulse: $('#pulseScreen'),
  pulseNpc: $('#pulseNpc'),
  pulseTarget: $('#pulseTarget'),
  pulseSpark: $('#pulseSpark'),
  pulseRound: $('#pulseRound'),
  pulseFeedback: $('#pulseFeedback'),
  pulseTap: $('#pulseTap'),
  pulseLeave: $('#pulseLeave'),
  beatDots: $('#beatDots'),
  pulseResult: $('#pulseResult'),
  resultKicker: $('#resultKicker'),
  resultTitle: $('#resultTitle'),
  resultCopy: $('#resultCopy'),
  resultHeat: $('#resultHeat'),
  resultBeats: $('#resultBeats'),
  resultAction: $('#resultAction'),
  resultLeave: $('#resultLeave'),
  fade: $('#fadeVeil'),
  fadeLine1: $('#fadeLine1'),
  fadeLine2: $('#fadeLine2'),
  fadeLine3: $('#fadeLine3'),
  ending: $('#endingScreen'),
  endingTitle: $('#endingTitle'),
  endingQuote: $('#endingQuote'),
  endingHeat: $('#endingHeat'),
  endingTime: $('#endingTime'),
  replay: $('#replayBtn'),
  endingTitleBtn: $('#endingTitleBtn'),
};

const audio = new AudioEngine();
const state = {
  started: false,
  sealing: false,
  minutes: 23 * 60 + 47,
  clockText: '',
  activeDialog: null,
  typeToken: 0,
  typeComplete: null,
  dialogBusy: false,
  pulse: null,
  pulseToken: 0,
  lastActionAt: 0,
  uiAccumulator: 0,
  hintOverride: '',
  tagRefs: new Map(),
  sealTimers: [],
  toastTimer: 0,
};

let scene;

function initScene() {
  try {
    scene = new RooftopScene($('#scene'));
  } catch (error) {
    console.error(error);
    const fallback = document.createElement('div');
    fallback.style.cssText = 'position:fixed;inset:0;z-index:999;display:grid;place-items:center;background:#050409;color:#f8eee4;text-align:center;padding:30px;font:14px/1.6 Helvetica,Arial,sans-serif';
    fallback.innerHTML = '<div><div style="font:italic 44px Georgia,serif;color:#ff4f78;margin-bottom:12px">Midnight Pulse</div>This rooftop needs WebGL.<br>Try a current version of Chrome, Safari, or Firefox.</div>';
    document.body.appendChild(fallback);
  }
}

function buildNpcTags() {
  for (const npc of scene.npcObjects) {
    const tag = document.createElement('div');
    tag.className = 'npc-tag';
    tag.style.setProperty('--npc-color', npc.config.color);
    tag.innerHTML = `<span class="npc-heart">♥</span><strong>${npc.config.short}</strong><small>NEW</small>`;
    tag.style.opacity = '0';
    dom.tags.appendChild(tag);
    state.tagRefs.set(npc.config.id, { element: tag, small: tag.querySelector('small') });
  }
}

function formatClock(minutes = state.minutes) {
  const normalized = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour = hour24 % 12 || 12;
  return { short: `${hour}:${pad2(minute)}`, full: `${hour}:${pad2(minute)} ${period}`, period };
}

function updateClock(addMinutes = 0) {
  if (addMinutes) state.minutes += addMinutes;
  const time = formatClock();
  dom.clock.textContent = time.short;
  if (dom.clockPeriod) dom.clockPeriod.textContent = time.period;
  state.clockText = time.full;
}

let toastTimer = 0;
function showToast(message, hot = false) {
  window.clearTimeout(toastTimer);
  dom.toast.textContent = message;
  dom.toast.classList.toggle('hot', hot);
  dom.toast.classList.add('show');
  toastTimer = window.setTimeout(() => dom.toast.classList.remove('show'), 2700);
}

function setHint(text) {
  if (state.hintOverride === text) return;
  state.hintOverride = text;
  dom.hint.textContent = text;
}

function updateHeatUI(npc) {
  if (!npc) return;
  const value = Math.round(npc.heat);
  dom.dialogueHeat.textContent = value;
  dom.dialogueHeatBar.style.width = `${clamp(npc.heat, 0, 100)}%`;
  const ref = state.tagRefs.get(npc.config.id);
  if (ref) {
    ref.small.textContent = npc.talked ? `${value}%` : 'NEW';
    ref.small.classList.toggle('npc-hot', npc.heat >= 80);
  }
  updateObjective();
}

function addHeat(npc, amount) {
  if (!npc) return;
  npc.heat = clamp(npc.heat + amount, 0, 100);
  updateHeatUI(npc);
  if (state.activeDialog === npc && amount > 0) {
    const rect = $('.heat-readout').getBoundingClientRect();
    const float = document.createElement('span');
    float.className = 'blush-float';
    float.textContent = `+${amount} heat`;
    float.style.left = `${rect.left + rect.width / 2}px`;
    float.style.top = `${rect.top}px`;
    document.body.appendChild(float);
    window.setTimeout(() => float.remove(), 1150);
  }
}

function updateObjective() {
  if (!scene) return;
  const awake = scene.npcObjects.filter((npc) => !npc.sealed);
  const ready = awake.find((npc) => npc.heat >= 80);
  if (ready) {
    dom.objective.textContent = `${ready.config.short} is waiting. Take it upstairs.`;
    return;
  }
  const nearest = scene.getNearestNpc(90);
  if (nearest) {
    dom.objective.textContent = `${nearest.npc.config.short} is ${Math.round(nearest.distance)}m away. Close the distance.`;
  } else {
    dom.objective.textContent = 'Find a spark. Follow the heat.';
  }
}

function resetRun(startImmediately = true) {
  state.sealTimers.forEach((timer) => window.clearTimeout(timer));
  state.sealTimers = [];
  state.sealing = false;
  state.minutes = 23 * 60 + 47;
  state.activeDialog = null;
  state.dialogBusy = false;
  state.pulse = null;
  state.pulseToken += 1;
  state.hintOverride = '';
  updateClock();

  for (const npc of scene.npcObjects) {
    npc.heat = 0;
    npc.stage = 0;
    npc.talked = false;
    npc.sealed = false;
    npc.invite = false;
    npc.model.visible = true;
    const ref = state.tagRefs.get(npc.config.id);
    if (ref) {
      ref.small.textContent = 'NEW';
      ref.small.classList.remove('npc-hot');
    }
  }

  dom.ending.classList.add('hidden');
  dom.ending.classList.remove('visible');
  dom.fade.classList.remove('active');
  dom.dialogue.classList.add('hidden');
  dom.pulse.classList.add('hidden');
  dom.pulseResult.classList.add('hidden');
  dom.hud.classList.add('hidden');
  dom.hud.classList.remove('story-mode');
  dom.title.classList.remove('hidden', 'is-leaving');
  dom.action.classList.add('inactive');
  dom.context.classList.add('hidden');
  scene.setMode('title');
  scene.player.position.set(0, 0, 7.2);
  scene.player.rotation.y = Math.PI;
  scene.cameraYaw = 0.14;
  scene.cameraPitch = 0.27;
  scene.cameraInitialized = false;
  scene.setJoystick(0, 0);
  state.started = false;
  if (startImmediately) window.setTimeout(startGame, 60);
}

function startGame() {
  if (state.started || !scene) return;
  state.started = true;
  dom.title.classList.add('is-leaving');
  window.setTimeout(() => dom.title.classList.add('hidden'), 760);
  dom.hud.classList.remove('hidden');
  dom.hud.classList.remove('story-mode');
  scene.setMode('play');
  scene.cameraInitialized = false;
  scene.cameraYaw = 0.14;
  scene.cameraPitch = 0.27;
  updateClock();
  updateObjective();
  audio.start().then(() => {
    audio.ui();
    audio.chime();
  }).catch(() => {});
  showToast('You are Kai. Every spark is a choice.', true);
  window.setTimeout(() => showToast('Move close, then tap the heart to charm.'), 3100);
  setHint('Find someone who looks like trouble.');
}

function leaveTitle() {
  if (!state.started) startGame();
}

function openDialogue(npc) {
  if (!npc || !state.started || npc.sealed) return;
  state.activeDialog = npc;
  state.dialogBusy = false;
  state.typeToken += 1;
  scene.setMode('dialogue', npc);
  dom.hud.classList.add('story-mode');
  dom.dialogue.classList.remove('hidden');
  dom.dialogueNumber.textContent = `SPARK ${pad2(NPCS.findIndex((entry) => entry.id === npc.config.id) + 1)}`;
  dom.dialogueRole.textContent = npc.config.role;
  dom.dialogueName.textContent = npc.config.name;
  dom.dialogueVibe.textContent = npc.config.vibe;
  dom.speakerName.textContent = npc.config.short;
  dom.dialogueReaction.textContent = '';
  dom.dialogueReaction.classList.remove('show');
  dom.dialogueChoices.innerHTML = '';
  dom.closeDialogue.style.display = '';
  npc.talked = true;
  updateHeatUI(npc);
  if (npc.stage >= 3) showAfterDialogue();
  else renderRound(npc.stage);
  audio.select();
}

function closeDialogue() {
  if (!state.activeDialog) return;
  state.typeToken += 1;
  state.activeDialog = null;
  state.dialogBusy = false;
  dom.dialogue.classList.add('hidden');
  dom.dialogueText.classList.remove('typing');
  dom.dialogueReaction.classList.remove('show');
  dom.dialogueChoices.innerHTML = '';
  dom.hud.classList.remove('story-mode');
  scene.setMode('play');
  audio.ui();
  setHint('The night is still young.');
}

function typeDialogue(text, onDone) {
  const token = ++state.typeToken;
  const element = dom.dialogueText;
  element.textContent = '';
  element.classList.add('typing');
  let index = 0;
  const complete = () => {
    if (token !== state.typeToken) return;
    element.textContent = text;
    element.classList.remove('typing');
    state.typeComplete = null;
    onDone?.();
  };
  state.typeComplete = complete;
  const step = () => {
    if (token !== state.typeToken) return;
    index += 1;
    element.textContent = text.slice(0, index);
    if (index >= text.length) {
      window.setTimeout(complete, 140);
      return;
    }
    window.setTimeout(step, 15 + Math.random() * 15);
  };
  step();
}

function finishTyping() {
  if (state.typeComplete) state.typeComplete();
}

function makeChoiceButton(choice, index, onChoose) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'choice-btn';
  button.style.setProperty('--i', String(index));
  button.innerHTML = `<span class="choice-num">${index + 1}</span><span>${choice.text}</span>`;
  button.addEventListener('click', onChoose);
  return button;
}

function renderRound(index) {
  const npc = state.activeDialog;
  if (!npc) return;
  const story = STORY[npc.config.id];
  const round = story.rounds[Math.min(index, 2)];
  npc.stage = Math.max(npc.stage, index);
  dom.dialogueRole.textContent = npc.config.role;
  dom.dialogueName.textContent = npc.config.name;
  dom.dialogueVibe.textContent = npc.config.vibe;
  dom.dialogueHeat.textContent = Math.round(npc.heat);
  dom.dialogueHeatBar.style.width = `${clamp(npc.heat, 0, 100)}%`;
  dom.speakerName.textContent = npc.config.short;
  dom.roundTag.textContent = `${pad2(index + 1)} / 03`;
  dom.dialogueReaction.classList.remove('show');
  dom.dialogueReaction.textContent = '';
  dom.dialogueChoices.innerHTML = '';
  dom.closeDialogue.style.display = '';
  typeDialogue(round.text, () => {
    dom.dialogueChoices.innerHTML = '';
    round.choices.forEach((choice, choiceIndex) => {
      dom.dialogueChoices.appendChild(makeChoiceButton(choice, choiceIndex, () => chooseDialogue(choice, choiceIndex)));
    });
  });
  updateHeatUI(npc);
}

function chooseDialogue(choice, choiceIndex) {
  const npc = state.activeDialog;
  if (!npc || state.dialogBusy) return;
  state.dialogBusy = true;
  const story = STORY[npc.config.id];
  const roundIndex = Math.min(npc.stage, 2);
  const round = story.rounds[roundIndex];
  const gain = choice.tone === 'good' ? 15 : choice.tone === 'neutral' ? 7 : 2;
  addHeat(npc, gain);
  updateClock(2);
  npc.stage = Math.max(npc.stage, roundIndex + 1);
  dom.dialogueChoices.querySelectorAll('button').forEach((button, index) => {
    button.disabled = true;
    if (index === choiceIndex) button.classList.add(`picked-${choice.tone}`);
  });
  window.setTimeout(() => {
    if (state.activeDialog !== npc) return;
    dom.dialogueChoices.innerHTML = '';
    dom.dialogueReaction.textContent = choice.reply;
    dom.dialogueReaction.classList.add('show');
    const row = document.createElement('div');
    row.className = 'continue-row';
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'btn-primary';
    next.textContent = npc.stage >= 3 ? 'Feel the pulse' : 'Keep going';
    next.addEventListener('click', () => {
      if (npc.stage >= 3) startPulse(npc);
      else renderRound(npc.stage);
    });
    row.appendChild(next);
    dom.dialogueChoices.appendChild(row);
    state.dialogBusy = false;
    audio.select();
  }, 520);
  audio.ui();
}

function showAfterDialogue() {
  const npc = state.activeDialog;
  if (!npc) return;
  const ready = npc.heat >= 80;
  dom.speakerName.textContent = npc.config.short;
  dom.roundTag.textContent = 'THE MOMENT';
  dom.dialogueReaction.classList.remove('show');
  dom.dialogueReaction.textContent = '';
  dom.dialogueChoices.innerHTML = '';
  const line = ready
    ? 'The elevator light catches her eyes. She hasn’t looked away.'
    : 'The air between you is still humming. She isn’t leaving.';
  typeDialogue(line, () => {
    const choices = [];
    if (ready) {
      choices.push({ label: 'Take them up', action: () => showInvite(npc) });
      choices.push({ label: 'Not yet', action: closeDialogue });
    } else {
      choices.push({ label: 'Follow the pulse', action: () => startPulse(npc) });
      choices.push({ label: 'Step away', action: closeDialogue });
    }
    choices.forEach((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice-btn';
      button.style.setProperty('--i', String(index));
      button.innerHTML = `<span class="choice-num">${index + 1}</span><span>${entry.label}</span>`;
      button.addEventListener('click', entry.action);
      dom.dialogueChoices.appendChild(button);
    });
  });
}

function showInvite(npc) {
  const story = STORY[npc.config.id];
  state.activeDialog = npc;
  npc.stage = 3;
  dom.speakerName.textContent = 'YOU';
  dom.roundTag.textContent = 'THE INVITATION';
  dom.dialogueReaction.classList.remove('show');
  dom.dialogueReaction.textContent = '';
  dom.dialogueChoices.innerHTML = '';
  typeDialogue(story.invite.line, () => {
    dom.dialogueReaction.textContent = story.invite.reply;
    dom.dialogueReaction.classList.add('show');
    const row = document.createElement('div');
    row.className = 'continue-row';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-primary';
    button.textContent = story.invite.button;
    button.addEventListener('click', () => sealNight(npc));
    row.appendChild(button);
    dom.dialogueChoices.appendChild(row);
  });
  audio.select();
}

/* ---------- pulse challenge ---------- */

const PULSE_ARC = 0.98;
const PULSE_CIRCUMFERENCE = 2 * Math.PI * 116;
const normalizeAngle = (value) => ((value % TAU) + TAU) % TAU;
const angleDistance = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

function applyPulseTarget(target) {
  const start = normalizeAngle(target - PULSE_ARC / 2);
  const arcLength = (PULSE_CIRCUMFERENCE * PULSE_ARC) / TAU;
  dom.pulseTarget.style.strokeDasharray = `${arcLength} ${PULSE_CIRCUMFERENCE}`;
  dom.pulseTarget.style.strokeDashoffset = `${-(PULSE_CIRCUMFERENCE * start) / TAU}`;
}

function positionPulseSpark(angle) {
  dom.pulseSpark.style.left = `${50 + Math.sin(angle) * 38.666}%`;
  dom.pulseSpark.style.top = `${50 - Math.cos(angle) * 38.666}%`;
}

function resetBeatDots() {
  dom.beatDots.querySelectorAll('i').forEach((dot) => dot.classList.remove('hit', 'miss'));
}

function startPulse(npc) {
  if (!npc) return;
  state.activeDialog = npc;
  state.pulseToken += 1;
  state.pulse = {
    npc,
    round: 0,
    hits: 0,
    angle: 0,
    target: 0,
    speed: 1.4,
    locked: false,
    running: true,
    finished: false,
    resultMode: '',
    token: state.pulseToken,
  };
  dom.dialogue.classList.add('hidden');
  dom.hud.classList.add('story-mode');
  dom.pulse.classList.remove('hidden');
  dom.pulseResult.classList.add('hidden');
  dom.pulseTap.disabled = false;
  dom.pulseNpc.textContent = npc.config.short;
  resetBeatDots();
  scene.setMode('pulse', npc);
  audio.heartbeat(1.2);
  audio.select();
  beginPulseRound(0);
}

function beginPulseRound(index) {
  const pulse = state.pulse;
  if (!pulse) return;
  pulse.round = index;
  pulse.locked = false;
  pulse.running = true;
  pulse.finished = false;
  pulse.speed = 1.34 + index * 0.13;
  let target = Math.random() * TAU;
  if (index > 0) {
    while (angleDistance(target, pulse.target) < 1.05) target = Math.random() * TAU;
  }
  pulse.target = target;
  pulse.angle = normalizeAngle(target - 1.72);
  applyPulseTarget(target);
  positionPulseSpark(pulse.angle);
  dom.pulseRound.textContent = pad2(index + 1);
  dom.pulseFeedback.textContent = STORY[pulse.npc.config.id].pulse.beats[index];
  dom.pulseTap.disabled = false;
  if (index === 0) resetBeatDots();
  updateClock(1);
  audio.tickSound();
}

function updatePulse(dt) {
  const pulse = state.pulse;
  if (!pulse || !pulse.running || pulse.locked) return;
  pulse.angle = normalizeAngle(pulse.angle + pulse.speed * dt);
  positionPulseSpark(pulse.angle);
}

function flashBeat() {
  const beat = $('#pulsePulse');
  beat.classList.remove('beat');
  void beat.offsetWidth;
  beat.classList.add('beat');
}

function tapPulse() {
  const pulse = state.pulse;
  if (!pulse || !pulse.running || pulse.locked || pulse.finished) return;
  pulse.locked = true;
  dom.pulseTap.disabled = true;
  const distance = angleDistance(pulse.angle, pulse.target);
  const perfect = distance < PULSE_ARC / 6;
  const good = distance < PULSE_ARC / 2;
  if (good) pulse.hits += 1;
  const gain = perfect ? 18 : good ? 13 : 4;
  addHeat(pulse.npc, gain);
  updateClock(1);
  flashBeat();
  const dot = dom.beatDots.children[pulse.round];
  if (dot) dot.classList.add(good ? 'hit' : 'miss');

  if (perfect) {
    dom.pulseFeedback.textContent = 'Perfect.';
  } else if (good) {
    dom.pulseFeedback.textContent = PULSE_COPY.good[pulse.round % PULSE_COPY.good.length];
  } else {
    dom.pulseFeedback.textContent = PULSE_COPY.miss[pulse.round % PULSE_COPY.miss.length];
  }

  if (good) {
    audio.hit(perfect);
    scene.celebrateNpc(pulse.npc);
  } else {
    audio.miss();
  }

  const token = pulse.token;
  window.setTimeout(() => {
    if (!state.pulse || state.pulse.token !== token) return;
    if (pulse.round < 2) beginPulseRound(pulse.round + 1);
    else finishPulse();
  }, 760);
}

function finishPulse() {
  const pulse = state.pulse;
  if (!pulse) return;
  pulse.running = false;
  pulse.finished = true;
  pulse.locked = true;
  const ready = pulse.npc.heat >= 80;
  pulse.resultMode = ready ? 'invite' : 'retry';
  dom.resultKicker.textContent = ready ? 'THE PENTHOUSE IS OPEN' : 'THE NIGHT SHIFTS';
  dom.resultTitle.textContent = ready ? 'She’s waiting.' : 'Good. But not yet.';
  dom.resultCopy.textContent = ready
    ? 'The city goes quiet. All that’s left is the elevator and the two of you.'
    : 'You feel the pull. One more moment might be all it takes.';
  dom.resultHeat.textContent = `${Math.round(pulse.npc.heat)}%`;
  dom.resultBeats.textContent = `${pulse.hits} / 3`;
  dom.resultAction.textContent = ready ? 'Take them up' : 'One more moment';
  dom.pulseResult.classList.remove('hidden');
  dom.pulseTap.disabled = true;
  if (ready) {
    audio.chime();
    scene.celebrateNpc(pulse.npc);
  } else {
    audio.heartbeat(0.8);
  }
}

function retryPulse() {
  const pulse = state.pulse;
  if (!pulse) return;
  pulse.hits = 0;
  pulse.finished = false;
  pulse.running = true;
  pulse.locked = false;
  dom.pulseResult.classList.add('hidden');
  resetBeatDots();
  beginPulseRound(0);
}

function hidePulse(nextMode = 'play') {
  state.pulseToken += 1;
  if (state.pulse) state.pulse.running = false;
  state.pulse = null;
  dom.pulse.classList.add('hidden');
  dom.pulseResult.classList.add('hidden');
  if (nextMode === 'play') {
    state.activeDialog = null;
    dom.hud.classList.remove('story-mode');
    scene.setMode('play');
  }
}

function leavePulse() {
  const wasReady = state.pulse && state.pulse.npc.heat >= 80;
  hidePulse();
  setHint('The night is still young.');
  showToast(wasReady ? 'The heat is still there. Ask them up.' : 'You step back into the night.');
  audio.ui();
}

function openInviteFromPulse() {
  const pulse = state.pulse;
  if (!pulse) return;
  const npc = pulse.npc;
  hidePulse('none');
  state.activeDialog = npc;
  scene.setMode('dialogue', npc);
  dom.hud.classList.add('story-mode');
  dom.dialogue.classList.remove('hidden');
  dom.dialogueNumber.textContent = `SPARK ${pad2(NPCS.findIndex((entry) => entry.id === npc.config.id) + 1)}`;
  dom.dialogueRole.textContent = npc.config.role;
  dom.dialogueName.textContent = npc.config.name;
  dom.dialogueVibe.textContent = npc.config.vibe;
  dom.dialogueHeat.textContent = Math.round(npc.heat);
  dom.dialogueHeatBar.style.width = `${clamp(npc.heat, 0, 100)}%`;
  dom.dialogueChoices.innerHTML = '';
  dom.dialogueReaction.classList.remove('show');
  dom.dialogueReaction.textContent = '';
  showInvite(npc);
}

/* ---------- ending ---------- */

function later(callback, delay) {
  const timer = window.setTimeout(callback, delay);
  state.sealTimers.push(timer);
  return timer;
}

function sealNight(npc) {
  if (!npc || state.sealing) return;
  state.sealing = true;
  state.pulseToken += 1;
  if (state.pulse) state.pulse.running = false;
  state.pulse = null;
  state.activeDialog = null;
  dom.dialogue.classList.add('hidden');
  dom.pulse.classList.add('hidden');
  dom.pulseResult.classList.add('hidden');
  dom.hud.classList.add('story-mode');
  dom.fadeLine1.textContent = `You take ${npc.config.short === 'NOA' ? 'Noa' : npc.config.short[0] + npc.config.short.slice(1).toLowerCase()}'s hand.`;
  dom.fadeLine2.textContent = 'The elevator hums.';
  dom.fadeLine3.textContent = 'Everything else can wait.';
  dom.fade.classList.add('active');
  scene.setMode('cinematic', npc);
  scene.celebrateNpc(npc);
  audio.whoosh();
  window.setTimeout(() => audio.chime(), 1200);
  updateClock(8);
  npc.sealed = true;
  npc.heat = Math.max(npc.heat, 80);
  updateHeatUI(npc);

  later(() => {
    dom.endingTitle.textContent = npc.config.name.split(' ')[0];
    dom.endingQuote.textContent = STORY[npc.config.id].quote;
    dom.endingHeat.textContent = `${Math.round(npc.heat)}%`;
    dom.endingTime.textContent = formatClock().full;
    dom.ending.classList.remove('hidden');
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => dom.ending.classList.add('visible'));
    });
  }, 4450);

  later(() => {
    dom.fade.classList.remove('active');
  }, 5550);

  later(() => {
    state.sealing = false;
  }, 6200);
}

/* ---------- HUD + interaction ---------- */

function doAction() {
  if (!state.started || !scene || state.sealing) return;
  if (scene.mode !== 'play') return;
  const nearest = scene.getNearestNpc(2.9);
  if (!nearest) {
    audio.ui();
    showToast('Move closer to a spark. The city can wait.');
    return;
  }
  openDialogue(nearest.npc);
}

function updateHud(dt) {
  if (!scene) return;
  state.uiAccumulator += dt;
  if (state.uiAccumulator < 0.07) return;
  state.uiAccumulator = 0;

  const playMode = state.started && scene.mode === 'play' && !state.sealing;
  const indicators = scene.getNpcIndicators();
  for (const indicator of indicators) {
    const ref = state.tagRefs.get(indicator.id);
    if (!ref) continue;
    const npc = scene.getNpc(indicator.id);
    ref.element.style.left = `${indicator.x}px`;
    ref.element.style.top = `${indicator.y}px`;
    const show = playMode && indicator.visible && !npc.sealed;
    ref.element.style.opacity = show ? '1' : '0';
    ref.element.classList.toggle('is-near', indicator.distance < 2.9);
  }

  const nearest = playMode ? scene.getNearestNpc(2.9) : null;
  if (nearest) {
    const npc = nearest.npc;
    dom.action.classList.remove('inactive');
    dom.action.classList.add('ready');
    dom.context.classList.remove('hidden');
    dom.contextName.textContent = npc.config.short;
    dom.actionLabel.textContent = npc.heat >= 80 && npc.stage >= 3 ? 'ASK UP' : 'CHARM';
    dom.contextSub.textContent = npc.heat >= 80 && npc.stage >= 3
      ? 'The elevator is waiting'
      : npc.talked
        ? `${Math.round(npc.heat)}% heat`
        : 'Tap to charm';
    setHint(`${npc.config.short} is close.`);
  } else {
    dom.action.classList.add('inactive');
    dom.action.classList.remove('ready');
    dom.context.classList.add('hidden');
    dom.actionLabel.textContent = 'CHARM';
    if (state.started && scene.mode === 'play') setHint('Choose a spark. Follow the glow.');
  }

  let closest = null;
  if (state.started) {
    for (const npc of scene.npcObjects) {
      if (npc.sealed) continue;
      const distance = Math.hypot(npc.model.position.x - scene.player.position.x, npc.model.position.z - scene.player.position.z);
      if (!closest || distance < closest.distance) closest = { npc, distance };
    }
  }
  if (playMode && closest && closest.distance > 3.0) {
    dom.waypoint.classList.remove('hidden');
    dom.waypointName.textContent = closest.npc.config.short;
    dom.waypointDist.textContent = `${Math.round(closest.distance)}m`;
    const dx = closest.npc.model.position.x - scene.player.position.x;
    const dz = closest.npc.model.position.z - scene.player.position.z;
    let angle = Math.atan2(dx, dz) - (scene.cameraYaw + Math.PI);
    angle = Math.atan2(Math.sin(angle), Math.cos(angle));
    dom.waypointArrow.style.transform = `rotate(${angle}rad)`;
  } else {
    dom.waypoint.classList.add('hidden');
  }

  if (playMode) updateObjective();
  if (state.started && scene.mode === 'play' && closest && closest.npc.heat >= 80 && closest.distance > 3) {
    dom.objective.textContent = `${closest.npc.config.short} is ready. The penthouse is waiting.`;
  }
}

/* ---------- input ---------- */

let joystickPointer = null;
function updateJoystick(event) {
  const rect = dom.joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = event.clientX - cx;
  let dy = event.clientY - cy;
  const max = rect.width * 0.33;
  const length = Math.hypot(dx, dy);
  if (length > max) {
    dx = (dx / length) * max;
    dy = (dy / length) * max;
  }
  dom.knob.style.transform = `translate(${dx}px, ${dy}px)`;
  scene?.setJoystick(dx / max, dy / max);
}

dom.joystick.addEventListener('pointerdown', (event) => {
  if (!state.started || !scene || scene.mode !== 'play') return;
  event.preventDefault();
  joystickPointer = event.pointerId;
  dom.joystick.classList.add('active');
  dom.joystick.setPointerCapture(event.pointerId);
  updateJoystick(event);
  audio.ensure();
});
dom.joystick.addEventListener('pointermove', (event) => {
  if (event.pointerId !== joystickPointer) return;
  updateJoystick(event);
});
const endJoystick = (event) => {
  if (event.pointerId !== joystickPointer) return;
  joystickPointer = null;
  dom.joystick.classList.remove('active');
  dom.knob.style.transform = 'translate(0px, 0px)';
  scene?.setJoystick(0, 0);
};
dom.joystick.addEventListener('pointerup', endJoystick);
dom.joystick.addEventListener('pointercancel', endJoystick);
dom.joystick.addEventListener('lostpointercapture', () => {
  joystickPointer = null;
  dom.joystick.classList.remove('active');
  dom.knob.style.transform = 'translate(0px, 0px)';
  scene?.setJoystick(0, 0);
});

let lookPointer = null;
let lastPointerX = 0;
let lastPointerY = 0;
function isUiTarget(target) {
  return Boolean(target.closest('button, .joystick, .overlay, .title-screen, .ending-screen, .fade-veil'));
}
$('#scene').addEventListener('pointerdown', (event) => {
  if (!state.started || !scene || scene.mode !== 'play' || isUiTarget(event.target)) return;
  lookPointer = event.pointerId;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  $('#scene').setPointerCapture?.(event.pointerId);
});
$('#scene').addEventListener('pointermove', (event) => {
  if (event.pointerId !== lookPointer) return;
  const dx = event.clientX - lastPointerX;
  const dy = event.clientY - lastPointerY;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  scene?.orbit(dx, dy);
});
const stopLook = (event) => {
  if (event.pointerId !== lookPointer) return;
  lookPointer = null;
};
$('#scene').addEventListener('pointerup', stopLook);
$('#scene').addEventListener('pointercancel', stopLook);
$('#scene').addEventListener('wheel', (event) => {
  if (!state.started || scene?.mode !== 'play') return;
  event.preventDefault();
  scene.zoom(event.deltaY);
}, { passive: false });

dom.start.addEventListener('click', startGame);
dom.title.addEventListener('click', (event) => {
  if (event.target === dom.title) leaveTitle();
});
dom.audio.addEventListener('click', async () => {
  const muted = await audio.toggle();
  dom.audio.classList.toggle('muted', muted);
  dom.audio.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
});
dom.action.addEventListener('click', doAction);
dom.closeDialogue.addEventListener('click', closeDialogue);
dom.dialogueText.addEventListener('click', finishTyping);
dom.pulseTap.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  tapPulse();
});
dom.pulseLeave.addEventListener('click', leavePulse);
dom.resultLeave.addEventListener('click', leavePulse);
dom.resultAction.addEventListener('click', () => {
  const pulse = state.pulse;
  if (!pulse) return;
  if (pulse.resultMode === 'invite') openInviteFromPulse();
  else retryPulse();
});
dom.replay.addEventListener('click', () => resetRun(true));
dom.endingTitleBtn.addEventListener('click', () => resetRun(false));

window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape') {
    if (!dom.pulse.classList.contains('hidden')) {
      leavePulse();
      return;
    }
    if (!dom.dialogue.classList.contains('hidden')) {
      closeDialogue();
      return;
    }
  }
  if (!dom.pulse.classList.contains('hidden')) {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      tapPulse();
    }
    return;
  }
  if (!dom.dialogue.classList.contains('hidden')) {
    if (['Digit1', 'Digit2', 'Digit3'].includes(event.code)) {
      const index = Number(event.code.slice(-1)) - 1;
      const button = dom.dialogueChoices.querySelectorAll('button')[index];
      if (button && !button.disabled) button.click();
      event.preventDefault();
    }
    return;
  }
  if ((event.code === 'KeyE' || event.code === 'Enter') && state.started) {
    event.preventDefault();
    doAction();
  }
});

window.addEventListener('blur', () => {
  dom.knob.style.transform = 'translate(0px, 0px)';
  scene?.setJoystick(0, 0);
});

/* ---------- boot + frame loop ---------- */

initScene();
if (scene) {
  buildNpcTags();
  updateClock();
  updateObjective();
  window.__midnight = {
    get scene() { return scene; },
    state,
    openDialogue,
    startPulse,
    doAction,
  };
}

let lastFrame = performance.now();
function frame(now) {
  window.requestAnimationFrame(frame);
  if (!scene) return;
  const dt = Math.min(0.05, Math.max(0.001, (now - lastFrame) / 1000));
  lastFrame = now;
  updatePulse(dt);
  scene.update(dt);
  updateHud(dt);
}
window.requestAnimationFrame(frame);
