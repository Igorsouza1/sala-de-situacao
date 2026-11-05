import { currentRegionLabel, mixesOrganizations, regionCaption, regionHref, type RegionOption } from '../helpers/regions'

const bonito: RegionOption = { id: 1, nome: 'Bonito e Rio da Prata', municipio: 'Bonito', uf: 'MS', organizacao: 'Instituto Homem Pantaneiro' }
const amolar: RegionOption = { id: 2, nome: 'Rede de Proteção e Conservação da Serra do Amolar', municipio: null, uf: null, organizacao: 'Rede Amolar' }

test('a Organização só aparece quando a lista mistura Organizações', () => {
  expect(mixesOrganizations([bonito, amolar])).toBe(true)
  expect(mixesOrganizations([bonito, { ...amolar, organizacao: bonito.organizacao }])).toBe(false)
  expect(regionCaption(bonito, true)).toBe('Bonito/MS · Instituto Homem Pantaneiro')
  expect(regionCaption(bonito, false)).toBe('Bonito/MS')
  expect(regionCaption(amolar, true)).toBe('Rede Amolar')
  expect(regionCaption(amolar, false)).toBeNull()
})

test('diz onde a pessoa está, ou o conjunto quando o endereço não escolhe', () => {
  expect(currentRegionLabel([bonito, amolar], 2)).toBe(amolar.nome)
  expect(currentRegionLabel([bonito, amolar], null)).toBe('Todas as suas regiões')
})

test('troca só a região no endereço', () => {
  expect(regionHref('/protected', '?regiao_id=1&x=y', 2)).toBe('/protected?regiao_id=2&x=y')
  expect(regionHref('/protected', '', 2)).toBe('/protected?regiao_id=2')
})
