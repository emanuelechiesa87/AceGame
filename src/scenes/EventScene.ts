import { COLORS, GAME_WIDTH, TEXTURE_SCALE } from '../app/config';
import { CREATURE_SCALE } from '../pixel/creatures';
import { creatureKey, iconKey } from '../pixel/keys';
import type { NodeType } from '../data/areas';
import { BALANCE } from '../data/balance';
import { COMPANION_BY_ID } from '../data/companions';
import { EVENTS } from '../data/events';
import { GameSession } from '../state/GameSession';
import { resolveEvent } from '../systems/EventResolver';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { HeroRig } from '../ui/HeroRig';
import { artifactName, offerArtifact, offerCompanion, offerFruit } from '../ui/Offers';
import { addBody, addTitle } from '../ui/text';
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
    new BiomeBackdrop(this, { groundTop: 700 });
    this.hero = new HeroRig(this, 200, 756, run.avatar === 'a' ? 'm' : 'f', 0.8).idle();
    panel(this, 30, 800, 660, 450, COLORS.panel, 0.96);

    if (data.node === 'rest') this.rest();
    else if (data.node === 'recruit') this.recruit();
    else this.mystery();
  }

  private header(title: string, iconId: string, text: string): void {
    icon(this, 90, 860, iconKey('node', iconId), 80);
    addTitle(this, 150, 860, title.toUpperCase(), 46).setOrigin(0, 0.5);
    this.body = addBody(this, GAME_WIDTH / 2, 960, text, 27, '#fff7e6').setWordWrapWidth(600);
  }

  private choices(list: { label: string; act: () => void; variant?: 'primary' | 'secondary' | 'danger' }[]): void {
    this.buttons.forEach((b) => b.destroy());
    this.buttons = list.map((c, i) => new Button(this, GAME_WIDTH / 2, 1080 + i * 104, c.label, c.act, { width: 600, height: 88, fontSize: c.label.length > 22 ? 28 : 36, variant: c.variant ?? (i === 0 ? 'primary' : 'secondary') }));
  }

  private done(text: string, mood: 'good' | 'bad' | 'neutral' = 'neutral'): void {
    this.body.setText(text);
    if (mood === 'good') this.hero.cheer('happy', 'shout');
    if (mood === 'bad') this.hero.setExpression('closed', 'ouch');
    GameSession.ctl!.completeEvent();
    this.choices([{ label: 'CONTINUA', act: () => finishNode((k, d) => this.goTo(k, d)) }]);
  }

  private rest(): void {
    const ctl = GameSession.ctl!;
    this.header('Fuoco da campo', 'rest', 'Un fuocherello scoppietta. Un momento di pace prima di ripartire.');
    this.choices([
      { label: `RIPOSA (+${Math.round(BALANCE.rewards.restHealPct * 100)}% HP)`, act: () => { ctl.healPct(BALANCE.rewards.restHealPct); this.done('Ti senti rinato! Gli HP risalgono.', 'good'); } },
      { label: 'PREPARA UNA POZIONE (+1)', act: () => { ctl.run.potions++; this.done('Mescoli erbe e bacche: una pozione in più nello zaino.', 'good'); } },
    ]);
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
    const ev = ctl.rng.pick(EVENTS);
    this.header(ev.title, 'event', ev.text);
    this.choices(ev.choices.map((c) => ({
      label: c.label.toUpperCase(),
      act: () => {
        const out = resolveEvent(ctl, c.outcome);
        if (out.fruitOffer) offerFruit(this, out.fruitOffer, (ok) => this.done(out.text + (ok ? '' : ' Lo lasci andare.'), 'good'));
        else if (out.artifactOffer) { offerArtifact(out.artifactOffer); this.done(`${out.text} Trovi: ${artifactName(out.artifactOffer)}!`, 'good'); }
        else this.done(out.text, out.text.includes('-') ? 'bad' : 'neutral');
      },
    })));
  }
}

import type Phaser from 'phaser';
