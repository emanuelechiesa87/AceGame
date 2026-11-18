import { BALANCE } from '../data/balance';
import { effectiveStats } from '../state/RunState';
import type { RunController } from './RunController';

export interface EventOutcome { text: string; fruitOffer?: string; artifactOffer?: string }

/** Applica l'esito di un evento narrativo. Le offerte di frutti/artefatti
 *  passano poi dalla stessa logica delle ricompense (limite 3 frutti). */
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
      if (ctl.rng.next() < 0.4) {
        const fruit = ctl.randomNewFruit();
        if (fruit) return { text: '«Affare fatto!» Ti porge un frutto luminoso.', fruitOffer: fruit };
      }
      return { text: 'Ti porge... una patata. Il viandante è già sparito.' };
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
    default:
      return { text: 'Prosegui per la tua strada.' };
  }
}

export const REST_HEAL = BALANCE.rewards.restHealPct;
