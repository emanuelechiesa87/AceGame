import { BASIC_ATTACK, GUARD } from '../../data/abilities';
import { BALANCE } from '../../data/balance';
import { COMPANION_BY_ID } from '../../data/companions';
import { ENEMY_BY_ID } from '../../data/enemies';
import type { Ability, Effect, StatusId } from '../../types/content';
import type { Rng } from '../Rng';
import type { BattleEvent, BattleMods, Phase, PlayerAction, Side, StatusInstance, Unit } from './types';

const C = BALANCE.combat;
const NEGATIVE: StatusId[] = ['burn', 'poison', 'stun', 'vulnerable', 'slow'];
/** Stati che scadono alla fine del turno di chi li porta. */
const TIMED: StatusId[] = ['atkUp', 'vulnerable', 'shield', 'defUp', 'evade', 'slow', 'reflect'];

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
  koCount = 0;

  constructor(setup: BattleSetup, private readonly rng: Rng, private readonly mods: BattleMods = setup.mods) {
    this.units = [setup.hero, ...setup.companions, ...setup.enemies];
    this.units.forEach((u, i) => (u.order = i));
    this.powers = setup.powers;
    this.potions = setup.potions;
    this.energy = C.energyStart;
    for (const e of this.enemies()) this.planNext(e, []);
  }

  // --- interrogazioni ----------------------------------------------------------
  get hero(): Unit { return this.units[0]; }
  alive(side?: Side): Unit[] { return this.units.filter((u) => u.hp > 0 && (!side || u.side === side)); }
  enemies(): Unit[] { return this.alive('enemy'); }
  unit(uid: string): Unit | undefined { return this.units.find((u) => u.uid === uid); }
  canUsePower(a: Ability): boolean { return this.phase === 'awaitingInput' && this.energy >= (a.cost ?? 0); }
  canSpecial(u: Unit): boolean { return this.phase === 'awaitingInput' && u.hp > 0 && u.kind === 'companion' && u.charge >= u.chargeMax; }

  /** Avvia la battaglia: risolve i turni fino al primo input del giocatore. */
  start(): BattleEvent[] {
    const ev: BattleEvent[] = [];
    for (const e of this.enemies()) ev.push({ t: 'intent', uid: e.uid, intent: this.moveOf(e).intent ?? 'attack', move: e.nextMove! });
    this.advance(ev);
    return ev;
  }

  act(action: PlayerAction): BattleEvent[] {
    if (this.phase !== 'awaitingInput') throw new Error('La battaglia non attende input');
    const ev: BattleEvent[] = [];
    const hero = this.hero;
    switch (action.type) {
      case 'special': {
        const c = this.unit(action.companionUid);
        if (!c || !this.canSpecial(c)) throw new Error('Speciale non disponibile');
        const def = COMPANION_BY_ID.get(c.defId)!;
        c.charge = 0;
        ev.push({ t: 'charge', uid: c.uid, value: 0 });
        this.useAbility(c, def.special, action.targetUid, ev, { isSpecial: true });
        this.checkEnd(ev);
        return ev; // azione gratuita: il turno del protagonista continua
      }
      case 'attack':
        this.useAbility(hero, BASIC_ATTACK, action.targetUid, ev);
        break;
      case 'power': {
        const a = this.powers.find((p) => p.id === action.abilityId);
        if (!a || !this.canUsePower(a)) throw new Error('Potere non disponibile');
        this.energy -= a.cost ?? 0;
        ev.push({ t: 'energy', value: this.energy });
        this.useAbility(hero, a, action.targetUid, ev, { isPower: true });
        if (a.effects.some((e) => e.kind === 'extraAction') && !this.checkEnd(ev)) {
          ev.push({ t: 'extraAction', uid: hero.uid });
          return ev; // stesso turno: il protagonista agisce ancora
        }
        break;
      }
      case 'guard':
        this.useAbility(hero, GUARD, hero.uid, ev);
        this.energy = Math.min(C.energyMax, this.energy + C.guardEnergy);
        ev.push({ t: 'energy', value: this.energy });
        break;
      case 'potion': {
        if (this.potions <= 0) throw new Error('Nessuna pozione');
        this.potions--;
        ev.push({ t: 'use', uid: hero.uid, ability: 'potion', name: 'Pozione' });
        this.heal(hero, Math.round(hero.maxHp * C.potionHealPct), ev);
        break;
      }
    }
    this.endTurn(hero);
    if (!this.checkEnd(ev)) this.advance(ev);
    return ev;
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
      this.removeStatus(u, 'guard');
      if (this.hasStatus(u, 'stun')) {
        ev.push({ t: 'stunned', uid: u.uid });
        this.removeStatus(u, 'stun');
        this.endTurn(u);
        continue;
      }
      if (u.kind === 'hero') { this.phase = 'awaitingInput'; return; }
      if (u.kind === 'companion') this.companionTurn(u, ev);
      else this.enemyTurn(u, ev);
      this.endTurn(u);
    }
    throw new Error('Ciclo di battaglia senza uscita');
  }

  private newRound(ev: BattleEvent[]): void {
    this.round++;
    ev.push({ t: 'round', n: this.round });
    if (this.round > 1) {
      this.energy = Math.min(C.energyMax, this.energy + C.energyPerRound);
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
    u.statuses = u.statuses.filter((s) => s.turns > 0 || s.id === 'guard' || s.id === 'stun' || s.id === 'burn' || s.id === 'poison');
  }

  private tickDots(u: Unit, ev: BattleEvent[]): void {
    for (const s of u.statuses.filter((x) => x.id === 'burn' || x.id === 'poison')) {
      this.applyDamage(u, s.value, ev, u.uid, false, s.id as 'burn' | 'poison');
      s.turns--;
    }
    u.statuses = u.statuses.filter((s) => !((s.id === 'burn' || s.id === 'poison') && s.turns <= 0));
  }

  private companionTurn(u: Unit, ev: BattleEvent[]): void {
    const def = COMPANION_BY_ID.get(u.defId)!;
    const allies = this.alive('ally');
    const useAuto = def.auto.when === 'always' || allies.some((a) => a.hp < a.maxHp / 2);
    const ability = useAuto ? def.auto : BASIC_ATTACK;
    this.useAbility(u, ability, undefined, ev);
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
      moveId = def.enrage;
      ev.push({ t: 'enrage', uid: u.uid });
    }
    this.useAbility(u, def.moves[moveId], undefined, ev);
    if (u.hp > 0) this.planNext(u, ev);
  }

  private planNext(u: Unit, ev: BattleEvent[]): void {
    const def = ENEMY_BY_ID.get(u.defId)!;
    u.nextMove = def.pattern[u.patternIndex % def.pattern.length];
    u.patternIndex++;
    ev.push({ t: 'intent', uid: u.uid, intent: def.moves[u.nextMove].intent ?? 'attack', move: u.nextMove });
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
        if (actor.side === 'enemy') return foes.length ? [this.rng.pick(foes)] : [];
        // alleati senza bersaglio scelto: il nemico più debole (scelta "ragionevole")
        return foes.length ? [foes.reduce((m, f) => (f.hp < m.hp ? f : m))] : [];
      }
    }
  }

  private useAbility(actor: Unit, a: Ability, chosen: string | undefined, ev: BattleEvent[], flags: { isPower?: boolean; isSpecial?: boolean } = {}): void {
    ev.push({ t: 'use', uid: actor.uid, ability: a.id, name: a.name, ...flags });
    for (const target of this.targets(actor, a, chosen)) {
      for (const eff of a.effects) {
        if (target.hp <= 0 && eff.kind !== 'summon') break;
        this.applyEffect(actor, target, eff, ev, flags.isPower ?? false);
      }
    }
  }

  private applyEffect(actor: Unit, target: Unit, eff: Effect, ev: BattleEvent[], isPower: boolean): void {
    switch (eff.kind) {
      case 'damage': {
        for (let h = 0; h < (eff.hits ?? 1) && target.hp > 0 && actor.hp > 0; h++) {
          if (this.rng.next() < this.statusValue(target, 'evade')) { ev.push({ t: 'dodge', target: target.uid }); continue; }
          const atkUp = this.statusValue(actor, 'atkUp');
          let dmg = actor.atk * (1 + atkUp) * eff.mult;
          if (isPower) dmg *= this.mods.powerDamageMult;
          const def = Math.max(0, target.def) * (1 + this.statusValue(target, 'defUp'));
          dmg *= 100 / (100 + def * C.defFactor);
          dmg *= 1 - C.variance + this.rng.next() * C.variance * 2;
          const crit = this.rng.next() < C.critChance;
          if (crit) dmg *= C.critMult;
          if (this.hasStatus(target, 'vulnerable')) dmg *= C.vulnerableMult;
          if (this.hasStatus(target, 'guard')) dmg *= C.guardMult;
          const dealt = this.applyDamage(target, Math.max(1, Math.round(dmg)), ev, actor.uid, crit, 'hit');
          if (eff.lifesteal && dealt > 0) this.heal(actor, Math.round(dealt * eff.lifesteal), ev);
          const refl = this.statusValue(target, 'reflect');
          if (refl > 0 && dealt > 0 && actor.uid !== target.uid) this.applyDamage(actor, Math.max(1, Math.round(dealt * refl)), ev, target.uid, false, 'reflect');
        }
        break;
      }
      case 'heal': this.heal(target, Math.round(target.maxHp * eff.pctMaxHp), ev); break;
      case 'shield': {
        const s = this.getStatus(target, 'shield');
        if (s) { s.value += eff.amount; s.turns = 3; } else target.statuses.push({ id: 'shield', turns: 3, value: eff.amount });
        ev.push({ t: 'shield', target: target.uid, amount: eff.amount });
        break;
      }
      case 'status': {
        if (eff.chance !== undefined && this.rng.next() >= eff.chance) { ev.push({ t: 'resist', target: target.uid, status: eff.status }); break; }
        // un potenziamento su se stessi non deve "scadere" subito alla fine del turno in corso
        const extra = target.uid === actor.uid && TIMED.includes(eff.status) ? 1 : 0;
        this.addStatus(target, { id: eff.status, turns: eff.turns + extra, value: eff.value ?? 0 });
        ev.push({ t: 'status', target: target.uid, status: eff.status, turns: eff.turns });
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
      case 'extraAction': break; // gestita in act()
      case 'summon': {
        if (this.alive(actor.side).length >= eff.maxEnemies) break;
        const u = makeEnemyUnit(eff.enemyId, `e${this.nextUid++}`);
        u.order = this.units.length;
        this.units.push(u);
        this.planNext(u, []);
        ev.push({ t: 'summon', unit: u });
        ev.push({ t: 'intent', uid: u.uid, intent: this.moveOf(u).intent ?? 'attack', move: u.nextMove! });
        break;
      }
    }
  }

  /** Applica danno passando prima dallo scudo; ritorna gli HP effettivamente tolti. */
  private applyDamage(target: Unit, amount: number, ev: BattleEvent[], source: string, crit: boolean, kind: 'hit' | 'burn' | 'poison' | 'reflect'): number {
    let absorbed = 0;
    const shield = this.getStatus(target, 'shield');
    if (shield && (kind === 'hit' || kind === 'reflect')) {
      absorbed = Math.min(shield.value, amount);
      shield.value -= absorbed;
      if (shield.value <= 0) this.removeStatus(target, 'shield');
    }
    let dealt = amount - absorbed;
    if (dealt >= target.hp && target.kind === 'hero' && this.mods.surviveLethalOnce && !this.lethalSaved) {
      this.lethalSaved = true;
      dealt = target.hp - 1;
      target.hp = 1;
      ev.push({ t: 'damage', source, target: target.uid, amount: dealt, absorbed, crit, kind });
      ev.push({ t: 'survive', uid: target.uid });
      return dealt;
    }
    dealt = Math.min(dealt, target.hp);
    target.hp -= dealt;
    ev.push({ t: 'damage', source, target: target.uid, amount: dealt, absorbed, crit, kind });
    if (target.hp <= 0) {
      target.statuses = [];
      if (target.side === 'ally') this.koCount++;
      ev.push({ t: 'ko', uid: target.uid });
    }
    return dealt;
  }

  private heal(target: Unit, amount: number, ev: BattleEvent[]): void {
    const healed = Math.min(amount, target.maxHp - target.hp);
    target.hp += healed;
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

export function makeEnemyUnit(enemyId: string, uid: string): Unit {
  const d = ENEMY_BY_ID.get(enemyId);
  if (!d) throw new Error(`Nemico sconosciuto: ${enemyId}`);
  return baseUnit({ uid, defId: d.id, name: d.name, side: 'enemy', kind: 'enemy', maxHp: d.stats.maxHp, atk: d.stats.atk, def: d.stats.def, spd: d.stats.spd });
}

export function makeCompanionUnit(companionId: string, uid: string, hp?: number, charge = 0): Unit {
  const d = COMPANION_BY_ID.get(companionId);
  if (!d) throw new Error(`Compagno sconosciuto: ${companionId}`);
  return baseUnit({ uid, defId: d.id, name: d.name, side: 'ally', kind: 'companion', maxHp: d.stats.maxHp, hp: hp ?? d.stats.maxHp, atk: d.stats.atk, def: d.stats.def, spd: d.stats.spd, charge, chargeMax: d.chargeMax });
}

export function makeHeroUnit(name: string, stats: { maxHp: number; atk: number; def: number; spd: number }, hp: number): Unit {
  return baseUnit({ uid: 'hero', defId: 'hero', name, side: 'ally', kind: 'hero', ...stats, hp });
}
