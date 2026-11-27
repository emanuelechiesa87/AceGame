import { BASIC_ATTACK, GUARD } from '../../data/abilities';
import { BALANCE } from '../../data/balance';
import { COMPANION_BY_ID } from '../../data/companions';
import { ENEMY_BY_ID } from '../../data/enemies';
import type { Ability, AffixId, Effect, StatusId } from '../../types/content';
import type { Rng } from '../Rng';
import type { BattleEvent, BattleTally, BattleMods, DamageKind, EnemyScale, Phase, PlayerAction, Side, StatusInstance, Unit } from './types';

const C = BALANCE.combat;
const NEGATIVE: StatusId[] = ['burn', 'poison', 'stun', 'vulnerable', 'slow', 'weak', 'acid', 'bubble', 'mine'];
/** Stati che scadono alla fine del turno di chi li porta. */
const TIMED: StatusId[] = ['atkUp', 'vulnerable', 'shield', 'defUp', 'evade', 'slow', 'reflect', 'weak', 'twin', 'taunt'];
/** Stati che durano finché non vengono consumati (non scadono a fine turno). */
const KEPT: StatusId[] = ['guard', 'stun', 'burn', 'poison', 'acid', 'bubble', 'mine', 'swarm', 'immune'];
export const AFFIXES: AffixId[] = ['armored', 'swift', 'vampire', 'spiky', 'regen', 'commander'];
const AF = BALANCE.enemies.affix;
const hasAffix = (u: Unit, a: AffixId) => !!u.affixes?.includes(a);

export interface BattleSetup {
  hero: Unit;
  companions: Unit[];
  enemies: Unit[];
  powers: Ability[];
  potions: number;
  mods: BattleMods;
}

/**
 * Motore di combattimento a turni, indipendente dal rendering.
 * - Ordine per VEL (pareggi: alleati prima, poi ordine di ingresso).
 * - Il protagonista attende input; compagni e nemici agiscono da soli.
 * - Le speciali dei compagni sono azioni gratuite durante il turno del protagonista.
 * - Deterministico a parità di stato e seed.
 */
/** Foto dello scontro in corso (solo dati): salvata dopo ogni azione per riprendere esattamente da lì. */
export type BattleSnapshot = Record<(typeof SNAPSHOT_KEYS)[number], unknown> & { alarmed: string[] };
const SNAPSHOT_KEYS = ['units', 'energy', 'potions', 'phase', 'round', 'queue', 'nextUid', 'lethalSaved', 'reviveUsed', 'focusUid', 'koCount', 'swarmMult', 'tally', 'chargedHit', 'parried', 'freePowerUsed'] as const;

export class Battle {
  readonly units: Unit[];
  readonly powers: Ability[];
  energy: number;
  potions: number;
  phase: Phase = 'awaitingInput';
  round = 0;
  private queue: string[] = [];
  private nextUid = 100;
  private lethalSaved = false;
  /** La Perla del Ritorno è stata usata in questa battaglia (la scena lo segna nella run). */
  reviveUsed = false;
  /** Ultimo nemico scelto dal giocatore: i compagni attaccano lui (fuoco concentrato). */
  private focusUid?: string;
  koCount = 0;
  /** Danno di ogni acino dello sciame (Uva Sciame): l'ultimo livello usato. */
  private swarmMult = 0;
  /** Statistiche dell'eroe in questo scontro (riepilogo della run e simulatore). */
  readonly tally: BattleTally;
  /** Durante un colpo caricato: la Difesa para di più (vedi `combat.charged`). */
  private chargedHit = false;
  private parried = false;
  /** (F4b) Nemici a cui la vedetta ha già interrotto una carica in questo scontro. */
  private alarmed = new Set<string>();
  /** (F4b) Moneta del Primo Colpo: il primo potere della battaglia è gratis. */
  private freePowerUsed = false;
  /** Energia massima (Clessidra di Sabbia Nera: +1). */
  get energyMax(): number { return C.energyMax + (this.mods.energyMaxBonus ?? 0); }
  /** Costo effettivo di un potere (primo gratis con la Moneta). */
  powerCost(a: Ability): number { return this.mods.firstPowerFree && !this.freePowerUsed ? 0 : a.cost ?? 0; }

  constructor(setup: BattleSetup, private readonly rng: Rng, private readonly mods: BattleMods = setup.mods) {
    this.units = [setup.hero, ...setup.companions, ...setup.enemies];
    this.units.forEach((u, i) => (u.order = i));
    this.powers = setup.powers;
    this.potions = setup.potions;
    this.tally = { damageTaken: 0, healed: 0, lifesteal: 0, potions: 0, minHp: setup.hero.hp, heroTurns: 0 };
    this.energy = Math.min(this.energyMax, C.energyStart + (this.mods.energyBonus ?? 0));
    for (const c of this.units) if (c.kind === 'companion' && this.mods.companionStartCharge) c.charge = Math.min(c.chargeMax, c.charge + this.mods.companionStartCharge);
    const hpPct = this.mods.enemyStartHpPct;
    if (hpPct !== undefined && hpPct < 1) for (const e of this.enemies()) e.hp = Math.max(1, Math.round(e.maxHp * hpPct));
    for (const e of this.enemies()) this.planNext(e, []);
    if (this.mods.eliteAffixes) for (const e of this.enemies()) { const d = ENEMY_BY_ID.get(e.defId)!; if (d.tier === 'elite' && !d.miniBoss) this.giveAffixes(e, this.mods.eliteAffixes); }
  }

  /** Affissi delle élite (F1): estratti senza ripetizioni; gli effetti fissi si applicano subito. */
  private giveAffixes(e: Unit, n: number): void {
    const pool = [...AFFIXES];
    e.affixes = [];
    for (let i = 0; i < n && pool.length; i++) e.affixes.push(pool.splice(Math.floor(this.rng.next() * pool.length), 1)[0]);
    if (hasAffix(e, 'armored')) { e.def += AF.armored.def; e.statuses.push({ id: 'shield', turns: 3, value: Math.round(e.maxHp * AF.armored.shieldPct) }); }
    if (hasAffix(e, 'commander')) for (const o of this.enemies()) if (o !== e) this.addStatus(o, { id: 'atkUp', turns: 99, value: AF.commander.atkUp });
  }

