import { Container, Skeleton } from "@/components/ui/layout";

/** Generic page skeleton sized like PageHeader + content to avoid layout shift. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <div>
        <Container className="py-12 lg:py-16">
          <Skeleton className="h-10 w-2/3 max-w-xl" />
          <Skeleton className="mt-5 h-5 w-full max-w-2xl" />
        </Container>
      </div>
      <Container className="grid gap-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </Container>
    </div>
  );
}
