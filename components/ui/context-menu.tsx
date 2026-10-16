"use client"

import * as React from "react"
import { ContextMenu as ContextMenuPrimitive } from "radix-ui"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { menuContent, menuItem, menuItemDanger, menuSeparator } from "./menu-style"

// Menu do botão direito (shadcn, com o estilo do projeto). Abre onde o ponteiro está, com a mola do projeto (8.1).
const ContextMenu = ContextMenuPrimitive.Root
const ContextMenuTrigger = ContextMenuPrimitive.Trigger
const ContextMenuSub = ContextMenuPrimitive.Sub
const ContextMenuGroup = ContextMenuPrimitive.Group

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content ref={ref} className={cn(menuContent, className)} {...props} />
  </ContextMenuPrimitive.Portal>
))
ContextMenuContent.displayName = "ContextMenuContent"

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & { danger?: boolean }
>(({ className, danger, ...props }, ref) => (
  <ContextMenuPrimitive.Item ref={ref} className={cn(menuItem, danger && menuItemDanger, className)} {...props} />
))
ContextMenuItem.displayName = "ContextMenuItem"

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger ref={ref} className={cn(menuItem, "data-[state=open]:bg-muted", className)} {...props}>
    {children}
    <ChevronRight className="ml-auto" aria-hidden />
  </ContextMenuPrimitive.SubTrigger>
))
ContextMenuSubTrigger.displayName = "ContextMenuSubTrigger"

const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.SubContent ref={ref} className={cn(menuContent, className)} {...props} />
  </ContextMenuPrimitive.Portal>
))
ContextMenuSubContent.displayName = "ContextMenuSubContent"

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Label ref={ref} className={cn("px-2.5 py-1.5 text-xs text-muted-foreground", className)} {...props} />
))
ContextMenuLabel.displayName = "ContextMenuLabel"

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => <ContextMenuPrimitive.Separator ref={ref} className={cn(menuSeparator, className)} {...props} />)
ContextMenuSeparator.displayName = "ContextMenuSeparator"

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuGroup,
}