  // --- salvataggio ---------------------------------------------------------------
  snapshot(): BattleSnapshot {
    const self = this as unknown as Record<string, unknown>;
    const data = Object.fromEntries(SNAPSHOT_KEYS.map((k) => [k, self[k]]));
    return JSON.parse(JSON.stringify({ ...data, alarmed: [...this.alarmed] })) as BattleSnapshot;
  }

  /** Ricostruisce lo scontro salvato senza rifare la preparazione (che consumerebbe il generatore casuale). */
  static restore(snap: BattleSnapshot, powers: Ability[], mods: BattleMods, rng: Rng): Battle {
    const data = JSON.parse(JSON.stringify(snap)) as BattleSnapshot;
    const b = Object.create(Battle.prototype) as Battle;
    return Object.assign(b as object, data, { alarmed: new Set(data.alarmed), powers, mods, rng }) as unknown as Battle;
  }

  // --- interrogazioni ----------------------------------------------------------
  get hero(): Unit { return this.units[0]; }
  alive(side?: Side): Unit[] { return this.units.filter((u) => u.hp > 0 && (!side || u.side === side)); }
  enemies(): Unit[] { return this.alive('enemy'); }
  unit(uid: string): Unit | undefined { return this.units.find((u) => u.uid === uid); }
  canUsePower(a: Ability): boolean { return this.phase === 'awaitingInput' && this.energy >= this.powerCost(a); }
  canSpecial(u: Unit): boolean { return this.phase === 'awaitingInput' && u.hp > 0 && u.kind === 'companion' && u.charge >= u.chargeMax; }

  /** Avvia la battaglia: risolve i turni fino al primo input del giocatore. */
  start(): BattleEvent[] {
    const ev: BattleEvent[] = [];
    for (const e of this.enemies()) { if (e.affixes?.length) ev.push({ t: 'affixes', uid: e.uid, affixes: e.affixes }); ev.push(this.intentEvent(e)); }
    if (this.mods.openingShield) this.applyEffect(this.hero, this.hero, { kind: 'shield', amount: this.mods.openingShield }, ev, false);
    this.advance(ev);
    return ev;
  }

  act(action: PlayerAction): BattleEvent[] {
    if (this.phase !== 'awaitingInput') throw new Error('La battaglia non attende input');
    const ev: BattleEvent[] = [];
    const hero = this.hero;
    if (action.type !== 'special') this.tally.heroTurns++;
    switch (action.type) {
      case 'special': {
        const c = this.unit(action.companionUid);
        if (!c || !this.canSpecial(c)) throw new Error('Speciale non disponibile');
        const def = COMPANION_BY_ID.get(c.defId)!;
        c.charge = 0;
        ev.push({ t: 'charge', uid: c.uid, value: 0 });
        this.useAbility(c, def.special, action.targetUid, ev, { isSpecial: true });
        if (this.mods.specialEnergy) { this.energy = Math.min(this.energyMax, this.energy + this.mods.specialEnergy); ev.push({ t: 'energy', value: this.energy }); }
        this.checkEnd(ev);
        return ev; // azione gratuita: il turno del protagonista continua
      }
      case 'attack':
        this.focusUid = action.targetUid;
        this.useAbility(hero, BASIC_ATTACK, action.targetUid, ev);
        this.twinStrike(BASIC_ATTACK, action.targetUid, ev);
        this.hookPoison(action.targetUid, ev);
        break;
      case 'power': {
        const a = this.powers.find((p) => p.id === action.abilityId);
        if (!a || !this.canUsePower(a)) throw new Error('Potere non disponibile');
        this.energy -= this.powerCost(a);
        this.freePowerUsed = true;
        ev.push({ t: 'energy', value: this.energy });
        if (a.target === 'enemy') this.focusUid = action.targetUid;
        this.useAbility(hero, a, action.targetUid, ev, { isPower: true });
        this.twinStrike(a, action.targetUid, ev, true);
        if (a.effects.some((e) => e.kind === 'extraAction') && !this.checkEnd(ev)) {
          ev.push({ t: 'extraAction', uid: hero.uid });
          return ev; // stesso turno: il protagonista agisce ancora
        }
        break;
      }
      case 'guard':
        this.useAbility(hero, GUARD, hero.uid, ev);
        this.energy = Math.min(this.energyMax, this.energy + C.guardEnergy + (this.mods.guardEnergyBonus ?? 0));
        ev.push({ t: 'energy', value: this.energy });
        break;
      case 'potion': {
        if (this.potions <= 0) throw new Error('Nessuna pozione');
        this.potions--;
        this.tally.potions++;
        ev.push({ t: 'use', uid: hero.uid, ability: 'potion', name: 'Pozione' });
        this.heal(hero, Math.round(hero.maxHp * (this.mods.potionHealPct ?? C.potionHealPct)), ev);
        break;
      }
    }
    if (!this.checkEnd(ev)) this.swarmStrike(ev);
    this.endTurn(hero);
    if (!this.checkEnd(ev)) this.advance(ev);
    return ev;
  }

  /** Amo Arrugginito: l'attacco base può avvelenare il bersaglio. */
  private hookPoison(targetUid: string, ev: BattleEvent[]): void {
    const P = this.mods.basicPoison;
    const t = this.unit(targetUid);
    if (!P || !t || t.hp <= 0 || this.rng.next() >= P.chance) return;
    this.applyEffect(this.hero, t, { kind: 'status', status: 'poison', turns: P.turns, value: P.value }, ev, false);
  }

  /** La gemella ripete il colpo dell'eroe (solo la parte di danno), con il suo rapporto. */
  private twinStrike(a: Ability, chosen: string | undefined, ev: BattleEvent[], isPower = false): void {
    const twin = this.getStatus(this.hero, 'twin');
    if (!twin || this.checkEnd(ev)) return;
    const effects = a.effects.filter((e): e is Extract<Effect, { kind: 'damage' }> => e.kind === 'damage').map((e) => ({ ...e, mult: e.mult * twin.value, lifesteal: undefined }));
    if (!effects.length) return;
    this.useAbility(this.hero, { ...a, id: 'twin_strike', name: 'Gemella', effects }, chosen, ev, { isPower, isTwin: true });
  }

