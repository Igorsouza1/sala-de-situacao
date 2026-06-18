export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {"success" in message && (
        <div className="text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          {message.success}
        </div>
      )}
      {"error" in message && (
        <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {message.error}
        </div>
      )}
      {"message" in message && (
        <div className="text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
          {message.message}
        </div>
      )}
    </div>
  );
}
