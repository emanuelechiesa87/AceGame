import { COLORS, GAME_WIDTH, TEXTURE_SCALE } from '../app/config';
import { runLook } from '../data/fruitLooks';
import { CREATURE_SCALE } from '../pixel/creatures';
import { creatureKey, iconKey } from '../pixel/keys';
import type { NodeType } from '../data/areas';
import { BALANCE } from '../data/balance';
import { COMPANION_BY_ID } from '../data/companions';
import { GameSession } from '../state/GameSession';
import { Audio } from '../systems/Audio';
import type { ShopItem } from '../systems/RunController';
import { resolveEvent } from '../systems/EventResolver';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { HeroRig } from '../ui/HeroRig';
import { artifactName, offerArtifact, offerCompanion } from '../ui/Offers';
import { addBody, addTitle, fitWidth } from '../ui/text';
import { icon, panel } from '../ui/widgets';
import { BaseScene } from './BaseScene';
import { finishNode } from './flow';

/** Nodi non di combattimento: riposo, reclutamento, eventi misteriosi. */
export class EventScene extends BaseScene {
  private buttons: Button[] = [];
  private body!: Phaser.GameObjects.Text;
  private hero!: HeroRig;

  constructor() {
    super('Event');
  }

  create(data: { node: NodeType }): void {
    this.setupCamera();
    const run = GameSession.run;
    if (!run) { this.scene.start('Menu'); return; }
    this.buttons = [];
    new BiomeBackdrop(this, { groundTop: 700, tint: GameSession.ctl?.area.tint, theme: GameSession.ctl?.area.backdrop });
    this.hero = new HeroRig(this, 200, 756, run.avatar === 'a' ? 'm' : 'f', 0.8, runLook(run)).idle();
    panel(this, 30, 800, 660, 450, COLORS.panel, 0.96);

    if (data.node === 'rest') this.rest();
    else if (data.node === 'shop') this.shop();
    else if (data.node === 'recruit') this.recruit();
    else this.mystery();
  }

  private header(title: string, iconId: string, text: string): void {
    icon(this, 90, 860, iconKey('node', iconId), 80);
    fitWidth(addTitle(this, 150, 860, title.toUpperCase(), 46).setOrigin(0, 0.5), 520);
    this.body = addBody(this, GAME_WIDTH / 2, 960, text, 27, '#fff7e6').setWordWrapWidth(600);
  }

  private choices(list: { label: string; act: () => void; variant?: 'primary' | 'secondary' | 'danger' }[]): void {
    this.buttons.forEach((b) => b.destroy());
    // con 3 scelte i pulsanti si stringono per restare nel pannello
    const three = list.length >= 3;
    const top = three ? 1030 : 1080, step = three ? 88 : 104, h = three ? 78 : 88;
    this.buttons = list.map((c, i) => new Button(this, GAME_WIDTH / 2, top + i * step, c.label, c.act, { width: 600, height: h, fontSize: c.label.length > 22 ? 28 : 36, variant: c.variant ?? (i === 0 ? 'primary' : 'secondary') }));
  }

  private done(text: string, mood: 'good' | 'bad' | 'neutral' = 'neutral'): void {
    this.body.setText(text);
    if (mood === 'good') this.hero.cheer('happy', 'shout');
    if (mood === 'bad') this.hero.setExpression('closed', 'ouch');
    GameSession.ctl!.completeEvent();
    this.choices([{ label: 'CONTINUA', act: () => finishNode((k, d) => this.goTo(k, d)) }]);
  }

  /** F2: al fuoco si fa UNA cosa sola. */
  private rest(): void {
    const ctl = GameSession.ctl!;
    const R = BALANCE.rest;
    const ko = ctl.companionsKo;
    const koText = ko.length ? ` ${ko.map((c) => COMPANION_BY_ID.get(c.id)?.name).join(' e ')} ${ko.length > 1 ? 'sono' : 'è'} a terra.` : '';
    this.header('Fuoco da campo', 'rest', `Un fuocherello scoppietta. C'è tempo per una cosa sola.${koText}`);
    this.body.setY(935);
    const list: { label: string; act: () => void }[] = [
      { label: `CURA (+${Math.round(R.healPct * 100)}% A TUTTI)`, act: () => { ctl.restHeal(); this.done('Ti senti rinato! Gli HP tuoi e della squadra risalgono.', 'good'); } },
    ];
    if (ko.length) list.push({ label: `RIANIMA ${ko.length > 1 ? 'I COMPAGNI' : (COMPANION_BY_ID.get(ko[0].id)?.name ?? '').toUpperCase()} (${Math.round(R.reviveHpPct * 100)}%)`, act: () => { const n = ctl.reviveCompanions(); this.done(n > 1 ? 'I compagni si rimettono in piedi!' : 'Il compagno si rimette in piedi!', 'good'); } });
    list.push({ label: `ALLENATI (+${R.trainAtk} ATT, +${R.trainMaxHp} HP MAX)`, act: () => { ctl.restTrain(); this.done('Colpi più secchi, fiato più lungo: sei più forte per il resto del viaggio.', 'good'); } });
    this.choices(list);
  }

