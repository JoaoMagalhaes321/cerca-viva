import { describe, expect, it } from 'vitest';
import { ADUBADA, DURACAO, aoExpirar, efeitoNaPlanta, plantarConsomeCinza, pocasQueEletrificam, reacaoDoTerreno } from '../src/terreno';
import type { TileHazard } from '../src/types';

const sempre = () => 0; // sorte sempre dá certo
const nunca = () => 1;

describe('Reações do terreno', () => {
  it('fogo derrete gelo (vira poça), queima o veneno e evapora a poça', () => {
    expect(reacaoDoTerreno('ice_patch', 'fire')?.hazard).toBe('puddle');
    expect(reacaoDoTerreno('toxic_pool', 'fire')?.hazard).toBe('scorched');
    expect(reacaoDoTerreno('puddle', 'fire')?.hazard).toBe('none');
  });

  it('fogo em chão limpo às vezes queima a grama', () => {
    expect(reacaoDoTerreno('none', 'fire', sempre)?.hazard).toBe('scorched');
    expect(reacaoDoTerreno('none', 'fire', nunca)).toBeNull();
  });

  it('água apaga o chão queimado e molha o chão', () => {
    expect(reacaoDoTerreno('scorched', 'water')?.hazard).toBe('none');
    expect(reacaoDoTerreno('none', 'water', sempre)?.hazard).toBe('puddle');
  });

  it('gelo congela a poça; veneno contamina a poça; raio eletrifica', () => {
    expect(reacaoDoTerreno('puddle', 'ice')?.hazard).toBe('ice_patch');
    expect(reacaoDoTerreno('electrified_puddle', 'ice')?.hazard).toBe('ice_patch');
    expect(reacaoDoTerreno('puddle', 'toxin')?.hazard).toBe('toxic_pool');
    expect(reacaoDoTerreno('puddle', 'electric')?.hazard).toBe('electrified_puddle');
    expect(reacaoDoTerreno('none', 'ice')).toBeNull();
  });

  it('chão queimado vira cinza ao apagar; cinza dura bastante e some depois', () => {
    expect(aoExpirar('scorched')).toBe('ash');
    expect(DURACAO.ash).toBeGreaterThan(30);
    expect(aoExpirar('ash')).toBe('none');
    expect(aoExpirar('electrified_puddle')).toBe('puddle');
  });

  it('plantar em cima da cinza consome a cinza e aduba', () => {
    expect(plantarConsomeCinza('ash')).toBe(true);
    expect(plantarConsomeCinza('none')).toBe(false);
    expect(ADUBADA.dano).toBeGreaterThan(1);
  });

  it('o raio corre pelas poças encostadas, mas para no chão seco', () => {
    const linha: TileHazard[] = ['none', 'puddle', 'puddle', 'electrified_puddle', 'puddle', 'none', 'puddle', 'none', 'none'];
    expect(pocasQueEletrificam(linha, 3).sort()).toEqual([1, 2, 4]);
    expect(pocasQueEletrificam(['none', 'puddle', 'none'], 1)).toEqual([]);
  });

  it('o terreno mexe com a planta: poça cura, queimado e veneno machucam quem não é do elemento', () => {
    expect(efeitoNaPlanta('puddle', 'nature').vidaPorSeg).toBeGreaterThan(0);
    expect(efeitoNaPlanta('scorched', 'nature').vidaPorSeg).toBeLessThan(0);
    expect(efeitoNaPlanta('scorched', 'fire').vidaPorSeg).toBe(0);
    expect(efeitoNaPlanta('scorched', 'fire').ritmo).toBeGreaterThan(1);
    expect(efeitoNaPlanta('toxic_pool', 'toxin').ritmo).toBeGreaterThan(1);
    expect(efeitoNaPlanta('ice_patch', 'ice').ritmo).toBeGreaterThan(1);
    expect(efeitoNaPlanta('ice_patch', 'fire').ritmo).toBeLessThan(1);
    expect(efeitoNaPlanta('none', 'nature')).toEqual({ ritmo: 1, vidaPorSeg: 0 });
  });
});
