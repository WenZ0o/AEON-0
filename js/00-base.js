'use strict';

  const STARTING_CAPITAL = 150;
  let equity = STARTING_CAPITAL;
  let wins = 0;
  let losses = 0;
  let tradeId = 0;
  let sessionStart = performance.now();
  let executing = false;
  let currentDecisionStage = -1;
  let lastTradeFlash = 0;

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const random = (a, b) => a + Math.random() * (b - a);
  const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];
  let nextTradeAt = performance.now() + random(4200, 7200);
  const money = (v) => '$' + Math.abs(v).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});

  function normalRandom(){
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
