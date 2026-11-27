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
import { pickBranch } from '../ui/branchPicker';
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
    // l'effetto è applicato: si salva subito, così non si può rifare la scelta chiudendo l'app
    GameSession.run!.pending = { phase: 'done' };
    GameSession.persistRun();
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
      { label: `CURA (+${Math.round(ctl.tx.restHealPct * 100)}% A TUTTI)`, act: () => { ctl.restHeal(); this.done('Ti senti rinato! Gli HP tuoi e della squadra risalgono.', 'good'); } },
    ];
    if (ko.length) list.push({ label: `RIANIMA ${ko.length > 1 ? 'I COMPAGNI' : (COMPANION_BY_ID.get(ko[0].id)?.name ?? '').toUpperCase()} (${Math.round(ctl.tx.restRevivePct * 100)}%)`, act: () => { const n = ctl.reviveCompanions(); this.done(n > 1 ? 'I compagni si rimettono in piedi!' : 'Il compagno si rimette in piedi!', 'good'); } });
    list.push({ label: `ALLENATI (+${R.trainAtk} ATT, +${R.trainMaxHp} HP MAX)`, act: () => { ctl.restTrain(); this.done('Colpi più secchi, fiato più lungo: sei più forte per il resto del viaggio.', 'good'); } });
    this.choices(list);
  }

  /** F2: il Mercante. Si compra quanto si vuole (se bastano le monete), poi si riparte. */
  private shop(): void {
    const ctl = GameSession.ctl!;
    const run = GameSession.run!;
    const saved = run.pending?.phase === 'shop' ? run.pending : undefined;
    const items = saved ? saved.items : ctl.shopOffers();
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
    const bought = new Set<number>(saved?.bought);
    const save = (): void => { run.pending = { phase: 'shop', items, bought: [...bought] }; GameSession.persistRun(); };
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
      // col Risveglio si salva solo dopo l'eventuale scelta della strada
      if (it.kind === 'awaken') void pickBranch(this).then(save); else save();
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
    const ids = ctl.randomNewCompanions(2);
    if (!ids.length) { this.header('Sentiero tranquillo', 'recruit', 'Nessuno in vista. La tua squadra è già al completo di amici.'); this.done('Prosegui con la tua squadra.'); return; }
    GameSession.discover({ companions: ids });
    const defs = ids.map((id) => COMPANION_BY_ID.get(id)!);
    const info = (d: (typeof defs)[number]) => `${d.name} (${d.role}): ${d.description}\nSpeciale: ${d.special.name} — ${d.special.description}`;
    // (F4b) due candidati: tocca la figura per leggere chi è
    const xs = defs.length > 1 ? [400, 600] : [470];
    defs.forEach((d, i) => {
      const img = this.add.image(xs[i], 756, creatureKey(d.id)).setOrigin(0.5, 1).setScale((CREATURE_SCALE[d.id] * (defs.length > 1 ? 0.85 : 1.1)) / TEXTURE_SCALE);
      img.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.body.setText(`${d.name} (${d.role}) · ${d.special.name}: ${d.special.description}`).setFontSize(24));
      if (defs.length > 1) addBody(this, xs[i], 772, d.name, 24, '#fff7e6');
    });
    if (defs.length === 1) this.header(`${defs[0].name} (${defs[0].role})`, 'recruit', info(defs[0]));
    else this.header('Marinai in cerca di nave', 'recruit', `${defs.map((d) => d.name).join(' e ')} vogliono salire a bordo, ma c'è posto per uno solo. Tocca chi vuoi conoscere meglio.`);
    const take = (id: string) => {
      const d = COMPANION_BY_ID.get(id)!;
      offerCompanion(this, id, (ok) => this.done(ok ? `${d.name} si unisce alla squadra! Agirà da solo; la sua speciale la attivi tu.` : `${d.name} ti saluta e se ne va.`, ok ? 'good' : 'neutral'));
    };
    this.choices([
      ...defs.map((d) => ({ label: `RECLUTA ${d.name.toUpperCase()}!`, act: () => take(d.id), variant: 'primary' as const })),
      { label: 'NO GRAZIE', act: () => this.done(defs.length > 1 ? 'Li saluti e riparti.' : `${defs[0].name} fa spallucce e se ne va.`), variant: 'secondary' as const },
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
        if (out.awakened) { this.hero.setLook(runLook(GameSession.run), true); void pickBranch(this).then(() => this.done(out.text, 'good')); }
        else if (out.artifactOffer) { offerArtifact(out.artifactOffer); this.done(`${out.text} Trovi: ${artifactName(out.artifactOffer)}!`, 'good'); }
        else if (out.mood === undefined && /\(-\d/.test(out.text)) this.done(out.text, 'bad');
        else this.done(out.text, out.mood ?? 'neutral');
      },
    })));
  }
}

import type Phaser from 'phaser';