  /** F2: il Mercante. Si compra quanto si vuole (se bastano le monete), poi si riparte. */
  private shop(): void {
    const ctl = GameSession.ctl!;
    const items = ctl.shopOffers();
    const art = items.find((i): i is Extract<ShopItem, { kind: 'artifact' }> => i.kind === 'artifact');
    const intro = art ? `Sul banco: ${artifactName(art.id)}. ` : '';
    this.header('Mercante', 'shop', '');
    this.body.setY(925);
    const status = (msg = ''): void => { this.body.setText(`${msg || `${intro}Prezzi da pirata.`}\nMonete: ${ctl.coins}`); };
    status();
    const label = (i: ShopItem): string => {
      switch (i.kind) {
        case 'potion': return `POZIONE · ${i.price}`;
        case 'heal': return `CURA ${Math.round(BALANCE.economy.shopHealPct * 100)}% · ${i.price}`;
        case 'revive': return `RIANIMA · ${i.price}`;
        case 'awaken': return `RISVEGLIO · ${i.price}`;
        case 'artifact': return `ARTEFATTO · ${i.price}`;
      }
    };
    this.buttons.forEach((b) => b.destroy());
    const bought = new Set<number>();
    const refresh = (): void => items.forEach((it, i) => this.buttons[i].setEnabled(!bought.has(i) && ctl.coins >= it.price));
    this.buttons = items.map((it, i) => new Button(this, 200 + (i % 2) * 320, 1030 + Math.floor(i / 2) * 94, label(it), () => {
      if (bought.has(i) || !ctl.buy(it)) return;
      bought.add(i);
      Audio.play('reward');
      let msg = 'Affare fatto!';
      if (it.kind === 'artifact') { offerArtifact(it.id); msg = `Ora hai: ${artifactName(it.id)}!`; }
      if (it.kind === 'awaken') { this.hero.setLook(runLook(GameSession.run), true); msg = 'Il frutto si risveglia!'; }
      if (it.kind === 'revive') msg = 'I compagni si rimettono in piedi!';
      if (it.kind === 'heal') msg = 'Una zuppa calda: HP su!';
      if (it.kind === 'potion') msg = 'Una pozione in più nello zaino.';
      this.hero.cheer('happy', 'shout');
      status(msg);
      refresh();
    }, { width: 300, height: 86, fontSize: 30, variant: 'secondary' }));
    refresh();
    const leave = new Button(this, GAME_WIDTH / 2, 1214, 'RIPARTI', () => {
      GameSession.ctl!.completeEvent();
      finishNode((k, d) => this.goTo(k, d));
    }, { width: 300, height: 64, fontSize: 30 });
    this.buttons.push(leave);
  }

  private recruit(): void {
    const ctl = GameSession.ctl!;
    const id = ctl.randomNewCompanion();
    if (!id) { this.header('Sentiero tranquillo', 'recruit', 'Nessuno in vista. La tua squadra è già al completo di amici.'); this.done('Prosegui con la tua squadra.'); return; }
    const def = COMPANION_BY_ID.get(id)!;
    this.add.image(470, 756, creatureKey(id)).setOrigin(0.5, 1).setScale((CREATURE_SCALE[id] * 1.1) / TEXTURE_SCALE);
    this.header(`${def.name} (${def.role})`, 'recruit', `${def.description}\nSpeciale: ${def.special.name} — ${def.special.description}`);
    this.choices([
      { label: `RECLUTA ${def.name.toUpperCase()}!`, act: () => offerCompanion(this, id, (ok) => this.done(ok ? `${def.name} si unisce alla squadra! Agirà da solo; la sua speciale la attivi tu.` : `${def.name} ti saluta e se ne va.`, ok ? 'good' : 'neutral')) },
      { label: 'NO GRAZIE', act: () => this.done(`${def.name} fa spallucce e se ne va.`) },
    ]);
  }

  private mystery(): void {
    const ctl = GameSession.ctl!;
    const ev = ctl.pickEvent();
    this.header(ev.title, 'event', ev.text);
    this.choices(ev.choices.map((c) => ({
      label: c.label.toUpperCase(),
      act: () => {
        const out = resolveEvent(ctl, c.outcome);
        if (out.awakened) { this.hero.setLook(runLook(GameSession.run), true); this.done(out.text, 'good'); }
        else if (out.artifactOffer) { offerArtifact(out.artifactOffer); this.done(`${out.text} Trovi: ${artifactName(out.artifactOffer)}!`, 'good'); }
        else if (out.mood === undefined && /\(-\d/.test(out.text)) this.done(out.text, 'bad');
        else this.done(out.text, out.mood ?? 'neutral');
      },
    })));
  }
}

import type Phaser from 'phaser';
