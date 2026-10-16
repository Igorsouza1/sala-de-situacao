// O estilo dos menus que abrem de um botão ou do botão direito (DESIGN.md 8.1): o mesmo cartão do seletor de cor, nascendo do ponto
// de origem com a mola do projeto. O z-index passa o dock (1000), como o seletor de cor.
export const menuContent =
  'popover-spring z-[1200] min-w-56 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-control'

// Linha do menu: 40 px de altura (é menu de mouse; no toque não há menu), ícone à esquerda, destaque ao passar e ao navegar por teclado.
export const menuItem =
  'relative flex min-h-10 cursor-default select-none items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm outline-hidden transition-colors duration-200 data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground'

// Ação que apaga: a cor diz que é diferente das outras antes de a pessoa ler (4.2)
export const menuItemDanger = 'text-crit data-[highlighted]:bg-crit/10 [&_svg]:text-crit'

export const menuSeparator = '-mx-1 my-1 h-px bg-border'