  /** A fine turno dell'eroe ogni acino dello sciame colpisce il bersaglio scelto. */
  private swarmStrike(ev: BattleEvent[]): void {
    const sw = this.getStatus(this.hero, 'swarm');
    if (!sw || sw.value <= 0) return;
    ev.push({ t: 'swarm', count: sw.value });
    for (let i = 0; i < sw.value; i++) {
      const foes = this.enemies();
      if (!foes.length) break;
      const t = foes.find((f) => f.uid === this.focusUid) ?? foes[0];
      this.applyEffect(this.hero, t, { kind: 'damage', mult: this.swarmMult }, ev, false, 'swarm');
    }
  }

  // --- ciclo dei turni ---------------------------------------------------------
  private advance(ev: BattleEvent[]): void {
    for (let guard = 0; guard < 500; guard++) {
      if (this.checkEnd(ev)) return;
      if (this.queue.length === 0) this.newRound(ev);
      const u = this.unit(this.queue.shift()!);
      if (!u || u.hp <= 0) continue;

      ev.push({ t: 'turn', uid: u.uid });
      this.tickDots(u, ev);
      if (u.hp <= 0) continue;
      if (u.kind === 'enemy') this.enemyTurnStart(u, ev);
      this.removeStatus(u, 'guard');
      const bub = this.getStatus(u, 'bubble');
      if (bub) {
        // nella bolla non si agisce; all'ultimo turno la bolla scoppia
        bub.turns--;
        const pop = bub.turns <= 0;
        ev.push({ t: 'bubbled', uid: u.uid, pop });
        this.interruptCharge(u, ev);
        if (pop) { this.removeStatus(u, 'bubble'); this.applyDamage(u, this.mitigate(u, bub.value), ev, 'hero', false, 'pop'); }
        this.endTurn(u);
        continue;
      }
      const stun = this.getStatus(u, 'stun');
      if (stun) {
        ev.push({ t: 'stunned', uid: u.uid });
        // (F5) congelamenti di più turni: si consuma un turno alla volta
        if (--stun.turns <= 0) this.removeStatus(u, 'stun');
        this.interruptCharge(u, ev);
        this.endTurn(u);
        continue;
      }
      if (u.kind === 'hero') {
        // Teschio del Patto: il prezzo a ogni tuo turno (non uccide)
        const pact = Math.min(this.mods.selfDamagePerTurn ?? 0, u.hp - 1);
        if (pact > 0) this.applyDamage(u, pact, ev, u.uid, false, 'pact');
        this.phase = 'awaitingInput';
        return;
      }
      if (u.kind === 'companion') this.companionTurn(u, ev);
      else {
        this.enemyTurn(u, ev);
        u.turns = (u.turns ?? 0) + 1;
        if (hasAffix(u, 'swift') && u.turns % AF.swift.every === 0 && u.hp > 0 && !this.checkEnd(ev)) {
          ev.push({ t: 'swift', uid: u.uid });
          this.enemyTurn(u, ev);
        }
        this.enemyTurnEnd(u, ev);
      }
      this.endTurn(u);
    }
    throw new Error('Ciclo di battaglia senza uscita');
  }

  private newRound(ev: BattleEvent[]): void {
    this.round++;
    ev.push({ t: 'round', n: this.round });
    if (this.round > 1) {
      const eel = this.mods.energyEvery && this.round % this.mods.energyEvery === 0 ? 1 : 0;
      this.energy = Math.min(this.energyMax, this.energy + C.energyPerRound + eel);
      ev.push({ t: 'energy', value: this.energy });
    }
    this.queue = this.alive()
      .slice()
      .sort((a, b) => this.effSpd(b) - this.effSpd(a) || (a.side === b.side ? 0 : a.side === 'ally' ? -1 : 1) || a.order - b.order)
      .map((u) => u.uid);
  }

  /** Velocità effettiva (rallentamenti inclusi): decide l'ordine del round. */
  effSpd(u: Unit): number {
    return u.spd * (1 - this.statusValue(u, 'slow'));
  }

  private endTurn(u: Unit): void {
    for (const s of u.statuses) if (TIMED.includes(s.id)) s.turns--;
    u.statuses = u.statuses.filter((s) => s.turns > 0 || KEPT.includes(s.id));
  }

  private tickDots(u: Unit, ev: BattleEvent[]): void {
    for (const s of u.statuses.filter((x) => x.id === 'burn' || x.id === 'poison' || x.id === 'acid')) {
      if (u.hp <= 0) break;
      this.applyDamage(u, s.value, ev, u.uid, false, s.id as 'burn' | 'poison' | 'acid');
      if (s.id === 'acid') s.value = Math.round(s.value * C.acidGrowth); // l'acido corrode sempre di più
      s.turns--;
    }
    u.statuses = u.statuses.filter((s) => !((s.id === 'burn' || s.id === 'poison' || s.id === 'acid') && s.turns <= 0));
    // mina: esplode all'inizio del turno di chi la porta
    const mine = this.getStatus(u, 'mine');
    if (mine && u.hp > 0) {
      this.removeStatus(u, 'mine');
      this.applyDamage(u, this.mitigate(u, mine.value), ev, 'hero', false, 'mine');
      // (F5) Bomba Grappolo: le schegge colpiscono gli altri nemici
      if (mine.splash) for (const o of this.alive(u.side)) if (o.uid !== u.uid) this.applyDamage(o, this.mitigate(o, mine.value * mine.splash), ev, 'hero', false, 'mine');
    }
  }

  /** Danno "grezzo" (già moltiplicato per l'ATT di chi lo lancia) ridotto dalla difesa del bersaglio. */
  private mitigate(target: Unit, raw: number): number {
    let dmg = raw * (100 / (100 + this.effDef(target) * C.defFactor));
    if (this.hasStatus(target, 'vulnerable')) dmg *= C.vulnerableMult;
    return Math.max(1, Math.round(dmg));
  }

  /** Difesa effettiva: la corazza la alza, l'acido la annulla. */
  private effDef(u: Unit): number {
    if (this.hasStatus(u, 'acid')) return 0;
    return Math.max(0, u.def) * (1 + this.statusValue(u, 'defUp'));
  }

  /** ATT dell'unità; l'eroe ha +N per ogni compagno in piedi con la Bandiera di Ciurma. */
  private atkOf(u: Unit): number {
    if (u.kind !== 'hero' || !this.mods.atkPerCompanion) return u.atk;
    return u.atk + this.mods.atkPerCompanion * this.alive('ally').filter((a) => a.kind === 'companion').length;
  }

