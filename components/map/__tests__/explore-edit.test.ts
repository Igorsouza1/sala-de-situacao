import type { ConsultaItem } from '@/types/map-consulta'
import { changedFields, initialDraft, saveConsultaEdit } from '../helpers/explore-edit'

const acao = { id: 1, nome: 'Aceiro', nome_registrado: 'Aceiro', descricao: null, status: 'Identificado', categoria: 'Fiscalização' } as ConsultaItem

test('o formulário começa com o que está gravado, e vazio vira texto vazio', () => {
  expect(initialDraft(acao, 'acoes')).toEqual({ nome: 'Aceiro', descricao: '', status: 'Identificado', categoria: 'Fiscalização' })
})

test('manda só o que mudou; apagar um campo manda null; espaços das pontas não contam', () => {
  const initial = { nome: 'Aceiro', descricao: 'velha', status: 'Identificado' }
  expect(changedFields(initial, { nome: ' Aceiro ', descricao: '', status: 'Concluído' })).toEqual({ descricao: null, status: 'Concluído' })
  expect(changedFields(initial, initial)).toEqual({})
})

describe('saveConsultaEdit', () => {
  afterEach(() => { jest.restoreAllMocks() })
  test('devolve o registro novo e o anterior', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ item: { id: 1 }, previous: { nome: 'A' } }) }) as never
    await expect(saveConsultaEdit('acoes', 1, 7, { nome: 'B' })).resolves.toEqual({ item: { id: 1 }, previous: { nome: 'A' } })
  })
  test('mostra a frase do servidor', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Sem permissao de escrita nesta regiao.' }) }) as never
    await expect(saveConsultaEdit('acoes', 1, 7, { nome: 'B' })).rejects.toThrow('Sem permissao de escrita nesta regiao.')
  })
  test('sem internet, nunca mostra o texto cru do navegador', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch')) as never
    await expect(saveConsultaEdit('acoes', 1, 7, { nome: 'B' })).rejects.toThrow(/sem conexão/)
  })
})
