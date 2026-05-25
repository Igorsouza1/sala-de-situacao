
import ProtectedPage from "@/app/protected/client-page";

export default async function Page() {
  return (
    <div className="h-full">
      <ProtectedPage />
    </div>
  );
}