  /** ATT "grezzo" di chi lancia un potere ritardato (mina, bolla). */
  private rawPower(actor: Unit, mult: number, isPower: boolean): number {
    return this.atkOf(actor) * (1 + this.statusValue(actor, 'atkUp')) * (1 - this.statusValue(actor, 'weak')) * mult * (isPower ? this.mods.powerDamageMult : 1);
  }

  private companionTurn(u: Unit, ev: BattleEvent[]): void {
    const def = COMPANION_BY_ID.get(u.defId)!;
    const allies = this.alive('ally');
    const when = def.auto.when;
    if (when === 'fuse') {
      // Ottavio: un turno accende la miccia (visibile), quello dopo spara
      if (!u.fuse) {
        u.fuse = true;
        ev.push({ t: 'fuse', uid: u.uid });
      } else {
        u.fuse = false;
        this.useAbility(u, def.auto, this.focusUid, ev);
      }
    } else if (when === 'enemyCharging') {
      // Strillo: avvista chi carica e lo disturba (una volta per nemico)
      const charging = this.enemies().find((e) => e.chargeState && !this.alarmed.has(e.uid));
      if (charging) {
        this.alarmed.add(charging.uid);
        this.useAbility(u, def.auto, charging.uid, ev);
        this.interruptCharge(charging, ev);
      } else this.useAbility(u, BASIC_ATTACK, this.focusUid, ev);
    } else {
      const useAuto = when === 'always' || allies.some((a) => a.hp < a.maxHp / 2);
      this.useAbility(u, useAuto ? def.auto : BASIC_ATTACK, this.focusUid, ev);
    }
    if (u.charge < u.chargeMax) {
      u.charge++;
      ev.push({ t: 'charge', uid: u.uid, value: u.charge });
    }
  }

  private enemyTurn(u: Unit, ev: BattleEvent[]): void {
    const def = ENEMY_BY_ID.get(u.defId)!;
    let moveId = u.nextMove!;
    if (def.enrage && !u.enraged && u.hp <= u.maxHp / 2) {
      u.enraged = true;
      u.chargeState = undefined; // la furia ha la precedenza sulla carica
      moveId = def.enrage;
      if (def.phase2) { u.phase = 2; u.patternIndex = 0; ev.push({ t: 'phase', uid: u.uid, name: def.phase2.name }); }
      else ev.push({ t: 'enrage', uid: u.uid });
    }
    if (u.chargeState === 'windup') {
      // turno di carica: conferma il bersaglio (se è caduto, ne sceglie un altro)
      u.windupLeft = (u.windupLeft ?? 1) - 1;
      if (u.windupLeft <= 0) u.chargeState = 'release';
      if (this.moveOf(u).target === 'enemy' && !this.aliveAlly(u.aimUid)) u.aimUid = this.pickAim(u, true);
      ev.push({ t: 'windup', uid: u.uid, aim: u.aimUid });
      ev.push(this.intentEvent(u));
      return;
    }
    const move = def.moves[moveId];
    if (u.chargeState === 'release') {
      u.chargeState = undefined;
      this.releaseCharged(u, move, ev);
    } else {
      this.useAbility(u, move, move.target === 'enemy' ? this.aimFor(u) : undefined, ev);
    }
    if (u.hp > 0) this.planNext(u, ev);
  }

  /** Il colpo caricato parte: più forte, parabile con la Difesa (anche al posto di un compagno). */
  private releaseCharged(u: Unit, move: Ability, ev: BattleEvent[]): void {
    const K = C.charged;
    let aim = move.target === 'enemy' ? this.aimFor(u) : undefined;
    const hero = this.hero;
    if (aim && aim !== hero.uid && hero.hp > 0 && this.hasStatus(hero, 'guard')) {
      ev.push({ t: 'cover', uid: hero.uid, ally: aim });
      aim = hero.uid;
    }
    const boosted: Ability = { ...move, effects: move.effects.map((e) => (e.kind === 'damage' ? { ...e, mult: e.mult * (this.mods.chargedMult ?? K.mult) } : e)) };
    this.chargedHit = true;
    this.parried = false;
    try { this.useAbility(u, boosted, aim, ev); } finally { this.chargedHit = false; }
    if (this.parried && hero.hp > 0) {
      this.energy = Math.min(this.energyMax, this.energy + K.parryEnergy);
      ev.push({ t: 'parry', uid: hero.uid, energy: K.parryEnergy });
      ev.push({ t: 'energy', value: this.energy });
      if (this.mods.parryShield) this.applyEffect(hero, hero, { kind: 'shield', amount: this.mods.parryShield }, ev, false);
      if (this.mods.parryBoost) { this.addStatus(hero, { id: 'atkUp', turns: 1, value: this.mods.parryBoost }); ev.push({ t: 'status', target: hero.uid, status: 'atkUp', turns: 1 }); }
    }
  }

  /** Inizio turno di un nemico: rigenerazione (dati o affisso). */
  private enemyTurnStart(u: Unit, ev: BattleEvent[]): void {
    const pct = (ENEMY_BY_ID.get(u.defId)!.regen ?? 0) + (hasAffix(u, 'regen') ? AF.regen.pct : 0);
    if (pct > 0 && u.hp < u.maxHp) this.heal(u, Math.max(1, Math.round(u.maxHp * pct)), ev);
  }

  /** Fine turno di un nemico: chi cambia fase alterna l'immunità ai poteri. */
  private enemyTurnEnd(u: Unit, ev: BattleEvent[]): void {
    if (u.hp <= 0 || !ENEMY_BY_ID.get(u.defId)!.phaseShift) return;
    if (this.hasStatus(u, 'immune')) this.removeStatus(u, 'immune');
    else { u.statuses.push({ id: 'immune', turns: 99, value: 0 }); ev.push({ t: 'status', target: u.uid, status: 'immune', turns: 1 }); }
    ev.push({ t: 'cleanse', target: u.uid }); // la scena ridisegna gli stati
  }

