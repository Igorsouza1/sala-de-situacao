# Design System

## Cores (Brand)

O projeto utiliza uma paleta de cores centralizada no `tailwind.config.ts` sob o namespace `brand`. Utilize essas classes para manter a consistência visual e garantir que alterações de tema reflitam em toda a aplicação.

| Nome | Classe Tailwind | Hex | Uso |
| :--- | :--- | :--- | :--- |
| **Dark** | `bg-brand-dark` | `#0F172A` | Fundo principal da aplicação, headers e footers. |
| **Dark Blue** | `bg-brand-dark-blue` | `#111c35` | Seções com fundo alternativo para contraste (ex: Seção "O Problema"). |
| **Primary** | `text-brand-primary` / `bg-brand-primary` | `#3B82F6` | Cor primária para botões, links, ícones de destaque e acentos visuais. |
| **WhatsApp** | `bg-brand-whatsapp` | `#005c4b` | Usado especificamente para componentes que simulam interface de chat/WhatsApp. |

### Exemplo de Uso

```tsx
// Exemplo de componente utilizando as cores da marca
export function FeatureCard() {
  return (
    <div className="bg-brand-dark-blue p-4 rounded-lg">
      <h3 className="text-brand-primary font-bold">Título em Destaque</h3>
      <p className="text-slate-400">Texto descritivo.</p>
      <button className="bg-brand-primary hover:bg-blue-600 text-white px-4 py-2 rounded">
        Ação
      </button>
    </div>
  )
}
```

> [!NOTE]
> Evite utilizar hex codes hardcoded (`bg-[#0F172A]`) nos componentes. Sempre prefira as classes utilitárias `brand-*`.
