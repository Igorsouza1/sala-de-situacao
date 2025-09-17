"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddUserModal } from "./add-user-modal"
import { EditUserModal } from "./edit-user-modal"
import { DeleteConfirmationModal } from "@/components/admin/shared/delete-confirmation-modal"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, KeyRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const MOCK_USERS = [
  { id: "usr_1", name: "Alice", email: "alice@example.com", role: "Admin" },
  { id: "usr_2", name: "Bob", email: "bob@example.com", role: "Editor" },
  { id: "usr_3", name: "Charlie", email: "charlie@example.com", role: "Viewer" },
]

export type User = (typeof MOCK_USERS)[0]

export function UserManager() {
  const [users, setUsers] = useState<User[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    setUsers(MOCK_USERS)
  }, [])

  const handleAddUser = (newUser: Omit<User, "id">) => {
    const userWithId = { ...newUser, id: `usr_${Date.now()}` }
    setUsers((prev) => [...prev, userWithId])
    toast({ title: "Sucesso", description: "Usuário adicionado." })
    setIsAddModalOpen(false)
  }

  const handleEditUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
    toast({ title: "Sucesso", description: "Usuário atualizado." })
    setIsEditModalOpen(false)
    setEditingUser(null)
  }

  const handleDeleteUser = () => {
    if (!deletingUser) return
    setUsers((prev) => prev.filter((user) => user.id !== deletingUser.id))
    toast({ title: "Sucesso", description: "Usuário deletado." })
    setIsDeleteModalOpen(false)
    setDeletingUser(null)
  }

  const handleResetPassword = (user: User) => {
    toast({
      title: "Senha Redefinida",
      description: `Um e-mail para redefinição de senha foi enviado para ${user.email}.`,
    })
  }

  return (
    <div className="h-full p-4 md:p-8 flex flex-col">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Usuários</h1>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-pantaneiro-lime text-primary-dark hover:bg-pantaneiro-lime-hover"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg flex-grow overflow-hidden flex flex-col">
        <ScrollArea className="h-full">
          <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow className="border-b-0">
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500 p-4">
                    Nome
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500 p-4">
                    Email
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500 p-4">
                    Função
                  </TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-gray-500 p-4">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-b hover:bg-pantaneiro-lime/20">
                    <TableCell className="font-medium text-gray-800 p-4">{user.name}</TableCell>
                    <TableCell className="text-gray-600 p-4">{user.email}</TableCell>
                    <TableCell className="p-4">
                      <Badge
                        className={cn(
                          "rounded-full py-1 px-3 text-xs font-medium",
                          user.role === "Admin" ? "bg-pantaneiro-lime text-primary-dark" : "bg-gray-200 text-gray-700",
                        )}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right p-4">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Redefinir Senha"
                          onClick={() => handleResetPassword(user)}
                        >
                          <KeyRound className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => {
                            setEditingUser(user)
                            setIsEditModalOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Deletar"
                          className="hover:bg-destructive/10"
                          onClick={() => {
                            setDeletingUser(user)
                            setIsDeleteModalOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </div>

      <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddUser={handleAddUser} />
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onEditUser={handleEditUser}
        user={editingUser}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        itemName={deletingUser?.name || ""}
      />
    </div>
  )
}