  /** Esplosione alla morte: colpisce tutta la squadra (la Difesa la dimezza). */
  private burst(u: Unit, ev: BattleEvent[]): void {
    const B = ENEMY_BY_ID.get(u.defId)!.deathBurst!;
    ev.push({ t: 'burst', uid: u.uid });
    for (const a of this.alive('ally')) {
      let dmg = this.mitigate(a, u.atk * B.mult);
      if (this.hasStatus(a, 'guard')) dmg = Math.max(1, Math.round(dmg * (this.mods.guardMult ?? C.guardMult)));
      this.applyDamage(a, dmg, ev, u.uid, false, 'blast');
      if (B.poison && a.hp > 0) { this.addStatus(a, { id: 'poison', turns: 3, value: B.poison }); ev.push({ t: 'status', target: a.uid, status: 'poison', turns: 3 }); }
    }
  }

  /** Congelato o nella bolla mentre carica: il colpo va perso e si passa alla mossa dopo. */
  private interruptCharge(u: Unit, ev: BattleEvent[]): void {
    if (u.kind !== 'enemy' || !u.chargeState || u.hp <= 0) return;
    u.chargeState = undefined;
    ev.push({ t: 'interrupt', uid: u.uid });
    this.planNext(u, ev);
  }

  private planNext(u: Unit, ev: BattleEvent[]): void {
    const def = ENEMY_BY_ID.get(u.defId)!;
    const pattern = u.phase === 2 && def.phase2 ? def.phase2.pattern : def.pattern;
    u.nextMove = pattern[u.patternIndex % pattern.length];
    u.patternIndex++;
    const mv = def.moves[u.nextMove];
    u.chargeState = isCharged(mv) ? 'windup' : undefined;
    u.windupLeft = u.chargeState ? mv.windup ?? 1 : undefined;
    u.aimUid = mv.target === 'enemy' ? this.pickAim(u, !!u.chargeState) : undefined;
    ev.push(this.intentEvent(u));
  }

  /** Fumetto dell'intenzione: per i colpi caricati mostra anche chi è nel mirino. */
  intentEvent(u: Unit): Extract<BattleEvent, { t: 'intent' }> {
    const mv = this.moveOf(u);
    if (u.chargeState === 'windup') return { t: 'intent', uid: u.uid, intent: 'charge', move: u.nextMove!, aim: u.aimUid, label: (u.windupLeft ?? 1) > 1 ? `Carica… ${u.windupLeft}` : 'Carica…' };
    if (u.chargeState === 'release') return { t: 'intent', uid: u.uid, intent: 'heavy', move: u.nextMove!, aim: u.aimUid, label: `${mv.name}!` };
    return { t: 'intent', uid: u.uid, intent: mv.intent ?? 'attack', move: u.nextMove! };
  }

  private aliveAlly(uid?: string): Unit | undefined {
    const a = uid ? this.unit(uid) : undefined;
    return a && a.side === 'ally' && a.hp > 0 ? a : undefined;
  }

  /** Bersaglio della mossa: quello scelto al momento dell'intenzione, se è ancora in piedi. */
  private aimFor(u: Unit): string | undefined {
    return this.taunter()?.uid ?? this.aliveAlly(u.aimUid)?.uid ?? this.pickAim(u, false);
  }

  /** (F4b) Alleato in Provocazione (Gonfiata): attira tutti i colpi singoli. */
  private taunter(): Unit | undefined {
    return this.alive('ally').find((a) => this.hasStatus(a, 'taunt'));
  }

  /**
   * Chi prende di mira un nemico (F1): l'eroe, l'alleato più malconcio (in % di HP)
   * o uno a caso, con le probabilità di `BALANCE.enemies.aim` per grado.
   * I colpi caricati puntano soprattutto all'eroe (`combat.charged.aimHero`).
   */
  private pickAim(u: Unit, charged: boolean): string | undefined {
    const allies = this.alive('ally');
    if (!allies.length) return undefined;
    const def = ENEMY_BY_ID.get(u.defId)!;
    const taunt = this.taunter();
    if (taunt) return taunt.uid;
    if (def.aim === 'companions') {
      const comps = allies.filter((a) => a.kind !== 'hero');
      return (comps.length ? comps.reduce((m, a) => (a.hp / a.maxHp < m.hp / m.maxHp ? a : m)) : allies[0]).uid;
    }
    // (F4b) Gonfio: i colpi normali vanno spesso su di lui
    const prov = charged ? undefined : allies.find((a) => a.kind === 'companion' && COMPANION_BY_ID.get(a.defId)?.provoke);
    if (prov && this.rng.next() < COMPANION_BY_ID.get(prov.defId)!.provoke!) return prov.uid;
    const tier = def.tier;
    const w = charged ? { hero: C.charged.aimHero, weakest: 1 - C.charged.aimHero } : BALANCE.enemies.aim[tier];
    const r = this.rng.next();
    const hero = allies.find((a) => a.kind === 'hero');
    if (hero && r < w.hero) return hero.uid;
    if (r < w.hero + w.weakest) {
      const others = allies.filter((a) => a.kind !== 'hero');
      const pool = others.length ? others : allies;
      return pool.reduce((m, a) => (a.hp / a.maxHp < m.hp / m.maxHp ? a : m)).uid;
    }
    return this.rng.pick(allies).uid;
  }

  moveOf(u: Unit): Ability {
    return ENEMY_BY_ID.get(u.defId)!.moves[u.nextMove!];
  }

  // --- risoluzione abilità -------------------------------------------------------
  private targets(actor: Unit, a: Ability, chosen?: string): Unit[] {
    const foes = this.alive(actor.side === 'ally' ? 'enemy' : 'ally');
    const friends = this.alive(actor.side);
    switch (a.target) {
      case 'self': return [actor];
      case 'allAllies': return friends;
      case 'allEnemies': return foes;
      case 'lowestAlly': return friends.length ? [friends.reduce((m, f) => (f.hp / f.maxHp < m.hp / m.maxHp ? f : m))] : [];
      case 'enemy': {
        const pick = chosen ? foes.find((f) => f.uid === chosen) : undefined;
        if (pick) return [pick];
        if (actor.side === 'enemy') return foes.length ? [this.rng.pick(foes)] : []; // senza mira (es. evocati a metà turno)
        // alleati senza bersaglio scelto: il nemico più debole (scelta "ragionevole")
        return foes.length ? [foes.reduce((m, f) => (f.hp < m.hp ? f : m))] : [];
      }
    }
  }

