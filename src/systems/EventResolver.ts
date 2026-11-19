import { BALANCE } from '../data/balance';
import { effectiveStats } from '../state/RunState';
import type { RunController } from './RunController';

export interface EventOutcome { text: string; artifactOffer?: string; awakened?: boolean; mood?: 'good' | 'bad' | 'neutral' }

/** Applica l'esito di un evento narrativo. Gli artefatti offerti passano poi
 *  dalla stessa logica delle ricompense; il risveglio è applicato qui. */
export function resolveEvent(ctl: RunController, outcome: string): EventOutcome {
  const run = ctl.run;
  switch (outcome) {
    case 'spring_drink':
      if (ctl.rng.next() < 0.7) { ctl.healPct(0.4); return { text: 'Deliziosa! Ti senti pieno di energia (+40% HP).' }; }
      run.currentHp = Math.max(1, run.currentHp - 10);
      return { text: 'Blurp. Mal di pancia (-10 HP). Era acqua di palude gassata.' };
    case 'trade_potion_fruit': {
      if (run.potions <= 0) return { text: '«Niente pozioni? Niente affari!» Il viandante sparisce in una nuvola di fumo.' };
      run.potions--;
      if (ctl.rng.next() < 0.5) {
        if (ctl.awaken()) return { text: '«Affare fatto!» Ti spruzza un\'essenza luminosa: il tuo frutto si RISVEGLIA!', awakened: true };
        run.baseStats.atk += 2;
        return { text: '«Il tuo frutto è già al massimo? Allora prendi questo tonico!» (+2 ATT)' };
      }
      return { text: 'Ti porge... una patata. Il mercante è già sparito.' };
    }
    case 'altar_strength':
      run.baseStats.maxHp = Math.max(30, run.baseStats.maxHp - 12);
      run.baseStats.atk += 3;
      run.currentHp = Math.min(run.currentHp, effectiveStats(run).maxHp);
      return { text: 'L\'idolo si illumina. Ti senti più forte, ma un po\' più fragile.' };
    case 'cat_bush': {
      const art = ctl.randomNewArtifact();
      return art && ctl.rng.next() < 0.6 ? { text: 'Nel barile c\'è qualcosa che brilla!', artifactOffer: art } : { text: 'Solo stracci bagnati. Il gatto sembra deluso da te.' };
    }
    case 'cat_pet':
      run.potions++;
      return { text: 'Il gatto fa le fusa e ti lascia una pozione. Gatto gentiluomo.' };
    // --- 0.6.1 ---
    case 'gulls_buy': {
      const art = ctl.randomNewArtifact();
      if (!art) return { text: '«Abbiamo finito la merce, capo.» I gabbiani volano via ridendo.' };
      hurt(run, 15);
      return { text: 'Un beccaccio sul braccio (-15 HP) e il fagotto è tuo.', artifactOffer: art };
    }
    case 'octopus_bet':
      if (run.potions <= 0) return { text: '«Niente pozione, niente gioco!» Il polpo nasconde i bicchieri.' };
      run.potions--;
      if (ctl.rng.next() < 0.5) { run.potions += 2; return { text: 'Indovinato! Il polpo, offeso, ti dà due pozioni (+1 in tutto).', mood: 'good' }; }
      return { text: 'La perla non c\'era in nessun bicchiere. Il polpo è già sparito con la tua pozione.', mood: 'bad' };
    case 'turtle_ride': {
      ctl.healPct(0.2);
      // non si salta mai il boss: serve almeno una tappa normale prima di lui
      if (run.stepIndex + 2 < run.map.length) { run.stepIndex++; return { text: 'Sul guscio, tra un pisolino e l\'altro, salti una tappa (+20% HP).', mood: 'good' }; }
      return { text: '«Il signore di questo mare è vicino, oltre non vado.» Almeno ti sei riposato (+20% HP).', mood: 'good' };
    }
    case 'turtle_advice':
      run.baseStats.maxHp += 4; run.currentHp += 4;
      return { text: '«Mangia bene e dormi molto.» Un consiglio banale, ma ti senti più robusto (+4 HP max).', mood: 'good' };
    case 'clam_reach': {
      const art = ctl.randomNewArtifact();
      if (art && ctl.rng.next() < 0.6) return { text: 'La vongola non si sveglia. Prendi il luccichio!', artifactOffer: art };
      hurt(run, 20);
      return { text: 'CLACK! La vongola si chiude sulla tua mano (-20 HP).', mood: 'bad' };
    }
    case 'medusa_pact':
      if (!ctl.canAwaken) return { text: '«Il tuo frutto non può brillare di più, in questo mare.» La medusa se ne va senza prendere nulla.' };
      ctl.awaken();
      run.baseStats.maxHp = Math.max(30, Math.round(run.baseStats.maxHp * 0.85));
      clampHp(run);
      return { text: 'Una scarica di luce: il tuo frutto si RISVEGLIA! Ti senti però più fragile (-15% HP max).', awakened: true };
    case 'library_read': {
      const r = ctl.rng.next();
      if (r < 0.4) { run.baseStats.atk += 2; return { text: '"Manuale del Pugno Perfetto". Lo leggi d\'un fiato (+2 ATT).', mood: 'good' }; }
      if (r < 0.8) { run.baseStats.def += 2; return { text: '"Come Prenderle Senza Farsi Male". Utilissimo (+2 DIF).', mood: 'good' }; }
      hurt(run, 5);
      return { text: 'Un tomo enorme ti cade in testa (-5 HP). Titolo: "Attenzione agli Scaffali".', mood: 'bad' };
    }
    case 'ghost_cards': {
      const art = ctl.randomNewArtifact('rare');
      if (art && ctl.rng.next() < 0.5) return { text: 'Asso di ossa! I fantasmi applaudono e ti consegnano un tesoro.', artifactOffer: art };
      run.baseStats.maxHp = Math.max(30, Math.round(run.baseStats.maxHp * 0.9));
      clampHp(run);
      return { text: 'Hai perso. Un brivido gelido ti porta via un pezzetto di vita (-10% HP max).', mood: 'bad' };
    }
    case 'cannon_take':
      run.nextBattleEnemyHpPct = 0.7;
      return { text: 'BUUUM! Nella nebbia qualcuno urla. I nemici del prossimo scontro partiranno malconci (-30% HP).', mood: 'good' };
    case 'cook_meal':
      ctl.healPct(0.3);
      return { text: 'Zuppa di alghe e patate. Sorprendentemente buona (+30% HP).', mood: 'good' };
    case 'cook_spicy':
      run.baseStats.maxHp += 5; run.currentHp += 5;
      hurt(run, 10);
      return { text: 'Fuoco in bocca, lacrime agli occhi (-10 HP), ma ti senti temprato (+5 HP max).', mood: 'good' };
    case 'bottle_read': {
      const r = ctl.rng.next();
      if (r < 0.4) { run.potions++; return { text: 'Dentro c\'è una mappa per... un barile qui vicino. Con una pozione!', mood: 'good' }; }
      if (r < 0.75) { run.score += 30; return { text: '"Chi trova questa bottiglia è un vero pirata." Ti senti un vero pirata (+30 punti).', mood: 'good' }; }
      return { text: '"Ricordati di comprare il pane." Firmato: nessuno.' };
    }
    default:
      return { text: 'Prosegui per la tua strada.' };
  }
}

function hurt(run: RunController['run'], n: number): void { run.currentHp = Math.max(1, run.currentHp - n); }
function clampHp(run: RunController['run']): void { run.currentHp = Math.max(1, Math.min(run.currentHp, effectiveStats(run).maxHp)); }

export const REST_HEAL = BALANCE.rewards.restHealPct;
