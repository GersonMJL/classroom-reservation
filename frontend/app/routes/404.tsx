export function loader() {
  throw new Response("Não encontrado", { status: 404 });
}

export default function NotFound() {
  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>404</h1>
      <p>A página solicitada não foi encontrada.</p>
    </main>
  );
}