  private useAbility(actor: Unit, a: Ability, chosen: string | undefined, ev: BattleEvent[], flags: { isPower?: boolean; isSpecial?: boolean; isTwin?: boolean } = {}): void {
    ev.push({ t: 'use', uid: actor.uid, ability: a.id, name: a.name, ...flags });
    // effetti su chi lancia (sciame, gemella): una volta sola, anche se il potere colpisce tutti
    for (const eff of a.effects) {
      if (eff.kind === 'swarm') {
        const cur = this.getStatus(actor, 'swarm');
        const n = Math.min(eff.max, (cur?.value ?? 0) + eff.count);
        this.swarmMult = Math.max(this.swarmMult, eff.mult);
        if (cur) cur.value = n; else actor.statuses.push({ id: 'swarm', turns: 99, value: n });
        ev.push({ t: 'status', target: actor.uid, status: 'swarm', turns: n });
      }
      if (eff.kind === 'drainEnergy' && actor.side === 'enemy') {
        // in Difesa l'eroe non si fa rubare energia
        const amt = this.hasStatus(this.hero, 'guard') ? 0 : Math.min(this.energy, eff.amount);
        if (amt > 0) { this.energy -= amt; ev.push({ t: 'drain', uid: actor.uid, amount: amt, energy: this.energy }); ev.push({ t: 'energy', value: this.energy }); }
      }
      if (eff.kind === 'twin') {
        // +1: il turno in corso non deve consumarla
        this.addStatus(actor, { id: 'twin', turns: eff.turns + 1, value: eff.ratio });
        ev.push({ t: 'status', target: actor.uid, status: 'twin', turns: eff.turns });
      }
    }
    this.targets(actor, a, chosen).forEach((target, ti) => {
      for (const raw of a.effects) {
        if (target.hp <= 0 && raw.kind !== 'summon' && raw.kind !== 'energyOnKill') break;
        // F2: il furto vita dei colpi ad area vale solo sul primo bersaglio
        const eff = ti > 0 && raw.kind === 'damage' && raw.lifesteal ? { ...raw, lifesteal: undefined } : raw;
        this.applyEffect(actor, target, eff, ev, flags.isPower ?? false);
      }
    });
    // F4: onda d'urto dei frutti "di potenziamento": colpisce tutti i nemici dopo il resto
    for (const eff of a.effects) if (eff.kind === 'shockwave') {
      for (const f of this.alive(actor.side === 'ally' ? 'enemy' : 'ally')) this.applyEffect(actor, f, { kind: 'damage', mult: eff.mult }, ev, flags.isPower ?? false);
    }
  }

