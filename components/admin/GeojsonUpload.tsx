import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface GeoJsonUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (data: any) => void
}

export function GeoJsonUploadModal({ isOpen, onClose, onUpload }: GeoJsonUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (file) {
      const text = await file.text()
      const json = JSON.parse(text)
      onUpload(json)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload GeoJSON File</DialogTitle>
        </DialogHeader>
        <Input type="file" accept=".geojson,.json" onChange={handleFileChange} />
        <Button onClick={handleUpload} disabled={!file}>
          Upload
        </Button>
      </DialogContent>
    </Dialog>
  )
}

