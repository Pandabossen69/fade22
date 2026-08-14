import { BookForm } from "@/components/book-form";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  return <BookForm initialService={service} />;
}