  private applyEffect(actor: Unit, target: Unit, eff: Effect, ev: BattleEvent[], isPower: boolean, kind: DamageKind = 'hit'): void {
    switch (eff.kind) {
      case 'damage': {
        for (let h = 0; h < (eff.hits ?? 1) && target.hp > 0 && actor.hp > 0; h++) {
          if (this.rng.next() < this.statusValue(target, 'evade')) { ev.push({ t: 'dodge', target: target.uid }); continue; }
          if (isPower && this.hasStatus(target, 'immune')) { ev.push({ t: 'immune', target: target.uid }); continue; }
          const atkUp = this.statusValue(actor, 'atkUp');
          let dmg = this.atkOf(actor) * (1 + atkUp) * (1 - this.statusValue(actor, 'weak')) * eff.mult;
          if (actor.side === 'ally' && this.mods.poisonedVulnMult && this.hasStatus(target, 'poison')) dmg *= this.mods.poisonedVulnMult;
          if (isPower) dmg *= this.mods.powerDamageMult;
          if (actor.kind === 'companion') dmg *= this.mods.companionDmgMult ?? 1;
          dmg *= 100 / (100 + this.effDef(target) * C.defFactor);
          dmg *= 1 - C.variance + this.rng.next() * C.variance * 2;
          const crit = this.rng.next() < C.critChance + (actor.kind === 'hero' ? this.mods.critBonus ?? 0 : 0);
          if (crit) dmg *= C.critMult;
          if (this.hasStatus(target, 'vulnerable')) dmg *= C.vulnerableMult;
          if (this.hasStatus(target, 'guard')) {
            dmg *= this.chargedHit ? C.charged.guardMult : this.mods.guardMult ?? C.guardMult;
            if (this.chargedHit && target.kind === 'hero') this.parried = true;
          }
          const incoming = Math.max(1, Math.round(dmg));
          if (eff.pierce) { const sh = this.getStatus(target, 'shield'); if (sh && sh.value > 0) { this.removeStatus(target, 'shield'); ev.push({ t: 'melt', target: target.uid, amount: sh.value }); } }
          const dealt = this.applyDamage(target, incoming, ev, actor.uid, crit, kind);
          if (eff.lifesteal && dealt > 0) {
            const want = Math.round(dealt * eff.lifesteal), room = actor.maxHp - actor.hp;
            this.heal(actor, want, ev, true);
            // (F5) Patto di Sangue: la cura in eccesso diventa scudo
            if (eff.overhealShield && want > room) this.applyEffect(actor, actor, { kind: 'shield', amount: want - room }, ev, false);
          }
          if (hasAffix(actor, 'vampire') && dealt > 0 && actor.hp > 0) this.heal(actor, Math.max(1, Math.round(dealt * AF.vampire.lifesteal)), ev);
          if (hasAffix(target, 'spiky') && actor.side === 'ally' && actor.hp > 0) this.applyDamage(actor, Math.max(1, Math.round(incoming * AF.spiky.reflect)), ev, target.uid, false, 'reflect');
          const refl = this.statusValue(target, 'reflect');
          // lo specchio riflette il colpo intero, anche quello parato dallo scudo
          if (refl > 0 && actor.uid !== target.uid) this.applyDamage(actor, Math.max(1, Math.round(incoming * refl)), ev, target.uid, false, 'reflect');
          // Aculei di Riccio: chi colpisce l'eroe si punge
          const thorns = this.mods.thornsPct ?? 0;
          if (thorns > 0 && target.kind === 'hero' && actor.side === 'enemy' && actor.hp > 0) this.applyDamage(actor, Math.max(1, Math.round(incoming * thorns)), ev, target.uid, false, 'reflect');
          const RP = this.mods.retaliatePoison;
          if (RP && target.kind === 'hero' && actor.side === 'enemy' && actor.hp > 0 && this.rng.next() < RP.chance) {
            this.addStatus(actor, { id: 'poison', turns: RP.turns, value: RP.value });
            ev.push({ t: 'status', target: actor.uid, status: 'poison', turns: RP.turns });
          }
        }
        break;
      }
      case 'heal': this.heal(target, Math.round(target.maxHp * eff.pctMaxHp), ev); break;
      case 'shield': {
        const amount = target.kind === 'hero' && this.mods.shieldMult ? Math.round(eff.amount * this.mods.shieldMult) : eff.amount;
        const s = this.getStatus(target, 'shield');
        // F6: gli scudi si sommano, ma non oltre il doppio dello scudo appena ricevuto (niente accumulo infinito)
        if (s) { s.value = Math.min(s.value + amount, Math.max(s.value, amount * 2)); s.turns = 3; } else target.statuses.push({ id: 'shield', turns: 3, value: amount });
        ev.push({ t: 'shield', target: target.uid, amount });
        break;
      }
      case 'status': {
        if (eff.chance !== undefined && this.rng.next() >= eff.chance) { ev.push({ t: 'resist', target: target.uid, status: eff.status }); break; }
        // un potenziamento su se stessi non deve "scadere" subito alla fine del turno in corso
        const extra = target.uid === actor.uid && TIMED.includes(eff.status) ? 1 : 0;
        const PB = eff.status === 'poison' && actor.side === 'ally' ? this.mods.poisonBonus : undefined;
        const tdef = target.kind === 'enemy' ? ENEMY_BY_ID.get(target.defId) : undefined;
        const bossCap = eff.status === 'stun' && (tdef?.tier === 'boss' || tdef?.miniBoss) ? 1 : Infinity; // boss e Capibanda: max 1 turno
        this.addStatus(target, { id: eff.status, turns: Math.min(bossCap, eff.turns + extra + (PB?.turns ?? 0)), value: (eff.value ?? 0) + (PB?.value ?? 0) });
        ev.push({ t: 'status', target: target.uid, status: eff.status, turns: eff.turns + (PB?.turns ?? 0) });
        if (eff.status === 'taunt') {
          // tutti i nemici con una mossa a bersaglio singolo cambiano mira
          for (const e of this.enemies()) if (e.nextMove && this.moveOf(e).target === 'enemy') { e.aimUid = target.uid; ev.push(this.intentEvent(e)); }
        }
        break;
      }
      case 'cleanse':
        target.statuses = target.statuses.filter((s) => !NEGATIVE.includes(s.id));
        ev.push({ t: 'cleanse', target: target.uid });
        break;
      case 'stealShield': {
        const sh = this.getStatus(target, 'shield');
        if (!sh || sh.value <= 0) break;
        this.removeStatus(target, 'shield');
        const mine = this.getStatus(actor, 'shield');
        if (mine) { mine.value += sh.value; mine.turns = 3; } else actor.statuses.push({ id: 'shield', turns: 3, value: sh.value });
        ev.push({ t: 'steal', source: actor.uid, target: target.uid, amount: sh.value });
        break;
      }
      case 'extraAction': case 'swarm': case 'twin': case 'drainEnergy': case 'shockwave': break; // gestite in act() / useAbility()
      case 'energyOnKill':
        if (target.hp <= 0 && target.side !== actor.side && actor.kind === 'hero') { this.energy = Math.min(this.energyMax, this.energy + eff.amount); ev.push({ t: 'energy', value: this.energy }); }
        break;
      case 'chargeAllies':
        for (const c of this.alive('ally')) if (c.kind === 'companion' && c.charge < c.chargeMax) { c.charge = Math.min(c.chargeMax, c.charge + eff.amount); ev.push({ t: 'charge', uid: c.uid, value: c.charge }); }
        break;
      case 'meltShield': {
        const sh = this.getStatus(target, 'shield');
        if (!sh || sh.value <= 0) break;
        this.removeStatus(target, 'shield');
        ev.push({ t: 'melt', target: target.uid, amount: sh.value });
        break;
      }
      case 'bubble': {
        const boss = target.kind === 'enemy' && ENEMY_BY_ID.get(target.defId)?.tier === 'boss';
        const turns = boss ? 1 : eff.turns;
        this.addStatus(target, { id: 'bubble', turns, value: this.rawPower(actor, eff.popMult, isPower) });
        ev.push({ t: 'status', target: target.uid, status: 'bubble', turns });
        break;
      }
      case 'mine': {
        const cur = this.getStatus(target, 'mine');
        const raw = this.rawPower(actor, eff.mult, isPower);
        if (cur) { cur.value += raw; cur.splash = Math.max(cur.splash ?? 0, eff.splash ?? 0); } else target.statuses.push({ id: 'mine', turns: 1, value: raw, splash: eff.splash });
        ev.push({ t: 'status', target: target.uid, status: 'mine', turns: 1 });
        break;
      }
      case 'summon': {
        if (this.alive(actor.side).length >= eff.maxEnemies) break;
        const u = makeEnemyUnit(eff.enemyId, `e${this.nextUid++}`, this.mods.enemyScale);
        u.order = this.units.length;
        this.units.push(u);
        ev.push({ t: 'summon', unit: u });
        this.planNext(u, ev);
        break; // l'intenzione la emette già planNext
      }
    }
  }

