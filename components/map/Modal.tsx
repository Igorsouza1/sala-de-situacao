"use client"

import type React from "react"
import { X, Pencil } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  showEdit?: boolean
  onEdit?: () => void
}

export function Modal({
  isOpen,
  onClose,
  children,
  showEdit = false,
  onEdit,
}: ModalProps) {
  if (!isOpen) return null

  return (
    /* Backdrop — blur saturate à la Apple sub-nav-frosted */
    <div
      className="fixed inset-0 z-[2000] flex justify-center items-center p-4"
      style={{ background: "rgba(0,0,0,0.36)", backdropFilter: "blur(20px) saturate(180%)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="
          w-full
          max-w-[92vw]
          sm:max-w-[72vw]
          md:max-w-[60vw]
          lg:max-w-[52vw]
          xl:max-w-[46vw]
          animate-in fade-in-0 zoom-in-95 duration-200
        "
        style={{
          background: "#ffffff",
          borderRadius: 20,
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.08)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── Floating action buttons ── */}
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {showEdit && onEdit && (
            <IconButton onClick={onEdit} title="Editar">
              <Pencil size={13} strokeWidth={2} />
            </IconButton>
          )}
          <IconButton onClick={onClose} title="Fechar">
            <X size={14} strokeWidth={2} />
          </IconButton>
        </div>

        {/* ── Content ── */}
        <ScrollArea className="h-[78vh] p-6">
          {children}
        </ScrollArea>
      </div>
    </div>
  )
}

function IconButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        border: "none",
        background: "rgba(0,0,0,0.07)",
        color: "#1d1d1f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "background 140ms ease, transform 100ms ease",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.13)" }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.07)" }}
      onMouseDown={(e)  => { e.currentTarget.style.transform = "scale(0.92)" }}
      onMouseUp={(e)    => { e.currentTarget.style.transform = "scale(1)" }}
    >
      {children}
    </button>
  )
}
