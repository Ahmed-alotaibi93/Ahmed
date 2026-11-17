import { Suspense } from "react";
import { BookingDetail } from "@/components/BookingDetail";
import { RequireAuth } from "@/components/LoginForm";
import { Spinner } from "@/components/ui";

export default function BookingPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <RequireAuth>
        <BookingDetail />
      </RequireAuth>
    </Suspense>
  );
}