  /** Applica danno passando prima dallo scudo; ritorna gli HP effettivamente tolti. */
  private applyDamage(target: Unit, amount: number, ev: BattleEvent[], source: string, crit: boolean, kind: DamageKind): number {
    let absorbed = 0;
    const shield = this.getStatus(target, 'shield');
    if (shield && kind !== 'burn' && kind !== 'poison' && kind !== 'acid') {
      absorbed = Math.min(shield.value, amount);
      shield.value -= absorbed;
      if (shield.value <= 0) this.removeStatus(target, 'shield');
    }
    let dealt = amount - absorbed;
    if (dealt >= target.hp && target.kind === 'hero' && this.mods.surviveLethalOnce && !this.lethalSaved) {
      this.lethalSaved = true;
      dealt = target.hp - 1;
      target.hp = 1;
      this.tally.damageTaken += dealt; this.tally.minHp = 1;
      ev.push({ t: 'damage', source, target: target.uid, amount: dealt, absorbed, crit, kind });
      ev.push({ t: 'survive', uid: target.uid });
      return dealt;
    }
    if (dealt >= target.hp && target.kind === 'hero' && this.mods.reviveOncePct && !this.reviveUsed) {
      // Perla del Ritorno: una volta per run l'eroe torna in piedi
      this.reviveUsed = true;
      const before = target.hp;
      this.tally.damageTaken += before; this.tally.minHp = 0;
      target.hp = Math.max(1, Math.round(target.maxHp * this.mods.reviveOncePct));
      ev.push({ t: 'damage', source, target: target.uid, amount: before, absorbed, crit, kind });
      ev.push({ t: 'survive', uid: target.uid, by: 'pearl' });
      ev.push({ t: 'heal', target: target.uid, amount: target.hp });
      return before;
    }
    dealt = Math.min(dealt, target.hp);
    target.hp -= dealt;
    if (target.kind === 'hero') { this.tally.damageTaken += dealt; this.tally.minHp = Math.min(this.tally.minHp, target.hp); }
    ev.push({ t: 'damage', source, target: target.uid, amount: dealt, absorbed, crit, kind });
    // ogni colpo nemico sull'eroe fa scoppiare un acino dello sciame
    const sw = target.kind === 'hero' && kind === 'hit' && dealt > 0 ? this.getStatus(target, 'swarm') : undefined;
    if (sw && sw.value > 0) { sw.value--; ev.push({ t: 'swarmLoss', count: sw.value }); }
    if (target.hp <= 0 && target.kind === 'enemy') {
      const d = ENEMY_BY_ID.get(target.defId)!;
      if (d.reviveOnce && !target.revived) {
        target.revived = true;
        target.statuses = [];
        target.hp = Math.max(1, Math.round(target.maxHp * d.reviveOnce));
        target.chargeState = undefined;
        ev.push({ t: 'rise', uid: target.uid, hp: target.hp });
        return dealt;
      }
    }
    if (target.hp <= 0) {
      target.statuses = [];
      if (target.side === 'ally') this.koCount++;
      ev.push({ t: 'ko', uid: target.uid });
      if (target.kind === 'enemy' && ENEMY_BY_ID.get(target.defId)!.deathBurst) this.burst(target, ev);
    }
    return dealt;
  }

  private heal(target: Unit, amount: number, ev: BattleEvent[], lifesteal = false): void {
    const healed = Math.min(amount, target.maxHp - target.hp);
    target.hp += healed;
    if (target.kind === 'hero') { this.tally.healed += healed; if (lifesteal) this.tally.lifesteal += healed; }
    ev.push({ t: 'heal', target: target.uid, amount: healed });
  }

  private checkEnd(ev: BattleEvent[]): boolean {
    if (this.phase !== 'awaitingInput' && (this.phase === 'victory' || this.phase === 'defeat')) return true;
    if (this.hero.hp <= 0) { this.phase = 'defeat'; ev.push({ t: 'end', result: 'defeat' }); return true; }
    if (this.enemies().length === 0) { this.phase = 'victory'; ev.push({ t: 'end', result: 'victory' }); return true; }
    return false;
  }

  // --- stati ---------------------------------------------------------------------
  hasStatus(u: Unit, id: StatusId): boolean { return u.statuses.some((s) => s.id === id); }
  getStatus(u: Unit, id: StatusId): StatusInstance | undefined { return u.statuses.find((s) => s.id === id); }
  private statusValue(u: Unit, id: StatusId): number { return this.getStatus(u, id)?.value ?? 0; }
  private removeStatus(u: Unit, id: StatusId): void { u.statuses = u.statuses.filter((s) => s.id !== id); }
  private addStatus(u: Unit, s: StatusInstance): void {
    const cur = this.getStatus(u, s.id);
    if (cur) { cur.turns = Math.max(cur.turns, s.turns); cur.value = Math.max(cur.value, s.value); }
    else u.statuses.push({ ...s });
  }
}

// --- costruzione unità ---------------------------------------------------------------
function baseUnit(partial: Partial<Unit> & Pick<Unit, 'uid' | 'defId' | 'name' | 'side' | 'kind' | 'maxHp' | 'atk' | 'def' | 'spd'>): Unit {
  return { hp: partial.maxHp, statuses: [], order: 0, charge: 0, chargeMax: 0, patternIndex: 0, enraged: false, ...partial };
}

/** `scale` = rinforzo dell'area (1 nella prima). */
export function makeEnemyUnit(enemyId: string, uid: string, scale: EnemyScale = { hp: 1, atk: 1 }): Unit {
  const d = ENEMY_BY_ID.get(enemyId);
  if (!d) throw new Error(`Nemico sconosciuto: ${enemyId}`);
  const E = BALANCE.enemies;
  const T = E.tier[d.tier];
  const X = scale.tier?.[d.tier] ?? { hp: 1, atk: 1 };
  return baseUnit({ uid, defId: d.id, name: d.name, side: 'enemy', kind: 'enemy', maxHp: Math.round(d.stats.maxHp * E.hpMult * T.hp * X.hp * scale.hp), atk: Math.round(d.stats.atk * E.atkMult * T.atk * X.atk * scale.atk), def: d.stats.def, spd: d.stats.spd });
}

/** `scale` = crescita del compagno nel mare corrente (vedi `companionScale`). */
export function makeCompanionUnit(companionId: string, uid: string, hp?: number, charge = 0, scale: { hp: number; atk: number } = { hp: 1, atk: 1 }): Unit {
  const d = COMPANION_BY_ID.get(companionId);
  if (!d) throw new Error(`Compagno sconosciuto: ${companionId}`);
  const maxHp = Math.round(d.stats.maxHp * scale.hp);
  return baseUnit({ uid, defId: d.id, name: d.name, side: 'ally', kind: 'companion', maxHp, hp: Math.min(maxHp, hp ?? maxHp), atk: Math.round(d.stats.atk * scale.atk), def: d.stats.def, spd: d.stats.spd, charge, chargeMax: d.chargeMax });
}

export function makeHeroUnit(name: string, stats: { maxHp: number; atk: number; def: number; spd: number }, hp: number): Unit {
  return baseUnit({ uid: 'hero', defId: 'hero', name, side: 'ally', kind: 'hero', ...stats, hp });
}

/** Le mosse "forti" a danno (intenzione `heavy`) diventano colpi caricati (F1). */
export function isCharged(a: Ability): boolean {
  return (a.intent === 'heavy' || a.windup !== undefined) && a.effects.some((e) => e.kind === 'damage');
}
