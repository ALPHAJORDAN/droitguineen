import { LivreDetailsClient } from "./LivreDetailsClient";

export default async function LivreDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <LivreDetailsClient id={id} />;
}
